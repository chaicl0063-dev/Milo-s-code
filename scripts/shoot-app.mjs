/**
 * 用本机 Chrome/Edge 的无头模式给应用拍真实截图（官网「一眼看出产品」用的就是这些图，不画假图）。
 * 走 Chrome DevTools Protocol，不依赖 puppeteer：
 *   1. 起无头浏览器，开一个手机尺寸的标签（390×844，2 倍像素）
 *   2. 先打开同源的一个轻页面，往 localStorage 写好「已引导、巴黎圣雅克塔坐标、Mia、静音」
 *   3. 逐个打开要拍的页面，等内容出来，截图存到 public/images/app/
 *
 * 用法：node scripts/shoot-app.mjs [origin]   默认 http://localhost:3000（先把 dev 起好）
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ORIGIN = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const PORT = 9333;
const OUT = "public/images/app";
const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => existsSync(p));
if (!CHROME) throw new Error("no Chrome/Edge found");

/** 要拍的页面：文件名、路径、等待毫秒（地图瓦片和流式讲解需要时间） */
const SHOTS = [
  { name: "app-home", path: "/?focus=wp%3ATour_Saint-Jacques", wait: 7000 },
  { name: "app-place", path: "/p/en/wp%3ATour_Saint-Jacques", wait: 5000 },
  { name: "app-talk", path: "/p/en/wp%3ATour_Saint-Jacques/talk", wait: 12000 },
  { name: "app-guide", path: "/guide", wait: 4000 },
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
const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--hide-scrollbars",
  "--disable-gpu",
  "--lang=en-US",
  "about:blank",
], { stdio: "ignore" });

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

async function main() {
  const wsUrl = await browserWs();
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  const c = cdp(ws);

  const { targetId } = await c.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await c.send("Target.attachToTarget", { targetId, flatten: true });
  const s = (method, params) => c.send(method, params, sessionId);

  await s("Page.enable");
  await s("Runtime.enable");
  await s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await s("Emulation.setUserAgentOverride", {
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36",
  });
  await s("Emulation.setTouchEmulationEnabled", { enabled: true });

  // 写偏好：先开一个同源轻页面
  const nav = async (url) => {
    const loaded = c.waitFor("Page.loadEventFired", sessionId);
    await s("Page.navigate", { url });
    await loaded;
  };
  await nav(`${ORIGIN}/me/about`);
  await s("Runtime.evaluate", {
    expression: `(() => { const p = ${JSON.stringify(PREFS)}; for (const k in p) localStorage.setItem(k, p[k]); return Object.keys(localStorage).length; })()`,
  });

  mkdirSync(OUT, { recursive: true });
  for (const shot of SHOTS) {
    await nav(`${ORIGIN}${shot.path}`);
    await sleep(shot.wait);
    const { data } = await s("Page.captureScreenshot", { format: "png" });
    const file = join(OUT, `${shot.name}.png`);
    writeFileSync(file, Buffer.from(data, "base64"));
    console.log("saved", file);
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
