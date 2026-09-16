/**
 * 官网 V2 上线前自检证据（docs/SITE-V2-RELEASE-ACCEPTANCE-20260916.md P02 / P03 / P05 / P07 / P08 / P09）。
 * 对生产构建（next start）用本机 Chrome 无头 + CDP：
 *   P02 尺寸：360/375×812、390×844、412×915、430×812、1024/1100/1280×800、1440×900 首屏截图 + 路线段截图；1440 与 375 整页拼接；每个视口检查横向溢出（可见口径，见 CHECK_JS）、
 *            窄屏首张卡片（地名 / 播放按钮 / Mia 身份 / 第一句）可见、1024–1279 路线段为上下排布（标题在图上方、示例场景列表在下）；
 *   P05 入口：枚举页面所有 <a>，本机请求目标（外链只记录，不请求）；
 *   P07 表单：Plus「Notify me」→ 输入测试地址 → 提交，记录 /api/signup 实际响应与界面状态（未配置 KV 时应保留输入并可重试，不得假成功）；
 *   P08 素材：所有图片资源状态、Inter 字体是否加载、示意说明 / 署名文字是否在 DOM；
 *   P09 运行错误：正常路径（加载 → Hero 试听 → 切到 See & Hear 试听）的控制台错误与失败请求（区分主动取消）。
 * 输出：docs/screens/site-v2-release/<批次>/…（已 gitignore），report.json 为最小报告。
 * 用法：node scripts/release-check-site-v2.mjs [origin]   默认 http://localhost:3001
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const ORIGIN = (args.find((a) => !a.startsWith("--")) ?? "http://localhost:3001").replace(/\/$/, "");
const PATH = "/site-v2";
const BATCH = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const OUT = join("docs/screens/site-v2-release", BATCH);
mkdirSync(OUT, { recursive: true });
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = { batch: BATCH, env: "local production build (next build + next start)", origin: ORIGIN + PATH, startedAt: new Date().toISOString(), chrome: CHROME, viewports: {}, links: [], plus: null, assets: null, runtime: null };

async function launch() {
  const port = 9450 + Math.floor(Math.random() * 50);
  const profile = join(tmpdir(), `rr2-release-${Date.now()}`);
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
  await s("Page.enable"); await s("Runtime.enable"); await s("Network.enable"); await s("Log.enable");
  await s("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  const evaluate = async (expression) => { const { result, exceptionDetails } = await s("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (exceptionDetails) throw new Error(exceptionDetails.text + " " + (exceptionDetails.exception?.description ?? "")); return result.value; };
  const on = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  const close = () => { try { ws.close(); } catch {} chrome.kill(); };
  return { s, evaluate, on, close, sessionId };
}

const shot = async (b, file, clip) => { const { data } = await b.s("Page.captureScreenshot", { format: "jpeg", quality: 82, ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); writeFileSync(file, Buffer.from(data, "base64")); return file; };
const device = (b, w, h, mobile) => b.s("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
const nav = async (b, url) => { const loaded = new Promise((r) => { const off = b.on((m) => { if (m.method === "Page.loadEventFired" && m.sessionId === b.sessionId) { off(); r(); } }); }); await b.s("Page.navigate", { url }); await loaded; await b.evaluate("document.fonts.ready.then(() => true)"); await sleep(900); };

/** 收集控制台错误与网络失败（整个会话期间） */
function collectRuntime(b) {
  const consoleErrors = [], failed = [], responses = [];
  const reqs = new Map();
  b.on((m) => {
    if (m.sessionId !== b.sessionId) return;
    if (m.method === "Runtime.exceptionThrown") consoleErrors.push({ kind: "exception", text: (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || "").slice(0, 300) });
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") consoleErrors.push({ kind: "console.error", text: m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 300) });
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error") consoleErrors.push({ kind: "log", text: `${m.params.entry.source}: ${m.params.entry.text}`.slice(0, 300), url: m.params.entry.url });
    if (m.method === "Network.requestWillBeSent") reqs.set(m.params.requestId, m.params.request.url);
    if (m.method === "Network.responseReceived") responses.push({ url: m.params.response.url, status: m.params.response.status, type: m.params.type });
    if (m.method === "Network.loadingFailed") failed.push({ url: reqs.get(m.params.requestId), error: m.params.errorText, canceled: !!m.params.canceled, type: m.params.type });
  });
  return { consoleErrors, failed, responses };
}

/** 整页：按视口滚动拼接（避免 captureBeyondViewport 的底色伪影） */
async function fullPage(b, w, h, file) {
  const total = await b.evaluate("document.documentElement.scrollHeight");
  const parts = [];
  for (let y = 0; y < total; y += h) {
    await b.evaluate(`scrollTo(0, ${y}); true`); await sleep(350);
    const actualY = await b.evaluate("Math.round(scrollY)");
    const { data } = await b.s("Page.captureScreenshot", { format: "png" });
    const cut = Math.min(h, total - actualY);
    const png = Buffer.from(data, "base64");
    const part = cut < h ? await sharp(png).extract({ left: 0, top: h - cut, width: w, height: cut }).png().toBuffer() : png;
    parts.push({ input: part, top: actualY, left: 0 });
    if (actualY + h >= total) break;
  }
  await sharp({ create: { width: w, height: total, channels: 3, background: "#F9FCFE" } }).composite(parts).jpeg({ quality: 82 }).toFile(file);
  await b.evaluate("scrollTo(0, 0); true"); await sleep(200);
  return total;
}

const CHECK_JS = `(() => {
  const vw = innerWidth;
  const el = (q) => document.querySelector(q);
  const vis = (n) => n && n.offsetParent !== null && n.getClientRects().length > 0;
  const rect = (n) => { const r = n.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) }; };
  // 横向溢出要用「可见」口径：.rr2 是 overflow-x: clip，页面永远不会横向滚动，
  // 所以 scrollWidth 看不出问题（手机上表现为整段内容变宽、右侧被硬裁）。
  // 对每个元素求它与所有裁切祖先的交集右边界，只有仍越过视口的才算真溢出。
  const rr2 = document.querySelector('.rr2');
  const clipRight = (n) => { let r = Infinity; for (let a = n.parentElement; a && a !== document.body; a = a.parentElement) { if (a === rr2) continue; const o = getComputedStyle(a).overflowX; if (o === 'hidden' || o === 'clip' || o === 'auto' || o === 'scroll') r = Math.min(r, a.getBoundingClientRect().right); } return r; };
  const overflowX = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - vw;
  const wide = [...document.querySelectorAll('.rr2 *')].filter((n) => {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') return false;
    const r = n.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && Math.min(r.right, clipRight(n)) > vw + 1;
  }).slice(0, 10).map((n) => ({ sec: (n.closest('section[id], header, footer') || {}).id || '', tag: n.tagName, cls: (n.className || '').toString().slice(0, 60), over: Math.round(Math.min(n.getBoundingClientRect().right, clipRight(n)) - vw) }));
  const heroCard = [...document.querySelectorAll('[data-check="hero-card"]')].find(vis);
  const hc = heroCard ? { rect: rect(heroCard), text: heroCard.innerText.replace(/\\s+/g, ' ').slice(0, 220), hasPlace: /Tour Saint-Jacques/.test(heroCard.innerText), hasPlay: !!heroCard.querySelector('button[aria-label]'), hasMia: /Mia/.test(heroCard.innerText), firstSentence: (heroCard.innerText.match(/[^\\n]*Saint-Jacques[^\\n]*\\./) || heroCard.innerText.match(/“[^”]+”|"[^"]+"/) || [null])[0] } : null;
  const explore = el('#explore');
  const exploreTitle = explore && [...explore.querySelectorAll('h2')].find(vis);
  const explorePic = explore && explore.querySelector('img');
  const exploreList = explore && explore.querySelector('ol');
  const notice = [...document.querySelectorAll('[data-check="route-notice"]')].find(vis) || null;
  const exploreLayout = explore ? { titleAbovePicture: exploreTitle && explorePic ? exploreTitle.getBoundingClientRect().bottom <= explorePic.getBoundingClientRect().top + 1 : null, sceneListVisible: !!(exploreList && vis(exploreList)), sceneListBelowPicture: exploreList && explorePic && vis(exploreList) ? exploreList.getBoundingClientRect().top >= explorePic.getBoundingClientRect().bottom - 1 : null, noticeVisible: !!notice, captionText: (explore.innerText.match(/An illustrated example[^\\n]*/) || [null])[0] } : null;
  return { vw, vh: innerHeight, scrollHeight: document.documentElement.scrollHeight, overflowX, wide, heroCard: hc, explore: exploreLayout, exploreTop: explore ? Math.round(explore.getBoundingClientRect().top + scrollY) : null, exploreHeight: explore ? Math.round(explore.getBoundingClientRect().height) : null };
})()`;

const b = await launch();
const rt = collectRuntime(b);
try {
  // P02 / P03：尺寸与静态截图
  const VIEWPORTS = [[360, 812, true], [375, 812, true], [390, 844, true], [412, 915, true], [430, 812, true], [1024, 800, false], [1100, 800, false], [1280, 800, false], [1440, 900, false]];
  for (const [w, h, mobile] of VIEWPORTS) {
    await device(b, w, h, mobile);
    await nav(b, `${ORIGIN}${PATH}`);
    const dir = join(OUT, `vp-${w}x${h}`); mkdirSync(dir, { recursive: true });
    const check = await b.evaluate(CHECK_JS);
    await shot(b, join(dir, "first-screen.jpg"));
    if (check.exploreTop != null) {
      await b.evaluate(`scrollTo(0, ${Math.max(0, check.exploreTop - 16)}); true`); await sleep(500);
      const y = await b.evaluate("Math.round(scrollY)");
      const top = check.exploreTop - 16 - y; // 视口内偏移
      // CDP 的 clip 以文档原点为参照（等于 scrollY + 视口内偏移）；只截视口内可见部分
      await shot(b, join(dir, "explore.jpg"), { x: 0, y: y + Math.max(0, top), width: w, height: Math.min(h - Math.max(0, top), check.exploreHeight + 32) });
      await b.evaluate("scrollTo(0, 0); true"); await sleep(200);
    }
    let fullHeight = null;
    if (w === 1440 || w === 375) fullHeight = await fullPage(b, w, h, join(dir, "full.jpg"));
    report.viewports[`${w}x${h}`] = { mobile, ...check, fullHeight, shots: ["first-screen.jpg", "explore.jpg", ...(fullHeight ? ["full.jpg"] : [])] };
    console.log(`vp ${w}x${h}`, JSON.stringify({ overflowX: check.overflowX, wide: check.wide.length, wideWhere: check.wide.map((x) => `${x.sec}+${x.over}`), heroCard: check.heroCard && { place: check.heroCard.hasPlace, play: check.heroCard.hasPlay, mia: check.heroCard.hasMia, top: check.heroCard.rect.y }, explore: check.explore }));
  }

  // P05：入口表（本机请求；外链、mailto、锚点只记录）
  await device(b, 1440, 900, false); await nav(b, `${ORIGIN}${PATH}`);
  const anchors = await b.evaluate(`[...document.querySelectorAll('a[href]')].map((a) => ({ href: a.getAttribute('href'), text: (a.innerText || a.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 40), target: a.target || '', section: (a.closest('section, header, footer, nav') || {}).id || (a.closest('header') ? 'nav' : a.closest('footer') ? 'footer' : '') }))`);
  const seen = new Set();
  for (const a of anchors) {
    const key = a.href + "|" + a.text; if (seen.has(key)) continue; seen.add(key);
    let status = null, kind = "internal";
    if (a.href.startsWith("#")) { kind = "anchor"; status = (await b.evaluate(`!!document.querySelector('${a.href}')`)) ? "target exists" : "MISSING"; }
    else if (a.href.startsWith("mailto:")) kind = "mailto";
    else if (/^https?:/.test(a.href)) kind = "external (not requested)";
    else { try { const r = await fetch(ORIGIN + a.href, { redirect: "manual" }); status = r.status; } catch (e) { status = "ERR " + e.message; } }
    report.links.push({ ...a, kind, status });
  }
  console.log("links", report.links.map((l) => `${l.href} → ${l.status ?? l.kind}`).join("\n  "));

  // P08：资源与说明。页面现在是六屏 5400px，懒加载图片要先滚过一遍才会开始加载
  const h = await b.evaluate("document.documentElement.scrollHeight");
  for (let y = 0; y < h; y += 700) { await b.evaluate(`scrollTo({ top: ${y}, behavior: 'instant' }); true`); await sleep(220); }
  await b.evaluate("scrollTo({ top: 0, behavior: 'instant' }); true"); await sleep(900);
  const assets = await b.evaluate(`(() => { const imgs = [...document.images].map((i) => ({ src: (i.currentSrc || i.src).replace(location.origin, ''), ok: i.complete && i.naturalWidth > 0, w: i.naturalWidth, h: i.naturalHeight })); const fonts = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.weight); const t = document.body.innerText; return { imgs, fontsLoaded: [...new Set(fonts)], heroFont: getComputedStyle(document.querySelector('.rr2 h1')).fontFamily.slice(0, 80), texts: { illustrativeNotice: /Illustrative route · not a real map/.test(t), illustratedCaption: /illustrat/i.test(t), notRealMap: /not a real map/i.test(t), creditLascar: /Jorge Láscar/.test(t), creditIbex: /Ibex73/.test(t), sampleLocation: /Sample location/.test(t), aiPortraits: /AI-generated/.test(t), contact: (t.match(/hello@[a-z.]+/) || [null])[0] } }; })()`);
  report.assets = assets;
  console.log("assets", JSON.stringify({ imgsFailed: assets.imgs.filter((i) => !i.ok), fonts: assets.fontsLoaded, heroFont: assets.heroFont, texts: assets.texts }));

  // P09：正常路径（Hero 试听 → See & Hear 试听）
  const t0 = rt.consoleErrors.length, f0 = rt.failed.length;
  await b.evaluate(`(() => { const btn = [...document.querySelectorAll('[data-check="hero-card"] button')].find((x) => x.offsetParent !== null); btn.click(); return true; })()`);
  await sleep(6000);
  const heroState = await b.evaluate(`(() => { const btn = [...document.querySelectorAll('[data-check="hero-card"] button')].find((x) => x.offsetParent !== null); return btn.getAttribute('aria-label'); })()`);
  await b.evaluate(`(() => { const btn = document.querySelector('#see button'); btn.scrollIntoView({ block: 'center' }); btn.click(); return true; })()`);
  await sleep(6000);
  const seeState = await b.evaluate(`document.querySelector('#see button').getAttribute('aria-label')`);
  const heroAfter = await b.evaluate(`(() => { const btn = [...document.querySelectorAll('[data-check="hero-card"] button')].find((x) => x.offsetParent !== null); return btn.getAttribute('aria-label'); })()`);
  const tts = rt.responses.filter((r) => r.url.includes("/api/tts"));
  report.runtime = { heroAfterClick: heroState, seeAfterClick: seeState, heroAfterSeeClick: heroAfter, ttsResponses: tts.map((r) => r.status), consoleErrorsNormalPath: rt.consoleErrors.slice(t0), failedNormalPath: rt.failed.slice(f0) };
  await shot(b, join(OUT, "p09-see-playing.jpg"));
  console.log("runtime", JSON.stringify(report.runtime));

  // P07：Plus 登记（测试地址，未配置 KV 时应为可重试的失败态）
  await b.evaluate(`document.querySelector('#see button').click(); true`); await sleep(300);
  const plusDir = join(OUT, "p07-plus"); mkdirSync(plusDir, { recursive: true });
  const found = await b.evaluate(`(() => { const btn = [...document.querySelectorAll('#start button')].find((x) => /Notify me/.test(x.innerText)); if (!btn) return false; btn.scrollIntoView({ block: 'center' }); btn.click(); return true; })()`);
  await sleep(400);
  let plus = { found };
  if (found) {
    await shot(b, join(plusDir, "01-open.jpg"));
    const hasInput = await b.evaluate(`!!document.querySelector('#start input[type="email"]')`);
    await b.evaluate(`(() => { const i = document.querySelector('#start input[type="email"]'); i.focus(); return true; })()`);
    await b.s("Input.insertText", { text: "release-check@example.com" });
    await sleep(200);
    const r0 = rt.responses.length;
    await b.evaluate(`(() => { const f = document.querySelector('#start form'); f.requestSubmit(); return true; })()`);
    await sleep(3500);
    const signup = rt.responses.slice(r0).filter((r) => r.url.includes("/api/signup"));
    let body = null;
    try { const res = await fetch(`${ORIGIN}/api/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "release-check@example.com", lang: "en" }) }); body = { status: res.status, json: await res.json().catch(() => null) }; } catch (e) { body = { error: e.message }; }
    const ui = await b.evaluate(`(() => { const s = document.querySelector('#start'); const input = s.querySelector('input[type="email"]'); return { inputKept: input ? input.value : null, status: (s.querySelector('[role="status"]') || {}).innerText || null, done: /You’re on the list|You're on the list/.test(s.innerText), buttonText: ([...s.querySelectorAll('button')].find((x) => /Notify me|Try again|Sending/.test(x.innerText)) || {}).innerText || null }; })()`);
    await shot(b, join(plusDir, "02-after-submit.jpg"));
    plus = { found, hasInput, signupResponses: signup.map((r) => r.status), directApiCall: body, ui, verdict: body?.json?.stored === true ? (ui.done ? "stored:true and UI success" : "stored:true but UI not success") : (!ui.done && ui.inputKept ? "not stored → UI kept input, retry available (correct)" : "not stored but UI misreports") };
  }
  report.plus = plus;
  console.log("plus", JSON.stringify(plus));

  report.consoleErrorsAll = rt.consoleErrors;
  report.failedAll = rt.failed;
  report.nonOkResponses = rt.responses.filter((r) => r.status >= 400).map((r) => ({ url: r.url, status: r.status }));
} finally {
  b.close();
}
report.finishedAt = new Date().toISOString();
writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 1));
console.log("release evidence dir", OUT);
