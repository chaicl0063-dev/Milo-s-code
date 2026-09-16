/**
 * 官网 V2 动效性能对比（docs/SITE-V2-MOTION-EXECUTION-CHECKLIST-20260916.md v2 §4「性能」）。
 * 同一生产构建（next build + next start）预热后，对 ?motion=0（关）与默认（开）各做一次 Performance trace：
 * 首屏 5 s → 一次滚动（到底再回顶）→ 一次播放（Hero 卡「Listen」，等到 playing 事件后再看 3 s）。
 * 采样口径：
 *   - CDP Tracing 原始 trace 存为 trace-<variant>.json（可拖进 chrome://tracing / DevTools Performance 面板复看）；
 *   - CDP Performance.getMetrics 在每个阶段前后取差值（TaskDuration / ScriptDuration / LayoutCount / LayoutDuration / RecalcStyleCount / RecalcStyleDuration / JSHeapUsedSize）；
 *   - 页面内 PerformanceObserver：longtask（≥50 ms）与 layout-shift（CLS 贡献），按阶段归档。
 * 只对「开 − 关」的新增开销负责，不宣称全页无长任务。
 * 用法：node scripts/motion-perf.mjs [origin] [--batch=<已有批次目录名>] [--runs=N]   默认 http://localhost:3001，每个变体 runs 次取中位数（默认 3）
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const ORIGIN = (args.find((a) => !a.startsWith("--")) ?? "http://localhost:3001").replace(/\/$/, "");
const BATCH = args.find((a) => a.startsWith("--batch="))?.slice(8) || new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const RUNS = Number(args.find((a) => a.startsWith("--runs="))?.slice(7) || 3);
const PATH = "/site-v2";
const OUT = join("docs/screens/site-v2-motion", BATCH, "perf");
mkdirSync(OUT, { recursive: true });
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 注入：长任务 / 布局偏移 / 媒体 playing 记录（不改变页面行为） */
const OBSERVERS = `(() => {
  window.__perf = { longtasks: [], shifts: [], playing: [] };
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.longtasks.push({ t: Math.round(e.startTime), dur: Math.round(e.duration) }); }).observe({ type: "longtask", buffered: true }); } catch {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perf.shifts.push({ t: Math.round(e.startTime), value: +e.value.toFixed(4) }); }).observe({ type: "layout-shift", buffered: true }); } catch {}
  const P = HTMLMediaElement.prototype, orig = P.play;
  P.play = function () { if (!this.__w) { this.__w = 1; this.addEventListener("playing", () => window.__perf.playing.push(Math.round(performance.now()))); } return orig.apply(this, arguments); };
})();`;

async function launch() {
  const port = 9400 + Math.floor(Math.random() * 50);
  const profile = join(tmpdir(), `rr2-perf-${Date.now()}`);
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--hide-scrollbars", "--disable-gpu", "--autoplay-policy=no-user-gesture-required", "--lang=en-US", "about:blank"], { stdio: "ignore" });
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
  await s("Page.enable"); await s("Runtime.enable"); await s("Performance.enable", { timeDomain: "timeTicks" });
  await s("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVERS });
  await s("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  // 无头 Chrome 跟随系统「减少动态效果」；对比要在正常模式下做
  await s("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  const evaluate = async (expression) => { const { result, exceptionDetails } = await s("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (exceptionDetails) throw new Error(exceptionDetails.text + " " + (exceptionDetails.exception?.description ?? "")); return result.value; };
  const on = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  const close = () => { try { ws.close(); } catch {} chrome.kill(); };
  return { s, evaluate, on, close, sessionId };
}

const nav = async (b, url) => { const loaded = new Promise((r) => { const off = b.on((m) => { if (m.method === "Page.loadEventFired" && m.sessionId === b.sessionId) { off(); r(); } }); }); await b.s("Page.navigate", { url }); await loaded; };
const KEYS = ["TaskDuration", "ScriptDuration", "LayoutCount", "LayoutDuration", "RecalcStyleCount", "RecalcStyleDuration", "JSHeapUsedSize"];
const metrics = async (b) => Object.fromEntries((await b.s("Performance.getMetrics")).metrics.filter((m) => KEYS.includes(m.name)).map((m) => [m.name, m.value]));
const delta = (a, c) => Object.fromEntries(KEYS.map((k) => [k, k.endsWith("Duration") ? +((c[k] - a[k]) * 1000).toFixed(1) : k === "JSHeapUsedSize" ? Math.round((c[k] - a[k]) / 1024) : c[k] - a[k]]));
const perfSlice = async (b, from) => b.evaluate(`(() => { const p = window.__perf; const f = ${from}; return { longtasks: p.longtasks.filter((x) => x.t >= f), cls: +p.shifts.filter((x) => x.t >= f).reduce((s, x) => s + x.value, 0).toFixed(4), playing: p.playing.filter((x) => x >= f) }; })()`);
const now = (b) => b.evaluate("Math.round(performance.now())");

/** 把 trace 流写到文件 */
async function saveTrace(b, stream, file) {
  const out = createWriteStream(file);
  for (;;) {
    const { data, base64Encoded, eof } = await b.s("IO.read", { handle: stream, size: 1 << 20 });
    out.write(base64Encoded ? Buffer.from(data, "base64") : data);
    if (eof) break;
  }
  await new Promise((r) => out.end(r));
  await b.s("IO.close", { handle: stream }).catch(() => {});
}

async function run(b, variant, url, idx, trace) {
  const phases = {};
  let stream;
  if (trace) {
    const done = new Promise((r) => { const off = b.on((m) => { if (m.method === "Tracing.tracingComplete" && m.sessionId === b.sessionId) { off(); r(m.params.stream); } }); });
    await b.s("Tracing.start", { transferMode: "ReturnAsStream", streamFormat: "json", traceConfig: { includedCategories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "disabled-by-default-devtools.timeline.frame", "blink.user_timing", "loading", "v8.execute", "rail"] } });
    stream = done;
  }
  // 阶段 1：首屏 5 s
  // Performance.getMetrics 的计数器随新文档归零，首屏阶段直接取导航后 5 s 的绝对值（= 该文档自开始以来的累计）
  const tNav = performance.now();
  await nav(b, url);
  const t0 = 0; await sleep(5000);
  const m1 = await metrics(b);
  const zero = Object.fromEntries(KEYS.map((k) => [k, 0]));
  phases.firstScreen5s = { wall: Math.round(performance.now() - tNav), ...delta(zero, m1), ...(await perfSlice(b, t0)) };
  // 阶段 2：一次滚动（到底 → 回顶，步进 300 px，每步一帧左右）
  const t1 = await now(b); const m2a = await metrics(b);
  const h = await b.evaluate("document.documentElement.scrollHeight - innerHeight");
  for (let y = 0; y <= h; y += 300) { await b.evaluate(`scrollTo(0, ${y}); true`); await sleep(50); }
  await sleep(500);
  for (let y = h; y >= 0; y -= 300) { await b.evaluate(`scrollTo(0, ${y}); true`); await sleep(50); }
  await sleep(600);
  const m2b = await metrics(b);
  phases.scroll = { ...delta(m2a, m2b), ...(await perfSlice(b, t1)) };
  // 阶段 3：一次播放（Hero「Listen」），等到 playing 后再看 3 s
  const t2 = await now(b); const m3a = await metrics(b);
  await b.evaluate(`(() => { const btn = [...document.querySelectorAll('[data-check="hero-card"] button')].find((x) => x.offsetParent !== null); btn.click(); return true; })()`);
  const tClick = Date.now();
  for (; Date.now() - tClick < 15000;) { if ((await b.evaluate("window.__perf.playing.length")) > 0) break; await sleep(150); }
  const playingAfterMs = Date.now() - tClick;
  await sleep(3000);
  const m3b = await metrics(b);
  phases.play = { playingAfterMs, ...delta(m3a, m3b), ...(await perfSlice(b, t2)), waveRunning: await b.evaluate(`[...document.querySelectorAll('.v2-wave-bar')].some((x) => getComputedStyle(x).animationName !== 'none' && getComputedStyle(x).animationPlayState === 'running')`) };
  await b.evaluate(`(() => { const btn = [...document.querySelectorAll('[data-check="hero-card"] button')].find((x) => x.offsetParent !== null); btn.click(); return true; })()`);
  await sleep(300);
  let traceFile = null;
  if (trace) {
    await b.s("Tracing.end");
    traceFile = join(OUT, `trace-${variant}.json`);
    await saveTrace(b, await stream, traceFile);
  }
  return { variant, run: idx, url, phases, traceFile };
}

const VARIANTS = [
  { variant: "off", url: `${ORIGIN}${PATH}?motion=0` },
  { variant: "on", url: `${ORIGIN}${PATH}` },
];
const med = (xs) => { const s = [...xs].sort((a, c) => a - c); return s.length % 2 ? s[(s.length - 1) / 2] : +((s[s.length / 2 - 1] + s[s.length / 2]) / 2).toFixed(1); };

const report = { batch: BATCH, origin: ORIGIN, startedAt: new Date().toISOString(), runsPerVariant: RUNS, chrome: CHROME, viewport: "1440x900 desktop, prefers-reduced-motion emulated no-preference", warmup: "每个变体先无 trace 加载一次预热（不计）", runs: [], summary: {} };
const b = await launch();
try {
  // 预热：两个 URL 各打开一次
  for (const v of VARIANTS) { await nav(b, v.url); await sleep(1500); }
  // 交替跑，减少时序偏差；第 1 轮带 trace 存档
  for (let i = 0; i < RUNS; i++) for (const v of VARIANTS) {
    const r = await run(b, v.variant, v.url, i + 1, i === 0);
    report.runs.push(r);
    console.log(`${v.variant} #${i + 1}`, JSON.stringify({ first: { task: r.phases.firstScreen5s.TaskDuration, long: r.phases.firstScreen5s.longtasks.length, cls: r.phases.firstScreen5s.cls }, scroll: { task: r.phases.scroll.TaskDuration, layout: r.phases.scroll.LayoutCount, long: r.phases.scroll.longtasks.length }, play: { task: r.phases.play.TaskDuration, layout: r.phases.play.LayoutCount, long: r.phases.play.longtasks.length, wave: r.phases.play.waveRunning } }));
  }
  const FIELDS = ["TaskDuration", "ScriptDuration", "LayoutCount", "LayoutDuration", "RecalcStyleCount", "RecalcStyleDuration"];
  for (const phase of ["firstScreen5s", "scroll", "play"]) {
    report.summary[phase] = {};
    for (const v of VARIANTS) {
      const rs = report.runs.filter((r) => r.variant === v.variant).map((r) => r.phases[phase]);
      report.summary[phase][v.variant] = { ...Object.fromEntries(FIELDS.map((f) => [f, med(rs.map((r) => r[f]))])), longtasks: rs.map((r) => r.longtasks.length), longtaskMaxMs: Math.max(0, ...rs.flatMap((r) => r.longtasks.map((x) => x.dur))), cls: med(rs.map((r) => r.cls)) };
    }
    const a = report.summary[phase].off, c = report.summary[phase].on;
    report.summary[phase].delta_on_minus_off = Object.fromEntries(FIELDS.map((f) => [f, +(c[f] - a[f]).toFixed(1)]));
  }
} finally {
  b.close();
}
report.finishedAt = new Date().toISOString();
writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report.summary, null, 1));
console.log("perf dir", OUT);
