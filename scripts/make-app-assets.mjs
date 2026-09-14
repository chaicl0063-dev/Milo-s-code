/**
 * 生成给 @capacitor/assets 用的源图（assets/ 目录）：
 *   icon.png 1024      图标（带深墨底，方形，系统自己裁圆角）
 *   icon-foreground.png / icon-background.png 1024   自适应图标的前景（图钉+耳机）和纯色背景
 *   splash.png / splash-dark.png 2732             启动图：米白底居中一个图标
 * 运行：node scripts/make-app-assets.mjs && npx capacitor-assets generate --android
 * 图标形状和 scripts/make-icons.mjs 里同一段 SVG。
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const INK = "#1B1F1D";
const BG = "#F4F1EA";

function mark(size, scale) {
  return `
  <g transform="translate(${size / 2} ${size / 2 + size * 0.043}) scale(${(size / 512) * scale})">
    <path d="M -152 -30 A 152 152 0 1 1 152 -30 C 152 56 44 108 14 176 Q 0 196 -14 176 C -44 108 -152 56 -152 -30 Z" fill="#B85C38"/>
    <path d="M -216 -30 A 216 216 0 0 1 216 -30" fill="none" stroke="#F4F1EA" stroke-width="26" stroke-linecap="round"/>
    <rect x="-246" y="-86" width="62" height="118" rx="31" fill="#F4F1EA"/>
    <rect x="184" y="-86" width="62" height="118" rx="31" fill="#F4F1EA"/>
  </g>`;
}

const svg = (size, body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ""}${body}</svg>`;

mkdirSync("assets", { recursive: true });
const out = (s, file) => sharp(Buffer.from(s)).png().toFile(file).then(() => console.log("wrote", file));

await out(svg(1024, mark(1024, 0.72), INK), "assets/icon.png");
// 自适应图标：系统会把前景缩到中间约 66% 的安全区，所以这里画得小一点
await out(svg(1024, mark(1024, 0.46), null), "assets/icon-foreground.png");
await out(svg(1024, "", INK), "assets/icon-background.png");
// 启动图：浅底 + 居中的深色圆角方块图标
const tile = (size) =>
  `<rect x="${size / 2 - 180}" y="${size / 2 - 180}" width="360" height="360" rx="80" fill="${INK}"/>` +
  `<g transform="translate(${size / 2 - 512} ${size / 2 - 512}) scale(1)">${svg(1024, mark(1024, 0.72 * 0.3516), null).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`;
await out(svg(2732, tile(2732), BG), "assets/splash.png");
await out(svg(2732, tile(2732).replace(INK, "#2A2F2C"), "#1B1F1D"), "assets/splash-dark.png");
console.log("done");
