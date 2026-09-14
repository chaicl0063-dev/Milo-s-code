/**
 * 把 assets/ 里的源图渲染成安卓工程需要的各密度资源（@capacitor/assets 自带的旧版 sharp 在 Node 24 上跑不起来，所以自己写）。
 *   mipmap-<密度>/ic_launcher.png · ic_launcher_round.png · ic_launcher_foreground.png
 *   mipmap-anydpi-v26/ic_launcher.xml（自适应图标）
 *   drawable-<方向>-<密度>/splash.png（启动图，竖横各五档）
 * 运行：node scripts/make-app-assets.mjs && node scripts/make-android-res.mjs
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";

const RES = "android/app/src/main/res";
const DENSITY = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

async function icon(src, size, out, round = false) {
  let img = sharp(src).resize(size, size);
  if (round) {
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`);
    img = img.composite([{ input: mask, blend: "dest-in" }]);
  }
  await img.png().toFile(out);
}

for (const [d, k] of Object.entries(DENSITY)) {
  const dir = `${RES}/mipmap-${d}`;
  mkdirSync(dir, { recursive: true });
  await icon("assets/icon.png", Math.round(48 * k), `${dir}/ic_launcher.png`);
  await icon("assets/icon.png", Math.round(48 * k), `${dir}/ic_launcher_round.png`, true);
  await icon("assets/icon-foreground.png", Math.round(108 * k), `${dir}/ic_launcher_foreground.png`);
  console.log("icons", d);
}

// 自适应图标：前景是位图，背景是纯色
mkdirSync(`${RES}/mipmap-anydpi-v26`, { recursive: true });
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
writeFileSync(`${RES}/mipmap-anydpi-v26/ic_launcher.xml`, adaptive);
writeFileSync(`${RES}/mipmap-anydpi-v26/ic_launcher_round.xml`, adaptive);
mkdirSync(`${RES}/values`, { recursive: true });
writeFileSync(
  `${RES}/values/ic_launcher_background.xml`,
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1B1F1D</color>\n</resources>\n`,
);
// 模板自带的矢量前景/背景不再需要
for (const f of [`${RES}/drawable-v24/ic_launcher_foreground.xml`, `${RES}/drawable/ic_launcher_background.xml`]) if (existsSync(f)) rmSync(f);

// 启动图：以 2732 的方图居中裁成各屏幕比例
const SPLASH = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };
async function splash(w, h, out) {
  await sharp("assets/splash.png").resize(w, h, { fit: "cover", position: "centre" }).png().toFile(out);
}
for (const [d, [w, h]] of Object.entries(SPLASH)) {
  mkdirSync(`${RES}/drawable-port-${d}`, { recursive: true });
  mkdirSync(`${RES}/drawable-land-${d}`, { recursive: true });
  await splash(w, h, `${RES}/drawable-port-${d}/splash.png`);
  await splash(h, w, `${RES}/drawable-land-${d}/splash.png`);
  console.log("splash", d);
}
await splash(480, 800, `${RES}/drawable/splash.png`);
console.log("done");
