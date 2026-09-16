/**
 * 拍 /site-v2 的评审图。走本机 Chrome 无头 + CDP，不依赖 puppeteer；CDP 部分与 shoot-app.mjs 相同。
 *
 * 输出（默认 docs/screens/site-v2-next/，已 gitignore）：
 *   hero-{1280x800,1440x900,1024x800,1100x800}.jpg、hero-{360,375,430}x812.jpg   首屏
 *   moment-1440.jpg、moment-375.jpg                                             01 段局部（按 #moment 的边界裁）
 *   explore-{1440,1280,375,430}.jpg                                             03 段局部（按 #explore 的边界裁，视口内可见部分）
 *   full-1440.jpg、full-375.jpg                                                 整页（保持正常视口高度，真实滚动逐屏拍再拼）
 *   report.json（--only 时为 report-<批次>.json，互不覆盖）                         每张图的视口 / DPR / CSS 高度 / 像素尺寸 / 时间、资源失败（含 URL）、可见性检查
 *
 * 检查：
 *   - 根节点横向溢出（scrollWidth > innerWidth）
 *   - 页面里带 data-check="名字" 的元素：是否整个落在视口宽度内、是否被祖先的 overflow 裁掉、中心与四角是否被别的元素盖住
 *   - 整页是否拍到了 <footer>；达到高度上限则报告截断
 *
 * 用法：node scripts/shoot-site-v2.mjs [origin] [--out dir] [--only hero|moment|explore|full]
 */
import { spawn } from "node:child_process";
import { mkdirSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
function opt(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const OUT = opt("--out", "docs/screens/site-v2-next");
const ONLY = opt("--only", "");
const consumed = new Set();
for (const flag of ["--out", "--only"]) {
  const i = args.indexOf(flag);
  if (i >= 0) consumed.add(i).add(i + 1);
}
const ORIGIN = (args.find((a, i) => !a.startsWith("--") && !consumed.has(i)) ?? "http://localhost:3000").replace(/\/$/, "");
const PATH = "/site-v2";
const PORT = 9334;
const MAX_FULL = 16000;
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => existsSync(p));
if (!CHROME) throw new Error("no Chrome/Edge found");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(tmpdir(), `rearound-shoot-v2-${Date.now()}`);
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-gpu", "--lang=en-US", "about:blank"], { stdio: "ignore" });

async function browserWs() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const j = await r.json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await sleep(200);
  }
  throw new Error("chrome did not start");
}

function cdp(ws) {
  let id = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method) {
      for (const fn of listeners) fn(msg);
    }
  });
  return {
    send(method, params = {}, sessionId) {
      const msgId = ++id;
      ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
      return new Promise((resolve, reject) => pending.set(msgId, { resolve, reject }));
    },
    on(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    waitFor(method, sessionId, timeoutMs = 30000) {
      return new Promise((resolve, reject) => {
        const t = setTimeout(() => {
          listeners.delete(fn);
          reject(new Error(`timeout waiting ${method}`));
        }, timeoutMs);
        const fn = (msg) => {
          if (msg.method === method && msg.sessionId === sessionId) {
            clearTimeout(t);
            listeners.delete(fn);
            resolve(msg.params);
          }
        };
        listeners.add(fn);
      });
    },
  };
}

const CLEANUP = `document.querySelectorAll("nextjs-portal").forEach((e) => e.remove()); true`;

/** 等字体就绪、所有图片加载并解码；顺手把懒加载改成立即加载，滚一遍触发所有内容。返回资源失败列表与 CSS 高度 */
const READY = `(async () => {
  document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = "eager"; });
  const h = document.documentElement.scrollHeight;
  for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
  window.scrollTo(0, 0);
  await document.fonts.ready;
  const imgs = [...document.images];
  const failed = [];
  await Promise.all(imgs.map(async (img) => {
    if (!img.complete) await new Promise((r) => { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); setTimeout(r, 15000); });
    if (!img.complete || img.naturalWidth === 0) { failed.push(img.currentSrc || img.src); return; }
    try { await img.decode(); } catch { failed.push("decode:" + (img.currentSrc || img.src)); }
  }));
  await new Promise((r) => setTimeout(r, 300));
  return { scrollHeight: document.documentElement.scrollHeight, images: imgs.length, failed, fonts: [...document.fonts].filter((f) => f.status === "loaded").length };
})()`;

/** data-check 元素的可见性：视口宽度内、未被祖先 overflow 裁、中心与四角未被盖住 */
const CHECKS = `(() => {
  const clipped = (el, r) => {
    for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
      const cs = getComputedStyle(p);
      // 只算真正裁掉内容的容器，并且分轴看：overflow-x: clip 只裁横向；auto/scroll 可以滚到；html/body 是页面滚动容器本身
      const cx = /(hidden|clip)/.test(cs.overflowX), cy = /(hidden|clip)/.test(cs.overflowY);
      if (!cx && !cy) continue;
      const pr = p.getBoundingClientRect();
      const badX = cx && (r.left < pr.left - 0.5 || r.right > pr.right + 0.5);
      const badY = cy && (r.top < pr.top - 0.5 || r.bottom > pr.bottom + 0.5);
      if (badX || badY) return p.tagName.toLowerCase() + (p.id ? "#" + p.id : "") + "." + String(p.className).split(" ")[0] + " clips " + [Math.round(r.left - pr.left), Math.round(pr.right - r.right), Math.round(r.top - pr.top), Math.round(pr.bottom - r.bottom)].join("/");
    }
    return null;
  };
  const out = [];
  for (const el of document.querySelectorAll("[data-check]")) {
    el.scrollIntoView({ block: "center", inline: "nearest" });
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const name = el.getAttribute("data-check");
    const inWidth = r.left >= -0.5 && r.right <= window.innerWidth + 0.5;
    // 四角取样点往里缩，避开圆角（圆角处 elementFromPoint 会命中背景）
    const d = Math.min(14, r.width / 4, r.height / 4);
    const points = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + d, r.top + d], [r.right - d, r.top + d], [r.left + d, r.bottom - d], [r.right - d, r.bottom - d]];
    const covered = points.filter(([x, y]) => { const hit = document.elementFromPoint(x, y); return hit && hit !== el && !el.contains(hit); }).map(([x, y]) => { const hit = document.elementFromPoint(x, y); return (hit.getAttribute("data-check") || hit.tagName.toLowerCase() + (hit.className ? "." + String(hit.className).split(" ")[0] : "")); });
    out.push({ name, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], inWidth, clippedBy: clipped(el, r), covered: covered.length ? covered : null, ok: inWidth && !clipped(el, r) && covered.length === 0 });
  }
  window.scrollTo(0, 0);
  return out;
})()`;

async function main() {
  const wsUrl = await browserWs();
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  const c = cdp(ws);
  const { targetId } = await c.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await c.send("Target.attachToTarget", { targetId, flatten: true });
  const s = (method, params) => c.send(method, params, sessionId);
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await s("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (exceptionDetails) throw new Error(exceptionDetails.text + " " + (exceptionDetails.exception?.description ?? ""));
    return result.value;
  };
  await s("Page.enable");
  await s("Runtime.enable");
  await s("Network.enable");
  const netFailed = [];
  const reqUrl = new Map();
  c.on((msg) => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === "Network.requestWillBeSent") reqUrl.set(msg.params.requestId, msg.params.request.url);
    if (msg.method === "Network.loadingFailed") netFailed.push({ url: reqUrl.get(msg.params.requestId) ?? msg.params.requestId, error: msg.params.errorText, canceled: msg.params.canceled ?? false });
    if (msg.method === "Network.responseReceived" && msg.params.response.status >= 400) netFailed.push({ url: msg.params.response.url, status: msg.params.response.status });
  });
  const nav = async (url) => {
    const loaded = c.waitFor("Page.loadEventFired", sessionId);
    await s("Page.navigate", { url });
    await loaded;
  };
  const device = (width, height, scale, mobile) => s("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile });
  const shoot = async (params = {}) => {
    await evaluate(CLEANUP);
    const { data } = await s("Page.captureScreenshot", { format: "png", ...params });
    return Buffer.from(data, "base64");
  };

  mkdirSync(OUT, { recursive: true });
  const report = { origin: ORIGIN + PATH, shotAt: new Date().toISOString(), shots: [], checks: {}, overflow: {}, netFailed };
  const save = async (name, png, meta) => {
    const file = join(OUT, `${name}.jpg`);
    const img = sharp(png);
    const { width, height } = await img.metadata();
    await img.jpeg({ quality: 86 }).toFile(file);
    report.shots.push({ name, file, imagePx: [width, height], ...meta });
    console.log("saved", file, `${width}x${height}px`, JSON.stringify(meta));
  };
  /** 整页：视口高度不变，真实滚动到每一屏拍视口图再拼（不用 captureBeyondViewport：它会让 html/body 100% 高的页面在视口外露出旧底色） */
  const shootFull = async (width, height, fullHeight, scale) => {
    const tiles = [];
    for (let y = 0; y < fullHeight; y += height) {
      const h = Math.min(height, fullHeight - y);
      await evaluate(`window.scrollTo(0, ${y}); new Promise((r) => setTimeout(r, 250))`);
      const actualY = await evaluate(`window.scrollY`);
      const png = await shoot();
      // 最后一屏滚不到位（页面到底）：从视口图里裁出没拍过的那一段
      const offset = Math.round(y - actualY);
      const part = offset > 0 || h < height ? await sharp(png).extract({ left: 0, top: offset * scale, width: width * scale, height: h * scale }).png().toBuffer() : png;
      tiles.push({ input: part, top: y * scale, left: 0 });
    }
    await evaluate(`window.scrollTo(0, 0); true`);
    return sharp({ create: { width: width * scale, height: fullHeight * scale, channels: 3, background: "#F7F9FC" } })
      .composite(tiles)
      .png()
      .toBuffer();
  };
  const open = async (width, height, scale, mobile) => {
    await device(width, height, scale, mobile);
    await nav(`${ORIGIN}${PATH}`);
    await sleep(800);
    const ready = await evaluate(READY);
    if (ready.failed.length) console.warn(`  ! ${ready.failed.length} image(s) failed at ${width}:`, ready.failed);
    return { viewport: [width, height], dpr: scale, cssScrollHeight: ready.scrollHeight, images: ready.images, imagesFailed: ready.failed, fontsLoaded: ready.fonts };
  };
  const checks = async (key) => {
    const list = await evaluate(CHECKS);
    report.checks[key] = list;
    for (const it of list) console.log(`  check ${key} ${it.name}: ${it.ok ? "ok" : "FAIL"}${it.inWidth ? "" : " out-of-width"}${it.clippedBy ? " " + it.clippedBy : ""}${it.covered ? " covered-by " + it.covered.join(",") : ""} rect=${it.rect.join(",")}`);
  };
  const overflow = async (key) => {
    const o = await evaluate(`({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })`);
    report.overflow[key] = o;
    console.log(`  width ${key}: scrollWidth ${o.sw} / innerWidth ${o.iw} → ${o.sw > o.iw ? "OVERFLOW" : "ok"}`);
  };
  const want = (k) => !ONLY || ONLY === k;

  if (want("hero")) {
    for (const [w, h, scale, mobile] of [[1280, 800, 1, false], [1440, 900, 1, false], [1024, 800, 1, false], [1100, 800, 1, false], [375, 812, 2, true], [360, 812, 2, true], [430, 812, 2, true]]) {
      const meta = await open(w, h, scale, mobile);
      await save(`hero-${w}x${h}`, await shoot(), meta);
      await checks(`${w}x${h}`);
      await overflow(`${w}x${h}`);
    }
  }

  if (want("moment")) {
    for (const [w, h, scale, mobile] of [[1440, 900, 1, false], [375, 812, 2, true]]) {
      const meta = await open(w, h, scale, mobile);
      const box = await evaluate(`(() => { const el = document.querySelector("#moment"); if (!el) return null; const r = el.getBoundingClientRect(); return { x: 0, y: Math.max(0, r.top + window.scrollY - 24), width: ${w}, height: Math.ceil(r.height + 48) }; })()`);
      if (!box) {
        console.warn("  ! #moment not found");
        continue;
      }
      const png = await shoot({ captureBeyondViewport: true, clip: { ...box, scale: 1 } });
      await save(`moment-${w}`, png, { ...meta, clip: box });
    }
  }

  if (want("explore")) {
    for (const [w, h, scale, mobile] of [[1440, 900, 1, false], [1280, 800, 1, false], [375, 812, 2, true], [430, 812, 2, true]]) {
      const meta = await open(w, h, scale, mobile);
      const box = await evaluate(`(() => { const el = document.querySelector("#explore"); if (!el) return null; const r = el.getBoundingClientRect(); return { x: 0, y: Math.max(0, r.top + window.scrollY - 16), width: ${w}, height: Math.ceil(r.height + 32) }; })()`);
      if (!box) continue;
      await evaluate(`window.scrollTo(0, ${box.y}); new Promise((r) => setTimeout(r, 300))`);
      const actualY = await evaluate(`window.scrollY`);
      // 拍整个视口再用 sharp 裁（captureScreenshot 的 clip 在滚动后坐标不可靠）
      const png = await shoot();
      const top = Math.max(0, Math.round(box.y - actualY));
      const cut = await sharp(png).extract({ left: 0, top: top * scale, width: w * scale, height: Math.min(box.height, h - top) * scale }).png().toBuffer();
      await save(`explore-${w}`, cut, { ...meta, clip: box });
    }
  }

  if (want("full")) {
    for (const [w, h, scale, mobile] of [[1440, 900, 1, false], [375, 812, 2, true]]) {
      const meta = await open(w, h, scale, mobile);
      const full = Math.min(meta.cssScrollHeight, MAX_FULL);
      const footer = await evaluate(`(() => { const f = document.querySelector("footer"); if (!f) return null; const r = f.getBoundingClientRect(); return Math.round(r.bottom + window.scrollY); })()`);
      const truncated = meta.cssScrollHeight > MAX_FULL || (footer != null && footer > full + 1);
      if (truncated) console.warn(`  ! full page at ${w} is TRUNCATED: scrollHeight ${meta.cssScrollHeight}, footer bottom ${footer}, captured ${full}`);
      await save(`full-${w}`, await shootFull(w, h, full, scale), { ...meta, capturedCssHeight: full, footerBottomCss: footer, footerCaptured: footer != null && footer <= full + 1, truncated });
      await checks(`full-${w}`);
      await overflow(`full-${w}`);
    }
  }

  const reportFile = join(OUT, ONLY ? `report-${ONLY}.json` : "report.json");
  writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log("report", reportFile, netFailed.length ? `net failures: ${JSON.stringify(netFailed)}` : "no network failures");
  ws.close();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => {
    chrome.kill();
    setTimeout(() => {
      try {
        rmSync(profile, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }, 500);
  });
