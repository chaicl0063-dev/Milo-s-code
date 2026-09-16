/**
 * 官网 V2 动效验收证据（docs/SITE-V2-MOTION-EXECUTION-CHECKLIST-20260916.md v2 §4）。
 * 本机 Chrome 无头 + CDP：
 *   - 录屏：Page.startScreencast 逐帧接收，保存每帧 metadata.timestamp，按真实时间戳用 ffmpeg（concat demuxer，逐帧 duration）编码 mp4；
 *   - 媒体事件日志：注入脚本给所有 HTMLMediaElement 打 playing / pause / ended / error 事件戳（window.__mediaLog），证明「实际发声」以 playing 事件为准；
 *   - 场景：S1 首次进入滚到底滚回顶；S2 Hero → See & Hear → Mia → Milo 各暂停恢复；S3 新会话拦截 /api/tts 500 → Retry；
 *            S4 375 宽按压；S5 减少动态效果下同一组操作；S6 禁用 JS 整页截图；S7 开/关动效的 DOM 矩形比对；
 *   - 每个场景另存关键时刻的静态截图与状态 JSON。
 * 输出：docs/screens/site-v2-motion/<批次时间戳>/…（已 gitignore）。
 * 用法：node scripts/motion-evidence.mjs [origin]   默认 http://localhost:3000
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const ONLY = (args.find((a) => a.startsWith("--only="))?.slice(7) ?? "").split(",").filter(Boolean);
const ORIGIN = (args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
const want = (k) => ONLY.length === 0 || ONLY.includes(k);
const PATH = "/site-v2";
const BATCH = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const OUT = join("docs/screens/site-v2-motion", BATCH);
mkdirSync(OUT, { recursive: true });
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find((p) => existsSync(p));
const FFMPEG = spawnSync("where", ["ffmpeg"], { encoding: "utf8" }).stdout.split(/\r?\n/)[0]?.trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = { batch: BATCH, origin: ORIGIN + PATH, startedAt: new Date().toISOString(), chrome: CHROME, ffmpeg: FFMPEG || null, scenarios: {} };

/** 注入：媒体事件日志（不改变播放行为） */
const MEDIA_LOG = `(() => {
  window.__mediaLog = [];
  const log = (type, el) => window.__mediaLog.push({ t: performance.now(), type, src: (el.currentSrc || el.src || "").slice(0, 40) });
  const P = HTMLMediaElement.prototype, orig = P.play;
  const wire = (el) => { if (el.__rr2wired) return; el.__rr2wired = true; for (const ev of ["playing", "pause", "ended", "error", "loadstart"]) el.addEventListener(ev, () => log(ev, el)); };
  P.play = function () { wire(this); log("play()", this); return orig.apply(this, arguments); };
})();`;

async function launch(extraArgs = []) {
  const port = 9340 + Math.floor(Math.random() * 50);
  const profile = join(tmpdir(), `rr2-motion-${Date.now()}`);
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--hide-scrollbars", "--disable-gpu", "--autoplay-policy=no-user-gesture-required", "--lang=en-US", ...extraArgs, "about:blank"], { stdio: "ignore" });
  let wsUrl;
  for (let i = 0; i < 60 && !wsUrl; i++) {
    try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl; } catch { await sleep(200); }
  }
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0; const pending = new Map(); const listeners = new Set();
  ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); if (m.error) rej(new Error(m.error.message)); else res(m.result); } else if (m.method) for (const fn of listeners) fn(m); });
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  await s("Page.enable"); await s("Runtime.enable"); await s("Network.enable");
  await s("Page.addScriptToEvaluateOnNewDocument", { source: MEDIA_LOG });
  // 无头 Chrome 跟随系统的「减少动态效果」设置；正常场景显式模拟 no-preference，S5 再改成 reduce
  const envReduce = await (async () => { const { result } = await s("Runtime.evaluate", { expression: "matchMedia('(prefers-reduced-motion: reduce)').matches", returnByValue: true }); return result.value; })();
  report.environmentPrefersReducedMotion = envReduce;
  await s("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  const evaluate = async (expression) => { const { result, exceptionDetails } = await s("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (exceptionDetails) throw new Error(exceptionDetails.text + " " + (exceptionDetails.exception?.description ?? "")); return result.value; };
  const on = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  const close = () => { try { ws.close(); } catch {} chrome.kill(); };
  return { s, evaluate, on, close, sessionId };
}

/** 录屏：收帧 + 时间戳；stop 后按真实间隔编码 */
function screencast(b, dir) {
  const frames = [];
  mkdirSync(dir, { recursive: true });
  const off = b.on((m) => {
    if (m.method !== "Page.screencastFrame" || m.sessionId !== b.sessionId) return;
    const n = frames.length;
    const file = join(dir, `f${String(n).padStart(4, "0")}.jpg`);
    writeFileSync(file, Buffer.from(m.params.data, "base64"));
    frames.push({ file, t: m.params.metadata.timestamp });
    b.s("Page.screencastFrameAck", { sessionId: m.params.sessionId }).catch(() => {});
  });
  return {
    start: () => b.s("Page.startScreencast", { format: "jpeg", quality: 60, maxWidth: 1440, maxHeight: 900, everyNthFrame: 1 }),
    stop: async (name) => {
      await b.s("Page.stopScreencast"); off();
      writeFileSync(join(dir, "frames.json"), JSON.stringify(frames.map((f) => ({ file: f.file.split(/[\\/]/).pop(), t: f.t })), null, 1));
      let video = null;
      if (FFMPEG && frames.length > 1) {
        // concat demuxer：每帧 duration = 与下一帧的真实时间差
        const list = frames.map((f, i) => `file '${f.file.split(/[\\/]/).pop()}'\nduration ${Math.max(0.01, (frames[i + 1]?.t ?? f.t + 0.2) - f.t).toFixed(4)}`).join("\n") + `\nfile '${frames.at(-1).file.split(/[\\/]/).pop()}'\n`;
        writeFileSync(join(dir, "frames.txt"), list);
        const mp4 = join(dir, `${name}.mp4`);
        const r = spawnSync(FFMPEG, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "frames.txt", "-vsync", "vfr", "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", "-pix_fmt", "yuv420p", `${name}.mp4`], { cwd: dir, encoding: "utf8" });
        video = r.status === 0 ? mp4 : `ffmpeg failed: ${r.stderr}`;
      }
      return { frames: frames.length, seconds: frames.length > 1 ? +(frames.at(-1).t - frames[0].t).toFixed(2) : 0, video };
    },
  };
}

const shot = async (b, file) => { const { data } = await b.s("Page.captureScreenshot", { format: "jpeg", quality: 80 }); writeFileSync(file, Buffer.from(data, "base64")); return file; };
const device = (b, w, h, scale, mobile) => b.s("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: scale, mobile });
const nav = async (b, url) => { const loaded = new Promise((r) => { const off = b.on((m) => { if (m.method === "Page.loadEventFired" && m.sessionId === b.sessionId) { off(); r(); } }); }); await b.s("Page.navigate", { url }); await loaded; await sleep(1200); };

/** 页面内状态读取（与 §43 回归相同的选择器） */
const STATE_JS = `(() => {
  const vis = (list) => [...list].find((b) => b.offsetParent !== null) || list[0];
  const heroBtn = vis(document.querySelectorAll('[data-check="hero-card"] button'));
  const heroCard = heroBtn && heroBtn.closest('[data-check="hero-card"]');
  const seeBtn = document.querySelector('#see button');
  const guide = (n) => [...document.querySelectorAll('#guides article')].find((a) => a.querySelector('h3').innerText === n);
  const waves = [...document.querySelectorAll('[data-wave]')].map((w) => ({ where: w.closest('#see') ? 'see' : w.closest('#guides') ? 'guides:' + w.closest('article').querySelector('h3').innerText : 'hero', mode: w.dataset.wave, playState: w.firstElementChild ? getComputedStyle(w.firstElementChild).animationPlayState : null, anim: w.firstElementChild ? getComputedStyle(w.firstElementChild).animationName : null }));
  return {
    hero: heroCard ? (heroCard.innerText.match(/Mia\\s+([A-Za-z' ]+)\\n/) || [])[1] : null, heroLabel: heroBtn && heroBtn.getAttribute('aria-label'),
    see: seeBtn && seeBtn.getAttribute('aria-label'), mia: guide('Mia') && guide('Mia').querySelector('button').innerText.trim(), milo: guide('Milo') && guide('Milo').querySelector('button').innerText.trim(),
    waves, reveal: [...document.querySelectorAll('[data-reveal]')].map((r) => r.dataset.reveal), scrollY: Math.round(scrollY), scrollingElement: window.__rr2ScrollingElement, smooth: document.documentElement.dataset.rr2Smooth !== undefined, mediaLog: (window.__mediaLog || []).slice(-6),
  };
})()`;
const CLICK = { hero: `(() => { const b = [...document.querySelectorAll('[data-check="hero-card"] button')].find((x) => x.offsetParent !== null) || document.querySelector('[data-check="hero-card"] button'); b.scrollIntoView({ block: 'center' }); b.click(); return true; })()`, see: `(() => { const b = document.querySelector('#see button'); b.scrollIntoView({ block: 'center' }); b.click(); return true; })()`, guide: (n) => `(() => { const a = [...document.querySelectorAll('#guides article')].find((a) => a.querySelector('h3').innerText === '${n}'); const b = a.querySelector('button'); b.scrollIntoView({ block: 'center' }); b.click(); return true; })()` };
const waitFor = async (b, expr, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await b.evaluate(expr)) return true; await sleep(150); } return false; };
const step = async (b, log, name, action, waitExpr) => { const t0 = performance.now(); await b.evaluate(action); const ok = waitExpr ? await waitFor(b, waitExpr) : true; await sleep(400); const st = await b.evaluate(STATE_JS); log.push({ step: name, ok, ms: Math.round(performance.now() - t0), state: st }); return st; };

async function scenario1(b) {
  const dir = join(OUT, "S1-first-enter-scroll"); const sc = screencast(b, dir);
  await device(b, 1440, 900, 1, false); await nav(b, `${ORIGIN}${PATH}`); const log = [];
  log.push({ step: "loaded", state: await b.evaluate(STATE_JS) });
  await shot(b, join(dir, "00-first-viewport.jpg"));
  await sc.start();
  for (let y = 0; y <= 3000; y += 300) { await b.evaluate(`window.scrollTo(0, ${y}); true`); await sleep(220); }
  log.push({ step: "scrolled-to-bottom", state: await b.evaluate(STATE_JS) });
  for (let y = 3000; y >= 0; y -= 300) { await b.evaluate(`window.scrollTo(0, ${y}); true`); await sleep(160); }
  log.push({ step: "scrolled-back", state: await b.evaluate(STATE_JS) });
  const rec = await sc.stop("S1"); writeFileSync(join(dir, "log.json"), JSON.stringify(log, null, 1));
  const revealAll = log.at(-1).state.reveal;
  report.scenarios.S1 = { ...rec, revealStates: revealAll, pass: revealAll.every((r) => r === "done"), note: "滚到底再滚回顶后所有显现组应为 done 且不重播" };
}

async function scenario2(b, tag = "S2-audio-exclusive", reducedMotion = false) {
  const dir = join(OUT, tag); const sc = screencast(b, dir);
  await device(b, 1440, 900, 1, false);
  if (reducedMotion) await b.s("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await nav(b, `${ORIGIN}${PATH}`); const log = []; await sc.start();
  await step(b, log, "hero play", CLICK.hero, `(${STATE_JS}).hero === 'Speaking'`); await shot(b, join(dir, "01-hero-speaking.jpg"));
  await step(b, log, "hero pause", CLICK.hero, `(${STATE_JS}).hero === 'Paused'`); await shot(b, join(dir, "02-hero-paused.jpg"));
  await step(b, log, "hero resume", CLICK.hero, `(${STATE_JS}).hero === 'Speaking'`);
  await step(b, log, "see play (hero must stop)", CLICK.see, `(${STATE_JS}).see === 'Pause'`); await shot(b, join(dir, "03-see-playing.jpg"));
  await step(b, log, "see pause", CLICK.see, `(${STATE_JS}).see === 'Resume'`);
  await step(b, log, "see resume", CLICK.see, `(${STATE_JS}).see === 'Pause'`);
  await step(b, log, "Hear Mia (see must stop)", CLICK.guide("Mia"), `(${STATE_JS}).mia === 'Pause'`); await shot(b, join(dir, "04-mia-playing.jpg"));
  await step(b, log, "Mia pause", CLICK.guide("Mia"), `(${STATE_JS}).mia === 'Resume'`);
  await step(b, log, "Mia resume", CLICK.guide("Mia"), `(${STATE_JS}).mia === 'Pause'`);
  await step(b, log, "Hear Milo (Mia must stop)", CLICK.guide("Milo"), `(${STATE_JS}).milo === 'Pause'`); await shot(b, join(dir, "05-milo-playing.jpg"));
  await step(b, log, "Milo pause", CLICK.guide("Milo"), `(${STATE_JS}).milo === 'Resume'`);
  await step(b, log, "Milo resume", CLICK.guide("Milo"), `(${STATE_JS}).milo === 'Pause'`);
  await step(b, log, "Milo pause (end)", CLICK.guide("Milo"), `(${STATE_JS}).milo === 'Resume'`);
  const rec = await sc.stop(tag.slice(0, 2));
  const mediaLog = await b.evaluate("window.__mediaLog");
  writeFileSync(join(dir, "log.json"), JSON.stringify({ steps: log, mediaLog }, null, 1));
  const allOk = log.every((l) => l.ok);
  // 互斥：每步只允许一处非 static 波形
  const exclusive = log.every((l) => l.state.waves.filter((w) => w.mode !== "static").length <= 1);
  const runningOnlyWhenPlaying = log.every((l) => l.state.waves.every((w) => w.mode !== "running" || w.anim === "v2-wave"));
  const pausedFrozen = log.filter((l) => /pause/.test(l.step) && !/resume/.test(l.step)).every((l) => l.state.waves.some((w) => w.mode === "paused" && w.playState === "paused") || reducedMotion);
  report.scenarios[tag] = { ...rec, stepsOk: allOk, exclusive, runningUsesKeyframes: runningOnlyWhenPlaying, pausedFrozen, playingEvents: mediaLog.filter((m) => m.type === "playing").length, reducedMotion, pass: allOk && exclusive && (reducedMotion || (runningOnlyWhenPlaying && pausedFrozen)) };
  if (reducedMotion) {
    const anyAnim = log.some((l) => l.state.waves.some((w) => w.anim && w.anim !== "none"));
    report.scenarios[tag].noAnimationUnderReducedMotion = !anyAnim; report.scenarios[tag].pass = report.scenarios[tag].pass && !anyAnim;
    await b.s("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  }
}

async function scenario3(b) {
  // 新会话（launch 已是全新 profile，且本函数在独立浏览器实例里调用）：拦截 /api/tts → 500
  const dir = join(OUT, "S3-tts-failure"); mkdirSync(dir, { recursive: true });
  await device(b, 1440, 900, 1, false);
  await b.s("Fetch.enable", { patterns: [{ urlPattern: "*/api/tts*", requestStage: "Request" }] });
  let intercepted = 0;
  b.on((m) => { if (m.method === "Fetch.requestPaused" && m.sessionId === b.sessionId) { intercepted++; b.s("Fetch.fulfillRequest", { requestId: m.params.requestId, responseCode: 500, responseHeaders: [{ name: "Content-Type", value: "text/plain" }], body: Buffer.from("controlled failure").toString("base64") }).catch(() => {}); } });
  await nav(b, `${ORIGIN}${PATH}`); const log = [];
  await step(b, log, "hero play → failure", CLICK.hero, `(${STATE_JS}).hero === 'Voice unavailable'`); await shot(b, join(dir, "01-hero-voice-unavailable.jpg"));
  await step(b, log, "Hear Mia → failure", CLICK.guide("Mia"), `(${STATE_JS}).mia === 'Retry'`); await shot(b, join(dir, "02-mia-retry.jpg"));
  await b.s("Fetch.disable");
  writeFileSync(join(dir, "log.json"), JSON.stringify({ steps: log, intercepted }, null, 1));
  report.scenarios.S3 = { intercepted, heroLabel: log[0].state.heroLabel, miaLabel: log[1].state.mia, wavesStatic: log.every((l) => l.state.waves.every((w) => w.mode === "static")), pass: intercepted >= 2 && log[0].ok && log[1].ok && log.every((l) => l.state.waves.every((w) => w.mode === "static")), note: "受控测试：新会话，/api/tts 被拦截返回 500；不是生产故障" };
}

async function scenario4(b) {
  const dir = join(OUT, "S4-mobile-press"); mkdirSync(dir, { recursive: true });
  await device(b, 375, 812, 2, true); await nav(b, `${ORIGIN}${PATH}`);
  const anchors = await b.evaluate(`[...document.querySelectorAll('#top a')].map((a) => ({ href: a.getAttribute('href'), text: a.textContent.trim().slice(0, 30), visible: a.offsetParent !== null }))`);
  writeFileSync(join(dir, "anchors.json"), JSON.stringify(anchors, null, 1));
  const CTA = `(document.querySelector('#top a[href="/"]') || [...document.querySelectorAll('#top a')].find((a) => /Try it where I am/.test(a.textContent) && a.offsetParent !== null))`;
  // 测试期间阻止链接真正跳转（触摸序列会合成 click），只观察按压反馈
  const r = await b.evaluate(`(() => { const a = ${CTA}; a.addEventListener('click', (e) => e.preventDefault()); const r = a.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  await b.s("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: r.x, y: r.y }] });
  await sleep(450); // Chrome 触摸后的 :active 有约 100ms 延迟，再留过渡时间
  let pressMethod = "touch";
  const touchActive = await b.evaluate(`${CTA}.matches(':active')`);
  if (!touchActive) {
    // 无头 Chrome 的合成 touchStart 不进入 :active（手势识别不完整）；改用手机仿真下的鼠标按下，同样触发 :active
    await b.s("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
    await b.s("Input.dispatchMouseEvent", { type: "mouseMoved", x: r.x, y: r.y, button: "none" });
    await b.s("Input.dispatchMouseEvent", { type: "mousePressed", x: r.x, y: r.y, button: "left", clickCount: 1 });
    await sleep(300);
    pressMethod = "mouse(mobile emulation)";
  }
  const pressed = await b.evaluate(`(() => { const a = ${CTA}; const inner = a.querySelector('.v2-btn'); return { active: a.matches(':active'), scale: inner ? getComputedStyle(inner).scale : null, transform: inner ? getComputedStyle(inner).transform : null, hit: JSON.stringify(a.getBoundingClientRect()) }; })()`);
  await shot(b, join(dir, "01-pressed.jpg"));
  if (pressMethod === "touch") await b.s("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  else await b.s("Input.dispatchMouseEvent", { type: "mouseReleased", x: r.x, y: r.y, button: "left", clickCount: 1 });
  await sleep(250);
  const released = await b.evaluate(`(() => { const a = ${CTA}; const inner = a.querySelector('.v2-btn'); return { scale: inner ? getComputedStyle(inner).scale : null, transform: inner ? getComputedStyle(inner).transform : null, hit: JSON.stringify(a.getBoundingClientRect()) }; })()`);
  writeFileSync(join(dir, "log.json"), JSON.stringify({ pressed, released }, null, 1));
  // Tailwind 4 的 scale-[0.98] 编译为独立的 CSS scale 属性（不是 transform）
  const scaled = pressed.scale && String(pressed.scale).startsWith("0.98");
  const restored = !released.scale || released.scale === "none" || released.scale === "1";
  report.scenarios.S4 = { pressMethod, pressed, released, pass: !!scaled && restored && pressed.hit === released.hit, note: "手机按压：内部容器 scale(0.98)，命中区不变，松开恢复" };
}

async function scenario6(b) {
  // 无 JS：拦截全部脚本资源，页面只有服务端 HTML
  const dir = join(OUT, "S6-no-js"); mkdirSync(dir, { recursive: true });
  await b.s("Network.setBlockedURLs", { urls: ["*.js", "*.js?*"] });
  await device(b, 1440, 900, 1, false); await nav(b, `${ORIGIN}${PATH}`);
  const info = await b.evaluate(`(() => ({ appJsRan: window.__rr2ScrollingElement !== undefined, pending: document.querySelectorAll('[data-reveal]').length, heroCard: !!document.querySelector('[data-check="hero-card"]'), guides: !!document.querySelector('#guides article'), waveStatic: [...document.querySelectorAll('.v2-wave-bar')].every((b) => getComputedStyle(b).animationName === 'none'), scrollH: document.documentElement.scrollHeight }))()`);
  for (let y = 0; y < info.scrollH; y += 800) { await b.evaluate(`window.scrollTo(0, ${y}); true`); await sleep(150); await shot(b, join(dir, `nojs-${String(y).padStart(5, "0")}.jpg`)); }
  await b.evaluate(`window.scrollTo(0, 0); true`);
  await b.s("Network.setBlockedURLs", { urls: [] });
  report.scenarios.S6 = { ...info, pass: !info.appJsRan && info.pending === 0 && info.heroCard && info.guides && info.waveStatic, note: "拦截所有 *.js：无 data-reveal 属性，内容完整，波形静态" };
}

async function scenario7(b) {
  // 开/关动效的 DOM 矩形比对（动效结束、音频 idle）
  const RECTS = `(() => { const sel = ['header a', '#top h1', '#top [data-check="hero-card"]', '#top [data-check="hero-meta"]', '#moment figure', '#moment h2', '#see h2', '#see button', '#explore h2', '#guides article', '#start h2', 'footer nav']; const out = {}; for (const s of sel) { const els = [...document.querySelectorAll(s)]; out[s] = els.map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)]; }); } return out; })()`;
  await device(b, 1440, 900, 1, false);
  await nav(b, `${ORIGIN}${PATH}?motion=0`); await b.evaluate(`window.scrollTo(0, 99999); new Promise(r => setTimeout(r, 400))`); await b.evaluate(`window.scrollTo(0, 0); new Promise(r => setTimeout(r, 400))`);
  const off = await b.evaluate(RECTS);
  await nav(b, `${ORIGIN}${PATH}`); await b.evaluate(`window.scrollTo(0, 99999); new Promise(r => setTimeout(r, 600))`); await b.evaluate(`window.scrollTo(0, 0); new Promise(r => setTimeout(r, 600))`);
  const on = await b.evaluate(RECTS);
  const diffs = [];
  for (const k of Object.keys(off)) { if (JSON.stringify(off[k]) !== JSON.stringify(on[k])) diffs.push({ selector: k, off: off[k], on: on[k] }); }
  const dir = join(OUT, "S7-static-compare"); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "rects.json"), JSON.stringify({ off, on, diffs }, null, 1));
  await shot(b, join(dir, "on-top.jpg"));
  report.scenarios.S7 = { compared: Object.keys(off).length, diffs: diffs.length, pass: diffs.length === 0, note: "?motion=0 与默认：关键元素位置/尺寸一致" };
}

async function main() {
  // S1、S2、S4、S6、S7 共用一个浏览器；S3 与 S5（减少动态）各用独立实例（新会话、无音频缓存）
  const b = await launch();
  try {
    if (want("S1")) await scenario1(b);
    if (want("S2")) await scenario2(b);
    if (want("S4")) await scenario4(b);
    if (want("S7")) await scenario7(b);
    if (want("S6")) await scenario6(b);
  } finally { b.close(); }
  if (want("S3")) { const b3 = await launch(); try { await scenario3(b3); } finally { b3.close(); } }
  if (want("S5")) { const b5 = await launch(); try { await scenario2(b5, "S5-reduced-motion", true); } finally { b5.close(); } }
  report.finishedAt = new Date().toISOString();
  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  for (const [k, v] of Object.entries(report.scenarios)) console.log(k, v.pass ? "PASS" : "FAIL", JSON.stringify({ ...v, pressed: undefined, released: undefined }).slice(0, 400));
  console.log("evidence dir", OUT);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
