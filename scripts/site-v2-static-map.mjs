/**
 * 官网 V2「Keep exploring」的静态底图：用 OpenStreetMap 标准瓦片拼图（桌面 z17、手机 z18），浅色处理，裁桌面 1920×480 与手机 900×900 两版，
 * 并按 Web Mercator 算出起点与三站（scripts/fixtures/route-paris-1h.json 的真实经纬度）在两版里的百分比。
 * 输出 public/images/map-chatelet-{desktop,mobile}.jpg，并把百分比打印出来 → 手工填进 lib/site-v2/content.ts 的 MAP。
 *
 * 只在换底图 / 裁切 / 容器比例时重跑（换任一项都必须重算点位，见 docs/SITE-V2-SPATIAL-ROUTE-CHECKS.md 第 5 节）。
 * 瓦片缓存在 node_modules/.cache/osm-tiles/，一次约 36–70 张，带 User-Agent，符合 OSM 瓦片使用政策的零星使用；署名 © OpenStreetMap contributors 已在页面可见。
 * 联网需要代理时：Node 24 用 NODE_USE_ENV_PROXY=1 HTTPS_PROXY=http://127.0.0.1:7890 node scripts/site-v2-static-map.mjs
 *
 * 用法：node scripts/site-v2-static-map.mjs
 */
import { mkdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = 256;
// 桌面 z17（样张里的地图带比较矮，1920×480；1、2 站 17 m ≈ 22 px 仍可分开标注），手机 z18（900×900）
const lon2x = (lon, Z) => ((lon + 180) / 360) * 2 ** Z * T;
const lat2y = (lat, Z) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** Z * T;
};
const px2lon = (x, Z) => (x / (2 ** Z * T)) * 360 - 180;

const fixture = JSON.parse(readFileSync(join(ROOT, "scripts/fixtures/route-paris-1h.json"), "utf8"));
const points = { you: fixture.origin, ...Object.fromEntries(fixture.stops.map((s, i) => [`s${i + 1}`, { lat: s.lat, lon: s.lon, name: s.title }])) };
const lons = [fixture.origin.lon, ...fixture.stops.map((s) => s.lon)], lats = [fixture.origin.lat, ...fixture.stops.map((s) => s.lat)];
const minLon = Math.min(...lons), maxLon = Math.max(...lons), minLat = Math.min(...lats), maxLat = Math.max(...lats);

// 两版裁切（世界像素坐标）。桌面：最西的点放在 45%，左边留给文字；手机：居中，略往上留给「起点」气泡
// 桌面约 4:1（样张地图带 255px@1024 ≈ 358px@1440 → 1920×480）；三站纵向跨度 200 m 在 z17 约 254 px，占 53%，放得下
const desktop = { z: 17, w: 1920, h: 480 };
desktop.x0 = lon2x(minLon, 17) - 0.5 * desktop.w;
desktop.y0 = (lat2y(maxLat, 17) + lat2y(minLat, 17)) / 2 - desktop.h / 2;
const mobile = { z: 18, w: 900, h: 900 };
mobile.x0 = (lon2x(minLon, 18) + lon2x(maxLon, 18)) / 2 - mobile.w / 2;
mobile.y0 = (lat2y(maxLat, 18) + lat2y(minLat, 18)) / 2 - mobile.h / 2 + 40;

const cacheDir = join(ROOT, "node_modules/.cache/osm-tiles");
mkdirSync(cacheDir, { recursive: true });
async function tile(x, y, Z) {
  const f = join(cacheDir, `${Z}-${x}-${y}.png`);
  if (!existsSync(f)) {
    const res = await fetch(`https://tile.openstreetmap.org/${Z}/${x}/${y}.png`, { headers: { "User-Agent": "ReAroundYou-site/1.0 (one-off static map for website; hello@bubblefrog.fun)" } });
    if (!res.ok) throw new Error(`tile ${x},${y} ${res.status}`);
    writeFileSync(f, Buffer.from(await res.arrayBuffer()));
    await new Promise((r) => setTimeout(r, 150));
  }
  return f;
}

async function render(crop, name) {
  const Z = crop.z;
  const tx0 = Math.floor(crop.x0 / T), ty0 = Math.floor(crop.y0 / T);
  const tx1 = Math.floor((crop.x0 + crop.w) / T), ty1 = Math.floor((crop.y0 + crop.h) / T);
  const comps = [];
  for (let x = tx0; x <= tx1; x++) for (let y = ty0; y <= ty1; y++) comps.push({ input: await tile(x, y, Z), left: (x - tx0) * T, top: (y - ty0) * T });
  const mosaic = await sharp({ create: { width: (tx1 - tx0 + 1) * T, height: (ty1 - ty0 + 1) * T, channels: 3, background: "#fff" } }).composite(comps).png().toBuffer();
  const ox = Math.round(crop.x0 - tx0 * T), oy = Math.round(crop.y0 - ty0 * T);
  // 浅色处理：降饱和、提亮，再罩一层页面底色 #F7F9FC
  const styled = await sharp(mosaic)
    .extract({ left: ox, top: oy, width: crop.w, height: crop.h })
    .modulate({ saturation: 0.26, brightness: 1.05 })
    .composite([{ input: { create: { width: crop.w, height: crop.h, channels: 4, background: { r: 249, g: 252, b: 254, alpha: 0.42 } } } }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  writeFileSync(join(ROOT, `public/images/${name}.jpg`), styled);
  const pct = {};
  for (const [k, p] of Object.entries(points)) pct[k] = { x: +(((lon2x(p.lon, Z) - crop.x0) / crop.w) * 100).toFixed(2), y: +(((lat2y(p.lat, Z) - crop.y0) / crop.h) * 100).toFixed(2) };
  console.log(`${name} ${crop.w}x${crop.h} ${styled.length >> 10} KB · ${comps.length} tiles · z${Z} · west edge ${px2lon(crop.x0, Z).toFixed(6)}°E → east edge ${px2lon(crop.x0 + crop.w, Z).toFixed(6)}°E`);
  console.log("  MAP points %:", JSON.stringify(pct));
  console.log("  metres per css px @1440:", ((0.6579 * 40075016.686) / (2 ** Z * T) * (crop.w / 1440)).toFixed(2));
}

await render(desktop, "map-chatelet-desktop");
await render(mobile, "map-chatelet-mobile");
