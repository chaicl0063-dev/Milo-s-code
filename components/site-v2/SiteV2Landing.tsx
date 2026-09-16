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
import { MotionRoot } from "@/components/site-v2/motion";

/**
 * 官网 V2（2026-09-16 结构轮，按 docs/SITE-V2-FINAL-VISUAL-RECOMMENDATION.md 第 4 节）：
 * Hero → 01 The Moment → 02 See & Hear（含追问）→ 03 Keep exploring → 04 Choose your guide → Start → Footer。
 * 原独立的 Ask 段并入 See & Hear，独立的 City break 大图取消。视觉目标 assets/reference/site-v4-sample-b-1455.png。
 * 客户端组件：Hero、SeeHear、Guides（真实试听，hook 内全站互斥）、PlusNotify（登记）、motion.tsx 的 Reveal / MotionRoot（动效清单 v2），其余服务端渲染。2026-09-16 样张复刻：视觉全部按样张量出重建。
 * 根节点 shrink-0：app/layout.tsx 的 body 是纵向 flex，不让这块被压成视口高而让 body 的旧站底色露出来（结构轮复核 C01）。颜色走 .rr2 上的 CSS 变量。
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
@media (prefers-reduced-motion:reduce){html[data-rr2-smooth]{scroll-behavior:auto}.rr2 [data-reveal]>*{opacity:1;transition:none}.rr2 .v2-wave-bar{animation:none!important}}`}</style>
      <MotionRoot />
      <Nav appUrl={appUrl} />
      <main>
        <Hero appUrl={appUrl} />
        <Moment />
        <SeeHear appUrl={appUrl} />
        <Explore appUrl={appUrl} />
        <Guides appUrl={appUrl} />
        <Start appUrl={appUrl} apkUrl={apkUrl} apkVersion={apkVersion} />
      </main>
      <Footer />
    </div>
  );
}
