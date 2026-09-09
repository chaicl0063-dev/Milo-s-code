/**
 * 用 sharp 把一个内联 SVG 渲染成 PWA 需要的各尺寸 PNG。
 * 运行：node scripts/make-icons.mjs
 * 改图标只改下面的 SVG 字符串，然后重跑。
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

// 深墨底 + 赭石图钉 + 米白圆点，和 App 的设计令牌一致
function iconSvg({ padding = 0, rounded = true }) {
  const size = 512;
  const inner = size - padding * 2;
  const r = rounded ? Math.round(inner * 0.22) : 0;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="${padding}" y="${padding}" width="${inner}" height="${inner}" rx="${r}" fill="#1B1F1D"/>
  <g transform="translate(${size / 2} ${size / 2}) scale(${inner / 512})">
    <path d="M0 -150 C -78 -150 -132 -96 -132 -22 C -132 70 0 176 0 176 S 132 70 132 -22 C 132 -96 78 -150 0 -150 Z" fill="#B85C38"/>
    <circle cx="0" cy="-24" r="46" fill="#F4F1EA"/>
  </g>
</svg>`;
}

async function render(svg, size, out) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
  console.log("wrote", out);
}

mkdirSync("public/icons", { recursive: true });
const plain = iconSvg({ padding: 0 });
// maskable 图标要求主体留在中间 80% 的安全区，所以四周多留边
const maskable = iconSvg({ padding: 64, rounded: false }).replace('rx="0" fill="#1B1F1D"', 'rx="0" fill="#1B1F1D"').replace(
  `<rect x="64" y="64"`,
  `<rect x="0" y="0" width="512" height="512" fill="#1B1F1D"/><rect x="64" y="64"`,
);

await render(plain, 192, "public/icons/icon-192.png");
await render(plain, 512, "public/icons/icon-512.png");
await render(maskable, 512, "public/icons/icon-maskable-512.png");
await render(plain, 180, "app/apple-icon.png");
await render(plain, 64, "app/icon.png");
writeFileSync("public/icons/icon.svg", plain.trim());
console.log("done");
