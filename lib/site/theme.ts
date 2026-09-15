/**
 * 官网配色，唯一来源。冻结值来自 docs/REAROUND-YOU-IMPLEMENTATION-SPEC.md §2.1（GPT Work，2026-09-15）：
 * 冷浅灰底、白色展示面、近黑文字、冷灰次级文字、极淡蓝灰 1px 边线，唯一交互色青蓝 #167C80
 * （白字对比约 4.97:1）。旅行的暖度由照片承担，UI 本身不再带暖色。
 * 真实应用截图里的陶土色、地图、人物是「被展示的产品」，不是官网的第二套颜色，不换肤、不套滤镜。
 * 人物色（Mia 陶土、Milo 深青）只在应用内使用；官网上两位导游的交互统一用 accent。
 * 只改官网外壳：app/globals.css 的应用变量不动。
 */
export const T = {
  /** 官网主背景：冷浅灰 */
  bg: "#F7F8FA",
  /** 产品展示面、表单、选择面板 */
  white: "#FFFFFF",
  /** 次级面、轻分组 */
  paper: "#EEF2F6",
  /** 标题、正文、深色图标（不用纯黑） */
  ink: "#171717",
  /** 次级文字、说明（主底上约 5.45:1） */
  muted: "#5E6673",
  /** 1px 细边线 */
  line: "#DDE3EB",
  /** 唯一主交互色：主要 CTA、播放、选中、链接 */
  accent: "#167C80",
  /** 同色系 hover / active，不是第二强调色 */
  deep: "#116367",
  /** 当前句与选中项的浅底 */
  accentSoft: "#E7F3F3",
  /** 键盘 focus ring：2px + 3px offset */
  focus: "#167C80",
  /** 仅兼容小控件与照片字幕；不建立深色段落 */
  dark: "#171717",
  onDark: "#FFFFFF",
  /** 兼容别名：旧组件若仍引用，得到的也是 accent，不出现第二套高饱和色 */
  gold: "#167C80",
  teal: "#167C80",
  /** 唯一阴影值；普通内容默认无阴影 */
  shadow: "0 2px 8px rgba(23,23,23,0.04)",
} as const;

export type SiteTheme = typeof T;
