import type { ReactNode } from "react";

/**
 * 官网 V2 的小零件。全部是服务端可渲染的纯展示元素，没有状态。
 * 2026-09-16「样张复刻」起按 assets/reference/site-v4-sample-b-1455.png 重建：
 * 海军蓝文字、2px 圆头线性图标、胶囊按钮、16px 圆角白卡 + 柔和投影、白环蓝心图钉、粗波形。
 * 颜色一律走 .rr2 根节点上的 CSS 变量（lib/site-v2/theme.ts），这里不写十六进制。
 */

/** 段落编号标签（样张：「01/ THE MOMENT」——编号蓝色带下划线、斜杠、灰色宽字距标签）。传 "01 / The moment" 这种字符串会自动拆 */
export function Label({ children }: { children: ReactNode }) {
  const m = typeof children === "string" ? children.match(/^(\d+)\s*\/\s*(.*)$/) : null;
  if (m) {
    return (
      <p className="flex items-baseline gap-2 text-[13px] font-semibold uppercase tracking-[0.2em] text-(--v2-label)">
        <span className="text-(--v2-blue) underline decoration-(--v2-blue) decoration-[1.5px] underline-offset-[5px]">{m[1]}</span>
        <span className="-ml-1 text-(--v2-blue)">/</span>
        <span>{m[2]}</span>
      </p>
    );
  }
  return (
    <p className="flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.2em] text-(--v2-label)">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
        <path d="M2 1v9M2 10l4-4M2 10l5 1" />
      </svg>
      {children}
    </p>
  );
}

/** 系统元数据行：坐标、区域、状态。小号、等宽数字、松字距 */
export function Meta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[12px] font-medium tracking-[0.04em] text-(--v2-faint) tabular-nums ${className}`}>{children}</p>;
}

/** 段标题：不带字号的基础样式（各段按样张量出的字号自己给），以及默认字号版本。同一断点的两个 text-[…] 会按类名排序打架，所以不要在 h2 上再叠 lg:text-[…] */
export const h2Base = "font-bold leading-[1.08] tracking-[-0.02em] text-(--v2-ink) [text-wrap:balance]";
export const h2 = `${h2Base} text-[32px] md:text-[38px] lg:text-[42px]`;
export const lead = "text-[16px] leading-[1.6] text-(--v2-muted) md:text-[17px]";
export const container = "mx-auto w-full px-5 sm:w-[90%] sm:max-w-[1800px] sm:px-0";
/** 卡片：白底、细边、柔和投影、16px 圆角 */
export const card = "rounded-[16px] border border-(--v2-line) bg-(--v2-surface) shadow-(--v2-shadow-sm)";

/* ---------- 图标（2px 圆头线性，继承 currentColor） ---------- */
type IconProps = { size?: number; className?: string };
const svgProps = (size: number, className?: string) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className, "aria-hidden": true });

export const Icon = {
  Pin: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  ),
  Crosshair: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  ),
  Building: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <path d="M4 21V8l5-3v16M9 21V11l6-3v13M15 21V12l5 2v7M3 21h18" />
      <path d="M6.5 11h.01M6.5 14h.01M6.5 17h.01M12 13h.01M12 16h.01M18 17h.01" />
    </svg>
  ),
  Area: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <path d="M3 20V9l6-3 6 3 6-3v11l-6 3-6-3-6 3Z" />
      <path d="M9 6v11M15 9v11" />
    </svg>
  ),
  Layers: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" />
      <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
    </svg>
  ),
  Sound: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <path d="M4 9.5h3.5L13 5v14l-5.5-4.5H4z" />
      <path d="M16.5 9a4.5 4.5 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11" />
    </svg>
  ),
  Wave: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <path d="M4 11v2M8 8v8M12 5v14M16 8v8M20 11v2" />
    </svg>
  ),
  Clock: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  ),
  Walk: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <circle cx="13.5" cy="4" r="1.8" />
      <path d="m9.5 21 2.5-6 3 2.5V21M7 13l3-5 3.5 1.5 2.5 3.5M12 11l-2.5 4-3 1.5" />
    </svg>
  ),
  Route: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="5.5" r="2.5" />
      <path d="M7.5 17 12 12.5c1.5-1.5.8-3.8 3-5.5l1.5-1.2" />
    </svg>
  ),
  Book: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <path d="M3.5 5h6.5a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H3.5zM20.5 5H14a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6.5z" />
    </svg>
  ),
  Eye: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Chat: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <path d="M4 5h16v10.5h-9L6.5 20v-4.5H4z" />
    </svg>
  ),
  Send: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <path d="m3.5 11.5 17-8-4 17-4.5-6.5zM12 14l8.5-10.5" />
    </svg>
  ),
  /** 纸飞机（样张主按钮左侧） */
  Navigate: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)} fill="currentColor" stroke="none">
      <path d="M21 3 3.6 10.2c-.8.3-.8 1.5.1 1.8l6.6 2.2 2.2 6.6c.3.9 1.5.9 1.8.1L21.6 3.6A.5.5 0 0 0 21 3Z" />
    </svg>
  ),
  ArrowRight: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <path d="M4 12h16M13 5l7 7-7 7" />
    </svg>
  ),
  /** 圆圈里一个实心三角（样张次按钮） */
  PlayCircle: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <circle cx="12" cy="12" r="9.5" strokeWidth="1.6" />
      <path d="M10 8.2v7.6l6-3.8z" fill="currentColor" stroke="none" />
    </svg>
  ),
  Chevron: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  ),
  List: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </svg>
  ),
  Map: ({ size = 20, className }: IconProps) => (
    <svg {...svgProps(size, className)}>
      <path d="M3 20V6l6-2 6 2 6-2v14l-6 2-6-2-6 2Z" />
      <path d="M9 4v16M15 6v16" />
    </svg>
  ),
};

/** 系统信息小格：图标 + 值 + 说明（首屏一排四个）。白底、极淡边、蓝色线性图标 */
export function Tile({ icon, value, label, live = false }: { icon: ReactNode; value: ReactNode; label: string; live?: boolean }) {
  return (
    <div className="flex h-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-[12px] border border-(--v2-line) bg-(--v2-surface) px-3 py-3.5 text-center shadow-(--v2-shadow-sm)">
      <span className="shrink-0 text-(--v2-accent)">{icon}</span>
      <p className="text-[14px] font-semibold leading-[1.35] text-(--v2-ink2) tabular-nums lg:text-[15px]">{value}</p>
      <p className="flex items-center justify-center gap-1.5 text-[12px] leading-[1.35] text-(--v2-faint)">
        {live && <span className="h-2 w-2 shrink-0 rounded-full bg-[#22B35A]" aria-hidden />}
        {label}
      </p>
    </div>
  );
}

/** 当前位置：蓝点 + 白边 + 一圈淡蓝光晕 */
export function YouDot({ size = 14 }: { size?: number }) {
  return (
    <span className="relative grid place-items-center" style={{ width: size * 3, height: size * 3 }}>
      <span className="absolute inset-0 rounded-full bg-(--v2-accent) opacity-15" />
      <span className="absolute inset-[22%] rounded-full bg-(--v2-accent) opacity-15" />
      <span className="relative rounded-full border-[3px] border-white bg-(--v2-accent) shadow-[0_1px_4px_rgba(11,25,67,0.3)]" style={{ width: size, height: size }} />
    </span>
  );
}

/** 「Your location」蓝色气泡标签，挂在当前位置上方 */
export function YouCallout({ children = "Your location" }: { children?: ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap rounded-[8px] bg-(--v2-accent) px-2.5 py-1.5 text-[12px] font-semibold text-white shadow-(--v2-shadow-sm)">
      {children}
      <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-(--v2-accent)" aria-hidden />
    </span>
  );
}

/**
 * 图钉。样张里的地点图钉是白环 + 蓝心（selected），路线站点是蓝底白数字（带 n）。
 * 不带 n 且 selected=false 时是白底蓝环的普通节点。
 */
export function Pin({ n, selected = false, size = 28 }: { n?: number; selected?: boolean; size?: number }) {
  if (n != null) {
    return (
      <span className="grid place-items-center rounded-full border-[2.5px] border-white bg-(--v2-accent) text-[13px] font-bold text-white tabular-nums shadow-[0_2px_6px_rgba(11,25,67,0.25)]" style={{ width: size, height: size }}>
        {n}
      </span>
    );
  }
  return (
    <span className={`grid place-items-center rounded-full bg-white shadow-[0_2px_8px_rgba(11,25,67,0.25)] ${selected ? "" : "border-2 border-(--v2-accent)"}`} style={{ width: size, height: size }}>
      <span className="rounded-full bg-(--v2-accent)" style={{ width: size * 0.5, height: size * 0.5 }} />
    </span>
  );
}

/** 连线上的节点：小白圈蓝边 */
export function Node() {
  return <span className="block h-4 w-4 rounded-full border-[2.5px] border-(--v2-accent) bg-white shadow-[0_1px_3px_rgba(11,25,67,0.2)]" />;
}

/** 照片上的小地点标签：缩略图 + 名字 + 距离（样张里的 Acropolis 1.1 km 那种） */
export function PlaceTag({ name, dist, thumb }: { name: string; dist: string; thumb?: string }) {
  return (
    <span className="flex items-center gap-2.5 rounded-[12px] border border-white/60 bg-white/92 p-1.5 pr-3 shadow-(--v2-shadow-sm) backdrop-blur-[3px]">
      {thumb && <img src={thumb} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-[8px] object-cover" />}
      <span className="leading-tight">
        <span className="block whitespace-nowrap text-[13px] font-semibold text-(--v2-ink)">{name}</span>
        <span className="block whitespace-nowrap text-[12px] text-(--v2-muted) tabular-nums">{dist}</span>
      </span>
    </span>
  );
}

/** 播放/暂停按钮（静态外观，状态由 playing 决定图标）：实心蓝圆 + 白三角 */
export function PlayButton({ playing = false, size = 44, label }: { playing?: boolean; size?: number; label?: string }) {
  return (
    <span aria-label={label ?? (playing ? "Pause" : "Play")} role="img" className="grid shrink-0 place-items-center rounded-full bg-(--v2-accent) text-white shadow-[0_2px_8px_rgba(10,111,184,0.35)]" style={{ width: size, height: size }}>
      {playing ? (
        <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <rect x="3" y="2" width="3.5" height="12" rx="1" />
          <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
        </svg>
      ) : (
        <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 16 16" fill="currentColor" aria-hidden className="translate-x-[6%]">
          <path d="M4 2.5v11l9-5.5z" />
        </svg>
      )}
    </span>
  );
}

/**
 * 波形：样张里是粗一点、中间高两头低的蓝色柱；前 progress 比例用深蓝，其余淡蓝。
 * mode（M-B1–B3）：static = 原始柱高无动画；running = 各柱 scaleY 0.7–1 往复（第 i 柱单程 1100+(i mod 5)×100ms，相位 −(i mod 7)×100ms，alternate，ease-in-out）；
 * paused = 同一 animation 声明，只把 animation-play-state 置 paused 冻结当前帧。减少动态效果与 ?motion=0 由 .rr2 的样式强制 static。
 */
export type WaveMode = "static" | "running" | "paused";
const BARS = [4, 7, 12, 16, 10, 18, 14, 8, 13, 20, 15, 9, 17, 12, 7, 14, 19, 11, 6, 13, 16, 10, 14, 18, 12, 7, 11, 15, 9, 5, 10, 14, 17, 11, 6, 12, 8, 5, 7, 4];
const waveStyle = (i: number, mode: WaveMode) =>
  mode === "static" ? {} : { animation: `v2-wave ${1100 + (i % 5) * 100}ms ease-in-out ${-(i % 7) * 100}ms infinite alternate`, animationPlayState: mode === "paused" ? ("paused" as const) : ("running" as const) };
export function Waveform({ progress = 0, height = 22, className = "", mode = "static" }: { progress?: number; height?: number; className?: string; mode?: WaveMode }) {
  const cut = Math.round(BARS.length * progress);
  return (
    <span className={`flex items-center gap-[2.5px] ${className}`} style={{ height }} aria-hidden data-wave={mode}>
      {BARS.map((h, i) => (
        <span key={i} className={`v2-wave-bar w-[3px] shrink-0 origin-center rounded-full ${i < cut ? "bg-(--v2-wave)" : progress > 0 ? "bg-(--v2-wave-soft)" : "bg-(--v2-wave)"}`} style={{ height: `${Math.max(14, (h / 20) * 100)}%`, opacity: progress > 0 && i >= cut ? 1 : 0.55 + (h / 20) * 0.45, ...waveStyle(i, mode) }} />
      ))}
    </span>
  );
}

/** 五根柱的小波形图标（导游卡），同一套模式与参数 */
const WAVE_ICON = [8, 14, 22, 14, 8];
export function WaveBars({ mode = "static", className = "" }: { mode?: WaveMode; className?: string }) {
  return (
    <span className={`inline-flex h-[22px] items-center gap-[3px] ${className}`} aria-hidden data-wave={mode}>
      {WAVE_ICON.map((h, i) => (
        <span key={i} className="v2-wave-bar w-[3px] shrink-0 origin-center rounded-full bg-current" style={{ height: h, ...waveStyle(i, mode) }} />
      ))}
    </span>
  );
}

/** Mia 头像（应用里同一张肖像） */
export function Avatar({ src, name, size = 28 }: { src: string; name: string; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={name} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
}

/** 状态点 + 文字：Guide ready / Speaking */
export function Status({ children, live = false }: { children: ReactNode; live?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-(--v2-muted)">
      <span className={`h-2 w-2 rounded-full ${live ? "bg-(--v2-accent)" : "bg-[#22B35A]"}`} />
      {children}
    </span>
  );
}

/** 识别框：四个角的细括号 */
export function LockCorners({ className = "" }: { className?: string }) {
  const c = "absolute h-5 w-5 border-white md:h-6 md:w-6";
  return (
    <span className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      <span className={`${c} left-0 top-0 rounded-tl-[4px] border-l-[2.5px] border-t-[2.5px]`} />
      <span className={`${c} right-0 top-0 rounded-tr-[4px] border-r-[2.5px] border-t-[2.5px]`} />
      <span className={`${c} bottom-0 left-0 rounded-bl-[4px] border-b-[2.5px] border-l-[2.5px]`} />
      <span className={`${c} bottom-0 right-0 rounded-br-[4px] border-b-[2.5px] border-r-[2.5px]`} />
    </span>
  );
}

/** 地图 / 列表切换外观（静态） */
export function MapListToggle() {
  return (
    <span className={`${card} inline-flex items-center gap-1 p-1`}>
      <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-(--v2-accent) px-3.5 text-[13px] font-semibold text-white">
        <Icon.Map size={16} /> Map
      </span>
      <span className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold text-(--v2-muted)">
        <Icon.List size={16} /> List
      </span>
    </span>
  );
}

/**
 * 按钮样式：胶囊（M-U1）。颜色 150ms 过渡，hover 只在精细指针（fine: 变体）；按压时内部视觉容器 btnInner 缩到 98%，命中区不变；
 * 减少动态效果下无过渡、无缩放。用法：<a className={btnPrimary}><span className={btnInner}>…</span></a>
 */
const btnBase = "group/btn inline-flex touch-manipulation items-center justify-center rounded-full font-semibold transition-[color,background-color,border-color] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none";
export const btnPrimary = `${btnBase} h-14 bg-(--v2-accent) px-7 text-[16px] text-white shadow-[0_6px_18px_rgba(10,111,184,0.28)] fine:hover:bg-(--v2-accent-deep)`;
export const btnGhost = `${btnBase} h-14 border-[1.5px] border-(--v2-outline) bg-(--v2-surface) px-6 text-[16px] text-(--v2-ink) fine:hover:bg-(--v2-accent-soft)`;
export const btnSmall = `${btnBase} h-11 border-[1.5px] border-(--v2-outline) bg-(--v2-surface) px-5 text-[14px] text-(--v2-ink) fine:hover:bg-(--v2-accent-soft)`;
/** 按钮内部视觉容器：图标与文字一起缩放 */
export const btnInner = "v2-btn inline-flex items-center gap-2.5 transition-transform duration-150 ease-[cubic-bezier(0.2,0,0,1)] group-active/btn:scale-[0.98] motion-reduce:transition-none motion-reduce:group-active/btn:scale-100";
/** 图标按钮（播放圆、卡上箭头）的外层：只做按压缩放 */
export const btnIcon = "group/btn shrink-0 touch-manipulation rounded-full disabled:opacity-60";
/** 普通文字链接（M-U2）：只有颜色 / 下划线 / 焦点 */
export const linkText = "transition-colors duration-150 motion-reduce:transition-none fine:hover:text-(--v2-ink)";
