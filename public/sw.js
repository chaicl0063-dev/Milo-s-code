/**
 * Service Worker：让 App 装到桌面后离线也能打开看过的内容。
 * 策略：
 *  - 页面和 /api/*：先走网络，失败再用缓存（保证数据新，离线时退回上次看过的）
 *  - Next 打包出来的静态文件（带哈希，永不变）：缓存优先
 *  - 地图瓦片和 Wikimedia 图片：缓存优先 + 后台更新，并限制条数防止撑爆
 * 改这个文件后把 VERSION 加一，旧缓存会被清掉。
 */
const VERSION = "v5";
const SHELL = `shell-${VERSION}`;
const STATIC = `static-${VERSION}`;
const TILES = `tiles-${VERSION}`;
const IMAGES = `images-${VERSION}`;
const DATA = `data-${VERSION}`;
const KEEP = new Set([SHELL, STATIC, TILES, IMAGES, DATA]);

const TILE_LIMIT = 600;
const IMAGE_LIMIT = 200;
const DATA_LIMIT = 100;

self.addEventListener("install", (event) => {
  // 预缓存几个页面壳：首页、我的、收藏、离线阅读页，没网时也能打开
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(["/", "/me", "/me/favorites", "/me/settings", "/me/about", "/saved", "/manifest.webmanifest"]).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !KEEP.has(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

/** 缓存条数超过上限就删最早的 */
async function trim(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > limit) await Promise.all(keys.slice(0, keys.length - limit).map((k) => cache.delete(k)));
}

async function cacheFirst(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok || res.type === "opaque") {
    cache.put(request, res.clone()).then(() => limit && trim(cacheName, limit));
  }
  return res;
}

async function staleWhileRevalidate(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const refresh = fetch(request)
    .then((res) => {
      if (res.ok || res.type === "opaque") cache.put(request, res.clone()).then(() => limit && trim(cacheName, limit));
      return res;
    })
    .catch(() => undefined);
  return hit || (await refresh) || Response.error();
}

async function networkFirst(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone()).then(() => limit && trim(cacheName, limit));
    return res;
  } catch {
    const hit = await cache.match(request);
    if (hit) return hit;
    if (request.mode === "navigate") {
      // 同一路径不同参数（/saved?id=...）共用一份壳
      const byPath = await cache.match(new URL(request.url).pathname);
      if (byPath) return byPath;
      // 离线且没缓存过这个页面：退回首页壳
      const shell = await caches.match("/");
      if (shell) return shell;
    }
    throw new Error("offline");
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // 讲解是流式的，不缓存；朗读音频靠 HTTP 缓存头，不进 SW
  if (url.pathname.startsWith("/api/guide") || url.pathname.startsWith("/api/tts")) return;

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
      event.respondWith(cacheFirst(request, STATIC));
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      event.respondWith(networkFirst(request, DATA, DATA_LIMIT));
      return;
    }
    if (request.mode === "navigate") {
      event.respondWith(networkFirst(request, SHELL, 50));
      return;
    }
    return;
  }

  if (url.hostname.endsWith("tile.openstreetmap.org")) {
    event.respondWith(staleWhileRevalidate(request, TILES, TILE_LIMIT));
    return;
  }
  if (url.hostname.endsWith("wikimedia.org") || url.hostname.endsWith("amap.com")) {
    event.respondWith(staleWhileRevalidate(request, IMAGES, IMAGE_LIMIT));
  }
});
