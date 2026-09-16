import type { CSSProperties } from "react";
import { V2_VARS } from "@/lib/site-v2/theme";
import { Nav } from "@/components/site-v2/Nav";
import { Hero } from "@/components/site-v2/Hero";
import { Moment } from "@/components/site-v2/Moment";
import { SeeHear } from "@/components/site-v2/SeeHear";
import { Explore } from "@/components/site-v2/Explore";
import { Guides } from "@/components/site-v2/Guides";
import { Start } from "@/components/site-v2/Start";
import { Footer } from "@/components/site-v2/Footer";
import { MotionRoot, HeroTransition } from "@/components/site-v2/motion";

/**
 * 官网 V2。屏序（docs/SITE-V2-HERO-TRANSITION-REQUIREMENTS-20260916.md v2 §3.3）：
 * 首屏（顶栏 + Hero，合计一屏）→ Moment → See & Hear → Explore → Guides → 收尾（Start + Plus + Footer 合为一屏）。
 * 桌面 ≥1024 且视口够高时每屏至少一个视口高、内容屏内垂直居中，并用原生 scroll-snap（proximity）在停滚后对齐屏起点；
 * 手机、矮屏、内容超过一屏、减少动态效果与无 JS 一律回到普通长页，不强制吸附、不裁切内容。
 * 全站统一内容舞台见 ui.tsx 的 container：视口宽 90%、上限 1800px、居中；手机固定左右 20px。
 * 客户端组件：Hero、SeeHear、Guides（真实试听，hook 内全站互斥）、PlusNotify、NavMenu，以及 motion.tsx 的 Reveal / MotionRoot / HeroTransition。
 * 根节点 shrink-0：app/layout.tsx 的 body 是纵向 flex，不让这块被压成视口高而让旧站底色露出来。颜色走 .rr2 上的 CSS 变量。
 */
export function SiteV2Landing({ appUrl, apkUrl, apkVersion, fontClass = "" }: { appUrl: string; apkUrl?: string; apkVersion?: string; fontClass?: string }) {
  return (
    <div className={`rr2 ${fontClass} min-h-dvh w-full shrink-0 overflow-x-clip bg-(--v2-bg) text-(--v2-ink) antialiased`} style={{ ...(V2_VARS as CSSProperties), fontFamily: "var(--font-inter), Inter, \"Segoe UI\", system-ui, sans-serif" }}>
      <style>{`.rr2 :focus-visible{outline:2px solid var(--v2-accent);outline-offset:3px}.rr2 section[id]{scroll-margin-top:24px}.rr2 img{max-width:none}
/* 动效（docs/SITE-V2-MOTION-EXECUTION-CHECKLIST-20260916.md v2）*/
html[data-rr2-smooth]{scroll-behavior:smooth}
@keyframes v2-wave{from{transform:scaleY(.7)}to{transform:scaleY(1)}}
.rr2 [data-reveal="pending"]>*{opacity:.8}
.rr2 [data-reveal="revealing"]>*{opacity:1;transition:opacity 300ms cubic-bezier(.2,0,0,1)}
.rr2 [data-reveal="done"]>*{opacity:1}
.rr2[data-motion="off"] [data-reveal]>*{opacity:1;transition:none}
.rr2[data-motion="off"] .v2-wave-bar{animation:none!important}
.rr2[data-motion="off"] .v2-btn,.rr2[data-motion="off"] a,.rr2[data-motion="off"] button{transition:none!important;transform:none!important}
/* 分屏（需求 v2 §3.3）：只在够宽够高的桌面生效；其余一律普通长页 */
@media (min-width:1024px) and (min-height:640px){
  .rr2 [id].v2-screen,.rr2 .v2-screen{min-height:100svh;scroll-snap-align:start;scroll-snap-stop:normal;scroll-margin-top:0}
  .rr2 .v2-screen--center{display:flex;flex-direction:column;justify-content:center}
  .rr2 .v2-screen--top{display:flex;flex-direction:column}
  html[data-rr2-snap]{scroll-snap-type:y mandatory}
}
/* 首屏出口转场（需求 v2 §6）：淡入 180ms 的轻提示，不占一屏、不控制滚动 */
.rr2 .v2-handoff{position:fixed;inset:0;z-index:40;display:grid;place-items:center;gap:0;background:var(--v2-band);opacity:0;pointer-events:none;transition:opacity 180ms cubic-bezier(.2,0,0,1)}
.rr2 .v2-handoff[data-state="in"]{opacity:.97}
.rr2 .v2-handoff[data-state="out"]{opacity:0;transition-duration:240ms}
@media (prefers-reduced-motion:reduce){html[data-rr2-smooth]{scroll-behavior:auto}.rr2 [data-reveal]>*{opacity:1;transition:none}.rr2 .v2-wave-bar{animation:none!important}html[data-rr2-snap]{scroll-snap-type:none}.rr2 .v2-handoff{display:none}}`}</style>
      <MotionRoot />
      <HeroTransition />
      <main>
        {/* 第一屏：顶栏 + Hero 合起来占一屏 */}
        <div id="top" className="v2-screen v2-screen--top">
          <Nav appUrl={appUrl} />
          <Hero appUrl={appUrl} />
        </div>
        <Moment />
        <SeeHear appUrl={appUrl} />
        <Explore appUrl={appUrl} />
        <Guides appUrl={appUrl} />
      </main>
      {/* 收尾屏：CTA + Plus + 页脚合为一屏，不把页脚单独拉成空白满屏 */}
      <div className="v2-screen v2-screen--center">
        <Start appUrl={appUrl} apkUrl={apkUrl} apkVersion={apkVersion} />
        <Footer />
      </div>
    </div>
  );
}
