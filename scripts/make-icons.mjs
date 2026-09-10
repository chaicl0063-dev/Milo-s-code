/**
 * 用 sharp 把一个内联 SVG 渲染成 PWA 需要的各尺寸 PNG。
 * 运行：node scripts/make-icons.mjs
 * 改图标只改下面的 SVG 字符串，然后重跑。
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

// 深墨底 + 赭石图钉 + 米白耳机（导游在讲，你在听），和 App 的设计令牌一致
function iconSvg({ padding = 0, rounded = true }) {
  const size = 512;
  const inner = size - padding * 2;
  const r = rounded ? Math.round(inner * 0.22) : 0;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="${padding}" y="${padding}" width="${inner}" height="${inner}" rx="${r}" fill="#1B1F1D"/>
  <g transform="translate(${size / 2} ${size / 2 + 14}) scale(${(inner / 512) * 0.82})">
    <path d="M -152 -30 A 152 152 0 1 1 152 -30 C 152 56 44 108 14 176 Q 0 196 -14 176 C -44 108 -152 56 -152 -30 Z" fill="#B85C38"/>
    <path d="M -176 -30 A 176 176 0 0 1 176 -30" fill="none" stroke="#F4F1EA" stroke-width="30" stroke-linecap="round"/>
    <rect x="-206" y="-82" width="58" height="108" rx="29" fill="#F4F1EA"/>
    <rect x="148" y="-82" width="58" height="108" rx="29" fill="#F4F1EA"/>
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
