/**
 * 用本机 Chrome/Edge 的无头模式拍真实截图（官网「一眼看出产品」用的就是这些图，不画假图）。
 * 走 Chrome DevTools Protocol，不依赖 puppeteer。
 *
 * 应用模式（默认）：
 *   1. 起无头浏览器，开一个手机尺寸的标签（390×844，2 倍像素）
 *   2. 先打开同源的一个轻页面，往 localStorage 写好「已引导、巴黎圣雅克塔坐标、Mia、静音」
 *   3. 拍四屏：地图（圣雅克塔卡片）、地点页、讲解页、导游页；去掉 Next 开发角标；转 webp
 *   4. 从四屏裁出官网要的摘录（只裁，不改）：app-home-focus / app-talk-top / app-talk-ask
 *   5. 走一遍真实的一小时路线流程：导游页点「I have an hour.」→「Make the route」→ 等结果 →
 *      拍结果（app-route）→ 点「Show on map」→ 拍地图上的同一条路线（app-route-map）；
 *      把这条路线原样存到 scripts/fixtures/route-paris-1h.json 作为记录（站点、时长与截图对应）
 *   所有文件存到 public/images/app/。裁切范围记在 docs/IMAGE-MANIFEST.md。
 *
 * 官网模式（--site）：拍 /site 给评审用，存到 docs/screens/：
 *   桌面 1440 整页、桌面 1280×800 首屏视口、手机 375×812 整页与首屏视口、桌面四个关键段落的局部，
 *   并在 360 / 430 宽检查有没有横向溢出。
 *
 * 用法：node scripts/shoot-app.mjs [origin] [--site | --route]   默认 http://localhost:3000（先把 dev 起好）；--route 只重跑路线流程
 */
import { spawn } from "node:child_process";
import { mkdirSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const SITE = args.includes("--site");
const ROUTE_ONLY = args.includes("--route"); // 只重跑路线流程，不重拍四屏
const ORIGIN = (args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
const PORT = 9333;
const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => existsSync(p));
if (!CHROME) throw new Error("no Chrome/Edge found");

/** 应用截图：文件名、路径、等待毫秒（地图瓦片和流式讲解需要时间） */
const APP_SHOTS = [
  { name: "app-home", path: "/?focus=wp%3ATour_Saint-Jacques", wait: 7000 },
  { name: "app-place", path: "/p/en/wp%3ATour_Saint-Jacques", wait: 5000 },
  { name: "app-talk", path: "/p/en/wp%3ATour_Saint-Jacques/talk", wait: 12000 },
  { name: "app-guide", path: "/guide", wait: 4000 },
];

/** 从整屏截图（780×1688）裁出的摘录：来源、区域（像素，2 倍图） */
const CROPS = [
  { name: "app-home-focus", from: "app-home", top: 560, height: 1000 }, // 地图下半 + 圣雅克塔地点卡，不含底部 tab
  { name: "app-talk-top", from: "app-talk", top: 0, height: 1000 }, // 地点名、Mia、静音状态、前几句
  { name: "app-talk-ask", from: "app-talk", top: 1540, height: 148 }, // 底部追问输入栏
];

const PREFS = {
  "tourguide.onboarded": "1",
  "tourguide.coords": JSON.stringify({ lat: 48.8579, lon: 2.3489 }),
  "tourguide.persona": "mia",
  "tourguide.autoSpeak": "0",
  "tourguide.lang": "en",
  "tourguide.guideLang": "en",
  "tourguide.installHintDismissed": "1",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = join(tmpdir(), `rearound-shoot-${Date.now()}`);
const chrome = spawn(
  CHROME,
  ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-gpu", "--lang=en-US", "about:blank"],
  { stdio: "ignore" },
);

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

/** 极简 CDP 客户端：一个 WebSocket，按 id 配对响应，按 sessionId 分发事件 */
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

/** 截图前的清理：去掉 Next 开发角标（生产环境没有它，截图里也不该有） */
const CLEANUP = `document.querySelectorAll("nextjs-portal").forEach((e) => e.remove()); true`;

/** 整页截图前：把懒加载图片改成立即加载，滚一遍触发所有图，再回到顶部 */
const WARM_UP = `(async () => {
  document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = "eager"; });
  const h = document.documentElement.scrollHeight;
  for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 800));
  return document.documentElement.scrollHeight;
})()`;

/** 按可见文字点一个按钮 */
const clickButton = (text) => `(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim().startsWith(${JSON.stringify(text)}));
  if (!b) return false; b.click(); return true;
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
    const { result } = await s("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    return result.value;
  };

  await s("Page.enable");
  await s("Runtime.enable");
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

  if (!SITE) {
    const OUT = "public/images/app";
    mkdirSync(OUT, { recursive: true });
    await device(390, 844, 2, true);
    await s("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36" });
    await s("Emulation.setTouchEmulationEnabled", { enabled: true });

    // 写偏好：先开一个同源轻页面
    await nav(`${ORIGIN}/me/about`);
    await evaluate(`(() => { const p = ${JSON.stringify(PREFS)}; for (const k in p) localStorage.setItem(k, p[k]); return Object.keys(localStorage).length; })()`);

    const pngs = {};
    for (const shot of ROUTE_ONLY ? [] : APP_SHOTS) {
      await nav(`${ORIGIN}${shot.path}`);
      await sleep(shot.wait);
      pngs[shot.name] = await shoot();
      const file = join(OUT, `${shot.name}.webp`);
      await sharp(pngs[shot.name]).webp({ quality: 82 }).toFile(file);
      console.log("saved", file);
    }
    for (const crop of ROUTE_ONLY ? [] : CROPS) {
      const file = join(OUT, `${crop.name}.webp`);
      await sharp(pngs[crop.from]).extract({ left: 0, top: crop.top, width: 780, height: crop.height }).webp({ quality: 82 }).toFile(file);
      console.log("saved", file, `(${crop.from} y ${crop.top}-${crop.top + crop.height})`);
    }

    // 真实的一小时路线流程
    await nav(`${ORIGIN}/guide`);
    await sleep(3000);
    if (!(await evaluate(clickButton("I have an hour.")))) throw new Error("no 'I have an hour.' button");
    await sleep(800);
    if (!(await evaluate(clickButton("Make the route")))) throw new Error("no 'Make the route' button");
    let ready = false;
    for (let i = 0; i < 90 && !ready; i++) {
      await sleep(1000);
      ready = await evaluate(`[...document.querySelectorAll("button")].some((x) => x.textContent.trim() === "Show on map")`);
    }
    if (!ready) throw new Error("route did not come back within 90s (plan failed?)");
    await sleep(1500);
    // 结果可能比一屏长：把视口拉到整页高，再只裁出路线结果那一块（开场白 → 各站 → Show on map）
    const full = Math.min(await evaluate(`document.documentElement.scrollHeight`), 2400);
    await device(390, full, 2, true);
    await sleep(800);
    const rect = await evaluate(`(() => {
      const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Show on map");
      const box = b.closest(".flex.flex-col.gap-2") || b.parentElement.parentElement;
      const r = box.getBoundingClientRect();
      return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY, width: window.innerWidth };
    })()`);
    const png = await shoot({ captureBeyondViewport: true });
    const top = Math.max(0, Math.round(rect.top * 2) - 24);
    const height = Math.round((rect.bottom - rect.top) * 2) + 48;
    const meta = await sharp(png).metadata();
    const h = Math.min(height, meta.height - top);
    await sharp(png).extract({ left: 0, top, width: 780, height: h }).webp({ quality: 82 }).toFile(join(OUT, "app-route.webp"));
    console.log("saved", join(OUT, "app-route.webp"), `780x${h}`);

    // 同一条路线在地图上
    await device(390, 844, 2, true);
    await sleep(500);
    if (!(await evaluate(clickButton("Show on map")))) throw new Error("no 'Show on map' button");
    await sleep(8000);
    const mapPng = await shoot();
    await sharp(mapPng).webp({ quality: 82 }).toFile(join(OUT, "app-route-map.webp"));
    console.log("saved", join(OUT, "app-route-map.webp"));

    // 记录这条路线（就是截图里的那条）
    const route = await evaluate(`localStorage.getItem("tourguide.route")`);
    if (route) {
      mkdirSync("scripts/fixtures", { recursive: true });
      const plan = JSON.parse(route);
      writeFileSync("scripts/fixtures/route-paris-1h.json", JSON.stringify({ capturedAt: new Date().toISOString(), ...plan }, null, 2));
      console.log("route:", plan.stops.map((x) => x.title).join(" → "), `· ${plan.stops.length} stops · ${plan.totalMinutes} min`);
    }
  } else {
    const OUT = "docs/screens";
    mkdirSync(OUT, { recursive: true });
    const save = async (name, png, ext = "jpg") => {
      const file = join(OUT, `${name}.${ext}`);
      await sharp(png).jpeg({ quality: 86 }).toFile(file);
      console.log("saved", file);
    };
    /** 整页截图：一次抓太高的页面会卡住，改成按 1600px 一段抓 clip，再用 sharp 拼起来 */
    const shootFull = async (width, fullHeight, scale) => {
      const step = 1600;
      const tiles = [];
      for (let y = 0; y < fullHeight; y += step) {
        const h = Math.min(step, fullHeight - y);
        const png = await shoot({ captureBeyondViewport: true, clip: { x: 0, y, width, height: h, scale: 1 } });
        tiles.push({ input: png, top: y * scale, left: 0 });
      }
      return sharp({ create: { width: width * scale, height: fullHeight * scale, channels: 3, background: "#F7F8FA" } })
        .composite(tiles)
        .png()
        .toBuffer();
    };
    const open = async (width, height, scale, mobile) => {
      await device(width, height, scale, mobile);
      await nav(`${ORIGIN}/site`);
      await sleep(3000);
      return evaluate(WARM_UP);
    };

    // 桌面：首屏视口 1280×800，整页 1440，四个关键段落局部
    await open(1280, 800, 1, false);
    await save("desktop-hero-1280x800", await shoot());
    const fullDesktop = Math.min(await open(1440, 900, 1, false), 16000);
    for (const id of ["top", "how", "demo", "explore"]) {
      const r = await evaluate(`(() => { const e = document.getElementById(${JSON.stringify(id)}); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height }; })()`);
      await device(1440, fullDesktop, 1, false);
      await sleep(300);
      await save(`desktop-section-${id}`, await shoot({ captureBeyondViewport: true, clip: { x: 0, y: r.y, width: 1440, height: r.h, scale: 1 } }));
    }
    await device(1440, fullDesktop, 1, false);
    await sleep(500);
    await save("desktop-full-1440", await shootFull(1440, fullDesktop, 1));

    // 手机：首屏视口 375×812，整页
    await open(375, 812, 2, true);
    await save("mobile-hero-375x812", await shoot());
    const fullMobile = Math.min(await evaluate(`document.documentElement.scrollHeight`), 16000);
    await device(375, fullMobile, 2, true);
    await sleep(500);
    await save("mobile-full-375", await shootFull(375, fullMobile, 2));
    // 手机关键段落局部（原尺寸 2×）：BI-01 的路线板、BI-02 的邮箱表单
    for (const id of ["explore", "plus"]) {
      const r = await evaluate(`(() => { const e = document.getElementById(${JSON.stringify(id)}); const r = e.getBoundingClientRect(); return { y: r.top + window.scrollY, h: r.height }; })()`);
      await save(`mobile-section-${id}`, await shoot({ captureBeyondViewport: true, clip: { x: 0, y: r.y, width: 375, height: r.h, scale: 1 } }));
    }
    // 邮箱输入框与按钮的实际渲染高度（CSS px）
    const form = await evaluate(`(() => { const i = document.querySelector('#plus input[type=email]'); const b = document.querySelector('#plus button[type=submit]'); return { input: i && i.getBoundingClientRect().height, button: b && b.getBoundingClientRect().height }; })()`);
    console.log(`375: email input ${form.input}px, Get notified ${form.button}px`);

    // 横向溢出检查
    for (const w of [360, 375, 430]) {
      await device(w, 812, 2, true);
      await sleep(600);
      const over = await evaluate(`({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })`);
      console.log(`width ${w}: scrollWidth ${over.sw} / innerWidth ${over.iw} → ${over.sw > over.iw ? "OVERFLOW" : "ok"}`);
    }
  }
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
        /* profile may still be locked briefly */
      }
    }, 500);
  });
