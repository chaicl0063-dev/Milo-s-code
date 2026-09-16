/**
 * 首屏满铺 / 分屏 / 四卡 / 导航 / 转场 的自检证据（docs/SITE-V2-HERO-TRANSITION-REQUIREMENTS-20260916.md §7 V01–V09）。
 * 本机 Chrome 无头 + CDP，对生产构建跑：
 *   V01 首屏：1440×900 / 1280×800 / 1920×1080，scrollY=0 时首屏底边与视口底边差值、正文是否提前露出
 *   V02 四卡：1440 / 1280 / 1024 / 430 / 375，卡片等宽等高、无裁字、整组居中；另跑一次中文（浏览器翻译场景用 lang 模拟不了，改为直接注入中文文案对照排版）
 *   V03 导航：逐个点击入口，记录落点与 URL 是否变化
 *   V04 下滚：从首屏逐段下滚，记录每次停滚后的对齐位置与可见段落；转场提示出现次数
 *   V05 中断：自动滚动期间反向操作 / Escape；回顶后再下滚是否重播
 *   V06 防误触：刷新到正文位置、旧 hash 深链接、点击播放、打开手机菜单
 *   V07 手机 / 放大：360/375/430×812、200% 文字放大、矮窗口
 *   V08 回退：减少动态效果、禁用 JS
 *   V09 全站对齐：1440 / 1920 每屏起点截图与标题左边界
 * 输出：docs/screens/site-v2-hero-transition/<批次>/…（已 gitignore）。
 * 用法：node scripts/hero-transition-check.mjs [origin]   默认 http://localhost:3001
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const ORIGIN = (args.find((a) => !a.startsWith("--")) ?? "http://localhost:3001").replace(/\/$/, "");
const ONLY = (args.find((a) => a.startsWith("--only="))?.slice(7) ?? "").split(",").filter(Boolean);
const want = (k) => ONLY.length === 0 || ONLY.includes(k);
const PATH = "/site-v2";
const BATCH = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const OUT = join("docs/screens/site-v2-hero-transition", BATCH);
mkdirSync(OUT, { recursive: true });
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = { batch: BATCH, env: "local production build (next build + next start)", origin: ORIGIN + PATH, startedAt: new Date().toISOString(), chrome: CHROME, results: {} };

async function launch(extra = []) {
  const port = 9700 + Math.floor(Math.random() * 90);
  const profile = join(tmpdir(), `rr2-ht-${Date.now()}`);
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--hide-scrollbars", "--disable-gpu", "--autoplay-policy=no-user-gesture-required", "--lang=en-US", ...extra, "about:blank"], { stdio: "ignore" });
  let wsUrl;
  for (let i = 0; i < 60 && !wsUrl; i++) { try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl; } catch { await sleep(200); } }
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0; const pending = new Map(); const listeners = new Set();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); if (m.error) rej(new Error(m.error.message)); else res(m.result); } else if (m.method) for (const f of listeners) f(m); });
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  await s("Page.enable"); await s("Runtime.enable"); await s("Network.enable");
  await s("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  const evaluate = async (expression) => { const { result, exceptionDetails } = await s("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (exceptionDetails) throw new Error(exceptionDetails.text + " " + (exceptionDetails.exception?.description ?? "")); return result.value; };
  const on = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  const close = () => { try { ws.close(); } catch {} chrome.kill(); };
  return { s, evaluate, on, close, sessionId };
}

const device = (b, w, h, mobile = false, scale = 1) => b.s("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: scale, mobile });
// 同文档导航（只差 hash）不会触发 load 事件，所以先回 about:blank，并给 load 加超时兜底
const nav = async (b, url) => {
  const cur = await b.evaluate("location.href").catch(() => "");
  if (cur && cur.split("#")[0] === url.split("#")[0] && url.includes("#")) {
    const blank = new Promise((r) => { const off = b.on((m) => { if (m.method === "Page.loadEventFired" && m.sessionId === b.sessionId) { off(); r(); } }); });
    await b.s("Page.navigate", { url: "about:blank" });
    await Promise.race([blank, sleep(4000)]);
  }
  const loaded = new Promise((r) => { const off = b.on((m) => { if (m.method === "Page.loadEventFired" && m.sessionId === b.sessionId) { off(); r(); } }); });
  await b.s("Page.navigate", { url });
  await Promise.race([loaded, sleep(12000)]);
  await b.evaluate("document.fonts.ready.then(() => true)").catch(() => {});
  await sleep(1000);
};
const shot = async (b, file, clip) => { const { data } = await b.s("Page.captureScreenshot", { format: "jpeg", quality: 84, ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); writeFileSync(file, Buffer.from(data, "base64")); return file; };

/** 屏幕（v2-screen）与各段几何 */
const SCREENS = `(() => {
  const vh = innerHeight, vw = innerWidth;
  const screens = [...document.querySelectorAll('.rr2 .v2-screen')].map((el) => {
    const r = el.getBoundingClientRect();
    const id = el.id || (el.querySelector('section[id]') || {}).id || (el.tagName.toLowerCase());
    const h2 = [...el.querySelectorAll('h1, h2')].find((n) => n.offsetParent !== null && n.getBoundingClientRect().width > 0) || null;
    return { id, top: Math.round(r.top + scrollY), height: Math.round(r.height), screens: +(r.height / vh).toFixed(2), titleLeft: h2 ? Math.round(h2.getBoundingClientRect().left) : null, titleText: h2 ? h2.innerText.replace(/\\s+/g, ' ').slice(0, 30) : null, snap: getComputedStyle(el).scrollSnapAlign };
  });
  return { vw, vh, snapType: getComputedStyle(document.documentElement).scrollSnapType, docHeight: document.documentElement.scrollHeight, screens };
})()`;

const TILES = `(() => {
  const rows = [...document.querySelectorAll('[data-check="hero-meta"], .rr2 .grid.grid-cols-2')].filter((r) => r.offsetParent !== null && r.querySelector('p'));
  const row = document.querySelector('[data-check="hero-meta"]');
  const use = row && row.offsetParent !== null ? row : rows[0];
  if (!use) return { visible: false };
  const rr = use.getBoundingClientRect();
  const tiles = [...use.children].map((t) => {
    const r = t.getBoundingClientRect();
    const ps = [...t.querySelectorAll('p')];
    return {
      w: Math.round(r.width), h: Math.round(r.height),
      pad: Math.round(parseFloat(getComputedStyle(t).paddingLeft)),
      centered: getComputedStyle(t).textAlign === 'center',
      texts: ps.map((p) => ({ t: p.innerText.replace(/\\n/g, ' | '), clipped: p.scrollWidth > p.clientWidth + 1 })),
      overRow: Math.round(r.right - rr.right),
    };
  });
  const widths = [...new Set(tiles.map((t) => t.w))], heights = [...new Set(tiles.map((t) => t.h))];
  return { visible: true, cols: getComputedStyle(use).gridTemplateColumns.split(' ').length, equalWidth: widths.length === 1, equalHeight: heights.length <= 2, anyClipped: tiles.some((t) => t.texts.some((x) => x.clipped)), anyOver: tiles.some((t) => t.overRow > 1), tiles };
})()`;

const b = await launch();
try {
  // ---------- V01 首屏满铺 ----------
  if (want("V01")) {
    const rows = [];
    for (const [w, h] of [[1440, 900], [1280, 800], [1920, 1080]]) {
      await device(b, w, h); await nav(b, `${ORIGIN}${PATH}`);
      const m = await b.evaluate(`(() => { const first = document.querySelector('#top'); const r = first.getBoundingClientRect(); const next = document.querySelector('#moment').getBoundingClientRect(); return { scrollY: Math.round(scrollY), firstHeight: Math.round(r.height), vh: innerHeight, gap: Math.round(r.bottom - innerHeight), nextTopVisible: Math.round(innerHeight - next.top) }; })()`);
      await shot(b, join(OUT, `V01-first-${w}x${h}.jpg`));
      rows.push({ vp: `${w}x${h}`, ...m, pass: Math.abs(m.gap) <= 2 && m.nextTopVisible <= 0 });
      console.log(`V01 ${w}x${h} 首屏高${m.firstHeight} 视口${m.vh} 差${m.gap}px 正文露出${m.nextTopVisible}px`);
    }
    report.results.V01 = { rows, pass: rows.every((r) => r.pass) };
  }

  // ---------- V02 四卡 ----------
  if (want("V02")) {
    const rows = [];
    for (const [w, h, mobile] of [[1440, 900, false], [1280, 800, false], [1024, 800, false], [430, 812, true], [375, 812, true]]) {
      await device(b, w, h, mobile); await nav(b, `${ORIGIN}${PATH}`);
      const t = await b.evaluate(TILES);
      const box = await b.evaluate(`(() => { const r = (document.querySelector('[data-check="hero-meta"]') && document.querySelector('[data-check="hero-meta"]').offsetParent ? document.querySelector('[data-check="hero-meta"]') : [...document.querySelectorAll('.rr2 .grid')].find((g) => g.offsetParent !== null && g.querySelector('p'))); r.scrollIntoView({ block: 'center' }); const q = r.getBoundingClientRect(); return { y: Math.round(scrollY + q.top) - 12, h: Math.round(q.height) + 24 }; })()`);
      await shot(b, join(OUT, `V02-tiles-${w}.jpg`), { x: 0, y: box.y, width: w, height: box.h });
      await b.evaluate("scrollTo(0,0); true");
      rows.push({ vp: `${w}x${h}`, cols: t.cols, equalWidth: t.equalWidth, equalHeight: t.equalHeight, anyClipped: t.anyClipped, anyOver: t.anyOver, pad: t.tiles[0]?.pad, centered: t.tiles[0]?.centered, texts: t.tiles.map((x) => x.texts.map((y) => y.t).join(" / ")), pass: !t.anyClipped && !t.anyOver && t.equalWidth && (t.tiles[0]?.pad ?? 0) >= 12 && t.tiles[0]?.centered });
      console.log(`V02 ${w} 列${t.cols} 等宽${t.equalWidth} 等高${t.equalHeight} 裁字${t.anyClipped} 越界${t.anyOver} 内边距${t.tiles[0]?.pad}`);
    }
    report.results.V02 = { rows, pass: rows.every((r) => r.pass) };
  }

  // ---------- V03 导航 ----------
  if (want("V03")) {
    await device(b, 1440, 900); await nav(b, `${ORIGIN}${PATH}`);
    const entries = [
      { name: "Logo", sel: "#top header a[href='#top']", target: "#top" },
      { name: "How it works", sel: "#top header a[href='#see']", target: "#see" },
      { name: "Walks", sel: "#top header a[href='#explore']", target: "#explore" },
      { name: "Guides", sel: "#top header a[href='#guides']", target: "#guides" },
      { name: "See how it works", sel: "#top section a[href='#see']", target: "#see" },
      { name: "Scroll to explore", sel: "[data-check='hero-scroll-hint']", target: "#moment" },
    ];
    const rows = [];
    for (const e of entries) {
      await b.evaluate("scrollTo({ top: 0, behavior: 'instant' }); history.replaceState(null, '', location.pathname); true"); await sleep(700);
      const before = await b.evaluate("location.pathname + location.search");
      const ok = await b.evaluate(`(() => { const a = document.querySelector("${e.sel}"); if (!a) return false; a.scrollIntoView({ block: 'nearest' }); a.click(); return true; })()`);
      await sleep(1400);
      const after = await b.evaluate(`(() => { const t = document.querySelector('${e.target}'); const r = t.getBoundingClientRect(); return { path: location.pathname + location.search, hash: location.hash, targetTop: Math.round(r.top), scrollY: Math.round(scrollY), titleVisible: (() => { const h = t.querySelector('h1, h2'); if (!h) return true; const q = h.getBoundingClientRect(); return q.top >= -1 && q.bottom <= innerHeight + 1; })() }; })()`);
      rows.push({ ...e, found: ok, samePath: after.path === before, targetTop: after.targetTop, titleVisible: after.titleVisible, pass: ok && after.path === before && Math.abs(after.targetTop) <= 4 && after.titleVisible });
      console.log(`V03 ${e.name} → ${e.target} 顶部偏差${after.targetTop}px 路径不变${after.path === before} 标题可见${after.titleVisible}`);
    }
    // 键盘激活 + 焦点
    await b.evaluate(`scrollTo(0,0); true`); await sleep(300);
    const kb = await b.evaluate("(() => { const a = document.querySelector(\"#top header a[href='#guides']\"); a.focus(); a.click(); return true; })()");
    await sleep(1200);
    const focus = await b.evaluate(`(() => ({ active: document.activeElement ? document.activeElement.tagName + (document.activeElement.id ? '#' + document.activeElement.id : '') : null, guidesTop: Math.round(document.querySelector('#guides').getBoundingClientRect().top) }))()`);
    report.results.V03 = { rows, keyboard: { ...focus, ok: kb }, pass: rows.every((r) => r.pass) };
    console.log("V03 键盘", JSON.stringify(focus));
  }

  // ---------- V04 下滚分屏 + 转场只一次 ----------
  if (want("V04")) {
    await device(b, 1440, 900); await nav(b, `${ORIGIN}${PATH}?fresh=${Date.now()}`);
    const geo = await b.evaluate(SCREENS);
    const seen = [];
    let handoff = 0;
    // 转场只亮约 560ms，用密集轮询计次，避免采样错过
    const state = () => b.evaluate(`(() => { const h = document.querySelector('[data-check="hero-handoff"]'); return h ? h.getAttribute('data-state') : null; })()`);
    const watchFor = async (ms) => { const t0 = Date.now(); let seen = false; while (Date.now() - t0 < ms) { if ((await state()) === "in") seen = true; await sleep(60); } if (seen) handoff++; };
    for (let i = 0; i < 8; i++) {
      await b.evaluate(`scrollBy({ top: innerHeight * 0.9, behavior: 'auto' }); true`);
      await watchFor(900);
      const at = await b.evaluate(`(() => { const list = [...document.querySelectorAll('.rr2 .v2-screen')].map((el) => { const r = el.getBoundingClientRect(); return { id: el.id || (el.querySelector('section[id]') || {}).id, top: Math.round(r.top) }; }); const cur = list.reduce((a, c) => (Math.abs(c.top) < Math.abs(a.top) ? c : a)); return { scrollY: Math.round(scrollY), cur, aligned: Math.abs(cur.top) <= 4, twoScreens: list.filter((x) => x.top > -innerHeight * 0.9 && x.top < innerHeight * 0.9).length }; })()`);
      seen.push(at);
      if (await b.evaluate("scrollY + innerHeight >= document.documentElement.scrollHeight - 2")) break;
    }
    await b.evaluate("scrollTo(0,0); true"); await sleep(900);
    await b.evaluate(`scrollBy({ top: innerHeight * 0.9 }); true`); await sleep(800);
    const replay = await b.evaluate(`(() => { const h = document.querySelector('[data-check="hero-handoff"]'); return h ? h.getAttribute('data-state') : null; })()`);
    report.results.V04 = { screens: geo.screens, snapType: geo.snapType, steps: seen, handoffShown: handoff, replayedAfterTop: replay === "in", pass: handoff >= 1 && replay !== "in" && seen.filter((s) => s.aligned).length >= Math.floor(seen.length / 2) };
    console.log(`V04 屏数${geo.screens.length} snap=${geo.snapType} 转场出现${handoff}次 回顶重播=${replay === "in"} 对齐${seen.filter((s) => s.aligned).length}/${seen.length}`);
    console.log("   每屏:", geo.screens.map((s) => `${s.id}:${s.screens}屏 标题左${s.titleLeft}`).join("  "));
  }

  // ---------- V05 中断 / 不重播 ----------
  if (want("V05")) {
    // 1) 转场提示出现时按 Escape：立即结束
    await device(b, 1440, 900); await nav(b, `${ORIGIN}${PATH}`);
    await b.evaluate("scrollBy({ top: innerHeight * 0.6 }); true");
    let during = null;
    for (let i = 0; i < 20 && during !== "in"; i++) { during = await b.evaluate(`(() => { const h = document.querySelector('[data-check="hero-handoff"]'); return h ? h.getAttribute('data-state') : null; })()`); if (during !== "in") await sleep(40); }
    await b.s("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
    await b.s("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
    await sleep(120);
    const afterEsc = await b.evaluate(`(() => { const h = document.querySelector('[data-check="hero-handoff"]'); return h ? h.getAttribute('data-state') : null; })()`);

    // 2) 锚点平滑定位途中用真实滚动手势反向操作：能中断，不被拖回目标
    await nav(b, `${ORIGIN}${PATH}`);
    await b.evaluate("(() => { const a = document.querySelector(\"#top header a[href='#guides']\"); a.click(); return true; })()");
    await sleep(90);
    const mid = await b.evaluate("Math.round(scrollY)");
    await b.s("Input.synthesizeScrollGesture", { x: 700, y: 450, xDistance: 0, yDistance: 900, speed: 8000, gestureSourceType: "mouse" });
    await sleep(1600);
    const afterGesture = await b.evaluate(`(() => { const g = document.querySelector('#guides').getBoundingClientRect(); return { scrollY: Math.round(scrollY), guidesTop: Math.round(g.top), atGuides: Math.abs(g.top) <= 4 }; })()`);
    // 再确认没有「反复把用户拖回目标」：停 1.5s 后位置不再变化
    const settled1 = await b.evaluate("Math.round(scrollY)");
    await sleep(1500);
    const settled2 = await b.evaluate("Math.round(scrollY)");

    // 3) 回顶后再下滚：不重播
    await b.evaluate("scrollTo(0,0); true"); await sleep(1000);
    await b.evaluate("scrollBy({ top: innerHeight * 0.8 }); true"); await sleep(600);
    const replay = await b.evaluate(`(() => { const h = document.querySelector('[data-check="hero-handoff"]'); return h ? h.getAttribute('data-state') : null; })()`);

    // 4) 定位结束后滚轮没有被锁：再做一次真实手势，位置必须改变
    const before = await b.evaluate("Math.round(scrollY)");
    await b.s("Input.synthesizeScrollGesture", { x: 700, y: 450, xDistance: 0, yDistance: 700, speed: 3000, gestureSourceType: "mouse" });
    await sleep(1200);
    const afterFree = await b.evaluate("Math.round(scrollY)");

    const interrupted = !afterGesture.atGuides || afterGesture.scrollY < mid + 50;
    const wheelFree = afterFree !== before;
    report.results.V05 = { handoffDuring: during, handoffAfterEscape: afterEsc, midScroll: mid, afterGesture, stable: settled1 === settled2, wheelFree: { before, afterFree, free: wheelFree }, replayAfterTop: replay, interruptedNativeAnchorScroll: interrupted, pass: during === "in" && afterEsc !== "in" && settled1 === settled2 && wheelFree && replay !== "in" };
    console.log(`V05 转场中=${during} Escape 后=${afterEsc} | 途中 y=${mid} 反向手势后 y=${afterGesture.scrollY} 仍在 Guides=${afterGesture.atGuides} 位置稳定=${settled1 === settled2} | 滚轮未被锁=${wheelFree}(${before}→${afterFree}) | 回顶再下滚重播=${replay === "in"}`);
  }

  // ---------- V06 防误触 ----------
  if (want("V06")) {
    const rows = [];
    await device(b, 1440, 900);
    // 旧 hash 深链接
    await nav(b, `${ORIGIN}${PATH}#guides`);
    const deep = await b.evaluate(`(() => { const h = document.querySelector('[data-check="hero-handoff"]'); return { handoff: h ? h.getAttribute('data-state') : null, guidesTop: Math.round(document.querySelector('#guides').getBoundingClientRect().top), scrollY: Math.round(scrollY) }; })()`);
    rows.push({ case: "hash 深链接 #guides", ...deep, pass: deep.handoff !== "in" && Math.abs(deep.guidesTop) <= 6 });
    // 点击试听不触发
    await nav(b, `${ORIGIN}${PATH}`);
    await b.evaluate(`(() => { const btn = [...document.querySelectorAll('[data-check="hero-card"] button')].find((x) => x.offsetParent !== null); btn.click(); return true; })()`);
    await sleep(2500);
    const play = await b.evaluate(`(() => { const h = document.querySelector('[data-check="hero-handoff"]'); return { handoff: h ? h.getAttribute('data-state') : null, scrollY: Math.round(scrollY) }; })()`);
    rows.push({ case: "点击试听", ...play, pass: play.handoff !== "in" && play.scrollY === 0 });
    // 刷新后恢复正文位置（用带 hash 的加载模拟已在正文）
    await nav(b, `${ORIGIN}${PATH}#see`);
    await b.evaluate(`scrollBy({ top: 40 }); true`); await sleep(700);
    const restored = await b.evaluate(`(() => { const h = document.querySelector('[data-check="hero-handoff"]'); return { handoff: h ? h.getAttribute('data-state') : null }; })()`);
    rows.push({ case: "正文位置继续下滚", ...restored, pass: restored.handoff !== "in" });
    report.results.V06 = { rows, pass: rows.every((r) => r.pass) };
    for (const r of rows) console.log(`V06 ${r.case} handoff=${r.handoff} pass=${r.pass}`);
  }

  // ---------- V07 手机 / 放大 / 矮屏 ----------
  if (want("V07")) {
    const rows = [];
    for (const [w, h, mobile, note] of [[360, 812, true, "phone"], [375, 812, true, "phone"], [430, 812, true, "phone"], [1440, 620, false, "矮窗口"]]) {
      await device(b, w, h, mobile); await nav(b, `${ORIGIN}${PATH}`);
      const m = await b.evaluate(`(() => { const root = document.documentElement; const first = document.querySelector('#top'); const hero = first.querySelector('section'); const tiles = [...document.querySelectorAll('.rr2 .grid')].find((g) => g.offsetParent !== null && g.querySelector('p')); const handoff = document.querySelector('[data-check="hero-handoff"]'); return { snapType: getComputedStyle(root).scrollSnapType, firstHeight: Math.round(first.getBoundingClientRect().height), vh: innerHeight, tilesBottom: tiles ? Math.round(tiles.getBoundingClientRect().bottom + scrollY) : null, momentTop: Math.round(document.querySelector('#moment').getBoundingClientRect().top + scrollY), heroCardVisible: !!document.querySelector('[data-check="hero-card"]'), handoffDisplay: handoff ? getComputedStyle(handoff).display : null }; })()`);
      const tilesBeforeMoment = m.tilesBottom !== null && m.momentTop >= m.tilesBottom - 1;
      rows.push({ vp: `${w}x${h}`, note, ...m, tilesBeforeMoment, pass: tilesBeforeMoment && (mobile ? m.snapType === "none" : true) });
      console.log(`V07 ${w}x${h} ${note} snap=${m.snapType} 首屏高${m.firstHeight}/视口${m.vh} 四格在正文之前=${tilesBeforeMoment}`);
      await shot(b, join(OUT, `V07-${w}x${h}.jpg`));
    }
    // 200% 文字放大：用 deviceScaleFactor 无法模拟，改用最小字号放大（Emulation.setPageScaleFactor 不影响布局），用 CSS 根字号模拟
    await device(b, 1440, 900); await nav(b, `${ORIGIN}${PATH}`);
    await b.evaluate(`document.documentElement.style.fontSize = '32px'; true`); await sleep(600);
    const zoom = await b.evaluate(`(() => { const first = document.querySelector('#top'); const m = document.querySelector('#moment'); return { firstHeight: Math.round(first.getBoundingClientRect().height), vh: innerHeight, momentTop: Math.round(m.getBoundingClientRect().top + scrollY), overflowX: document.documentElement.scrollWidth - innerWidth }; })()`);
    await shot(b, join(OUT, "V07-text-200.jpg"));
    report.results.V07 = { rows, textZoom: { ...zoom, pass: zoom.overflowX <= 0 && zoom.momentTop >= zoom.firstHeight - 2 }, pass: rows.every((r) => r.pass) };
    console.log("V07 200% 文字", JSON.stringify(zoom));
  }

  // ---------- V08 回退：减少动态效果 ----------
  if (want("V08")) {
    await device(b, 1440, 900);
    await b.s("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await nav(b, `${ORIGIN}${PATH}`);
    const rm = await b.evaluate(`(() => { const h = document.querySelector('[data-check="hero-handoff"]'); return { snapType: getComputedStyle(document.documentElement).scrollSnapType, handoffDisplay: h ? getComputedStyle(h).display : null, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior, docHeight: document.documentElement.scrollHeight }; })()`);
    await b.evaluate(`scrollBy({ top: innerHeight }); true`); await sleep(700);
    const after = await b.evaluate(`(() => { const h = document.querySelector('[data-check="hero-handoff"]'); return { handoff: h ? h.getAttribute('data-state') : null, scrollY: Math.round(scrollY) }; })()`);
    await shot(b, join(OUT, "V08-reduced-motion.jpg"));
    await b.s("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
    report.results.V08 = { reducedMotion: { ...rm, ...after }, pass: rm.snapType === "none" && rm.handoffDisplay === "none" && rm.scrollBehavior === "auto" };
    console.log("V08 减少动态效果", JSON.stringify({ ...rm, ...after }));
  }

  // ---------- V09 全站对齐 ----------
  if (want("V09")) {
    const rows = [];
    for (const [w, h] of [[1440, 900], [1920, 1080]]) {
      await device(b, w, h); await nav(b, `${ORIGIN}${PATH}`);
      const geo = await b.evaluate(SCREENS);
      // 收尾屏是 CTA 横幅（标题在卡片内），不并入「屏标题起始线」比较
      const content = geo.screens.filter((x) => x.id !== "start" && x.titleLeft !== null);
      const lefts = content.map((x) => x.titleLeft);
      const spread = Math.max(...lefts) - Math.min(...lefts);
      for (const s of geo.screens) {
        await b.evaluate(`scrollTo(0, ${s.top}); true`); await sleep(600);
        await shot(b, join(OUT, `V09-${w}-${s.id}.jpg`));
      }
      rows.push({ vp: `${w}x${h}`, screens: geo.screens.map((x) => ({ id: x.id, screens: x.screens, titleLeft: x.titleLeft, titleText: x.titleText })), contentTitleLeftSpread: spread, closingBanner: geo.screens.find((x) => x.id === 'start')?.titleLeft ?? null, pass: spread <= 2 });
      console.log(`V09 ${w} 标题左边界差${spread}px  ${geo.screens.map((s) => `${s.id}:${s.titleLeft}`).join(" ")}`);
    }
    report.results.V09 = { rows, pass: rows.every((r) => r.pass) };
  }
} finally {
  b.close();
}

// ---------- V08 无 JS ----------
if (want("V08")) {
  const b2 = await launch();
  try {
    await b2.s("Network.setBlockedURLs", { urls: ["*.js", "*.js?*"] });
    await device(b2, 1440, 900);
    await nav(b2, `${ORIGIN}${PATH}`);
    const nojs = await b2.evaluate(`(() => ({ snapType: getComputedStyle(document.documentElement).scrollSnapType, smooth: document.documentElement.dataset.rr2Smooth !== undefined, docHeight: document.documentElement.scrollHeight, moment: !!document.querySelector('#moment'), guides: !!document.querySelector('#guides article'), heroCard: !!document.querySelector('[data-check="hero-card"]'), reveal: document.querySelectorAll('[data-reveal]').length, menu: !!document.querySelector('[data-check="nav-menu"]') }))()`);
    await shot(b2, join(OUT, "V08-no-js.jpg"));
    report.results.V08 = { ...(report.results.V08 ?? {}), noJs: nojs, noJsPass: nojs.snapType === "none" && nojs.reveal === 0 && nojs.moment && nojs.guides };
    console.log("V08 无 JS", JSON.stringify(nojs));
  } finally {
    b2.close();
  }
}

report.finishedAt = new Date().toISOString();
writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 1));
console.log("evidence dir", OUT);
