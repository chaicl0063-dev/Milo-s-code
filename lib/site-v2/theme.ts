/**
 * 官网 V2（/site-v2）的设计令牌，唯一来源。
 * 2026-09-16「样张复刻」起，全部色值从 assets/reference/site-v4-sample-b-1455.png 取样（scratchpad 脚本按区域取暗像素均值 / 众数）：
 *   标题 #0B1943、正文 #4F5F81、副标题蓝 #20619B、段落小标签 #6D87AC、辅助灰 #98AAC5、导航灰 #697999、
 *   页面底 #F9FCFE、卡内浅底 #F5F9FD、卡边 #E5EBEF、主按钮蓝 #006BB4、播放蓝 #0274BF、波形蓝 #3081D0、次按钮描边 #77B1E2、收尾横幅 #EDF7FE。
 * 文字是海军蓝系而不是中性黑；蓝有三档：按钮/播放（accent）、副标题/链接（blue）、小标签（label）。
 * 与 V1（lib/site/theme.ts）互不引用；V2 通过后再替换 V1。
 */
export const V2 = {
  bg: "#F9FCFE",
  surface: "#FFFFFF",
  surface2: "#F3F8FD",
  band: "#EDF7FE",
  ink: "#0B1943",
  ink2: "#1E2D5A",
  muted: "#4F5F81",
  faint: "#98AAC5",
  label: "#6D87AC",
  nav: "#697999",
  blue: "#20619B",
  line: "#E5EBEF",
  lineBlue: "#CFE0F3",
  outline: "#77B1E2",
  accent: "#0A6FB8",
  accentDeep: "#005C9E",
  accentSoft: "#EAF3FC",
  wave: "#3081D0",
  waveSoft: "#B9D5F0",
  shadow: "0 1px 2px rgba(11,25,67,0.04), 0 10px 30px rgba(11,25,67,0.10)",
  shadowSm: "0 1px 2px rgba(11,25,67,0.05), 0 4px 12px rgba(11,25,67,0.06)",
} as const;

/** 作为 CSS 变量挂在 .rr2 根节点上，组件用 Tailwind 的 bg-(--v2-…) 语法引用 */
export const V2_VARS: Record<string, string> = {
  "--v2-bg": V2.bg,
  "--v2-surface": V2.surface,
  "--v2-surface2": V2.surface2,
  "--v2-band": V2.band,
  "--v2-ink": V2.ink,
  "--v2-ink2": V2.ink2,
  "--v2-muted": V2.muted,
  "--v2-faint": V2.faint,
  "--v2-label": V2.label,
  "--v2-nav": V2.nav,
  "--v2-blue": V2.blue,
  "--v2-line": V2.line,
  "--v2-line-blue": V2.lineBlue,
  "--v2-outline": V2.outline,
  "--v2-accent": V2.accent,
  "--v2-accent-deep": V2.accentDeep,
  "--v2-accent-soft": V2.accentSoft,
  "--v2-wave": V2.wave,
  "--v2-wave-soft": V2.waveSoft,
  "--v2-shadow": V2.shadow,
  "--v2-shadow-sm": V2.shadowSm,
};
