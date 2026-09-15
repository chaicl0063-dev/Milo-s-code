"use client";

import { useState } from "react";
import { T } from "@/lib/site/theme";

/**
 * 首屏右侧的产品展示板（实施规格 §3 S01）：白底 1px 边的板子，里面是应用的真实截图摘录，
 * 不是手机外壳，也不是拼成一张「产品里不存在的屏幕」。
 * 默认「Around you」：左边是地图和圣雅克塔的地点卡（同一张真实截图裁下来），右边是 Mia 讲解页的顶部
 * （地点名、Mia、原生静音状态、完整首句）。两块用细线分开，注明是 sample。
 * 四个胶囊切换看别的真实视图；「Try it live」把摘录换成同源 iframe 里的真应用（真实视口，不裁切）。
 * 截图与裁切由 scripts/shoot-app.mjs 产出，规格记在 docs/IMAGE-MANIFEST.md。
 */

type Screen = { id: string; label: string; caption: string; img: string; path: string };

/** 首屏 Around 的真实入口带巴黎示例坐标（HomeScreen 已支持 lat/lon），明确是 Paris sample；主 CTA 不带这组坐标 */
const SCREENS: Screen[] = [
  { id: "home", label: "Around you", caption: "Places around you on the map. Tap one, and your guide starts talking.", img: "/images/app/app-home-focus.webp", path: "/?lat=48.8579&lon=2.3489&focus=wp%3ATour_Saint-Jacques" },
  { id: "place", label: "Place", caption: "What it is, from Wikivoyage and Wikipedia, before the guide speaks.", img: "/images/app/app-place.webp", path: "/p/en/wp%3ATour_Saint-Jacques" },
  { id: "talk", label: "Listen", caption: "Mia tells the story sentence by sentence, and you can ask back.", img: "/images/app/app-talk.webp", path: "/p/en/wp%3ATour_Saint-Jacques/talk" },
  { id: "guide", label: "Guide", caption: "Three things to ask at any moment, plus an hour's walk.", img: "/images/app/app-guide.webp", path: "/guide" },
];

/** 一块截图摘录：固定比例的框，图片顶对齐，多出的部分被框裁掉（只裁，不改） */
function Crop({ src, alt, ratio, priority = false, className = "", anchor = "top" }: { src: string; alt: string; ratio: string; priority?: boolean; className?: string; anchor?: "top" | "bottom" }) {
  return (
    <div className={`overflow-hidden rounded-[12px] border ${className}`} style={{ aspectRatio: ratio, borderColor: T.line, background: T.paper }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={780} height={1000} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} className={`h-full w-full object-cover ${anchor === "bottom" ? "object-bottom" : "object-top"}`} />
    </div>
  );
}

export function HeroProduct({ appUrl, onLive }: { appUrl: string; onLive?: () => void }) {
  const [active, setActive] = useState<Screen>(SCREENS[0]);
  const [live, setLive] = useState(false);
  const base = appUrl.replace(/\/$/, "");
  const liveSrc = `${base}${active.path}`;
  const pill = "h-10 rounded-full border px-4 text-[13px] font-semibold transition-colors";

  return (
    <div className="flex w-full flex-col gap-4">
      {/* 展示板 */}
      <div className="rounded-[20px] border p-3 md:p-4" style={{ borderColor: T.line, background: T.white, boxShadow: T.shadow }}>
        {live ? (
          <div className="flex justify-center">
            <iframe key={liveSrc} src={liveSrc} title="ReAround You, live" className="w-full max-w-[390px] border-0" style={{ height: 640, borderRadius: 12 }} allow="geolocation" />
          </div>
        ) : active.id === "home" ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {/* 地图 + 已选地点卡（同一张 HomeScreen 截图裁下） */}
            {/* 手机上容器更矮并贴底对齐：地点卡和 Ask the guide 完整，少露一点地图，好让地点名进第一屏 */}
            <Crop src={active.img} alt="ReAround You app: map of the Châtelet area in Paris with nearby places, Tour Saint-Jacques selected, and an Ask the guide button" ratio="780 / 760" anchor="bottom" priority className="md:[aspect-ratio:780/1000]" />
            {/* Mia 讲解页顶部：地点名、Mia、静音状态、首句 */}
            <Crop src="/images/app/app-talk-top.webp" alt="ReAround You app: Mia's story for Tour Saint-Jacques, sound off, first sentences visible" ratio="780 / 860" priority className="md:[aspect-ratio:780/1000]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <Crop src={active.img} alt={`ReAround You app: ${active.caption}`} ratio="780 / 860" className="md:[aspect-ratio:780/1000]" />
            <div className="flex flex-col justify-center gap-2 px-1 md:px-2">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: T.accent }}>
                {active.label}
              </p>
              <p className="text-[16px] leading-relaxed" style={{ color: T.ink }}>
                {active.caption}
              </p>
              <p className="text-[13px] leading-5" style={{ color: T.muted }}>
                Screenshot of the real app. Use Try it live below to tap around.
              </p>
            </div>
          </div>
        )}
        <p className="mt-3 text-[12px] leading-5" style={{ color: T.muted }}>
          {live ? "The real app, running in this frame. Tap around, it works." : "App views · Tour Saint-Jacques, Paris · sample · map © OpenStreetMap contributors"}
        </p>
      </div>

      {/* 板外：切换、live、进入试听 */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="App screens">
        {SCREENS.map((s) => {
          const on = s.id === active.id;
          return (
            <button key={s.id} type="button" role="tab" aria-selected={on} onClick={() => setActive(s)} className={pill} style={on ? { background: T.accent, borderColor: T.accent, color: "#fff" } : { background: T.white, borderColor: T.line, color: T.ink }}>
              {s.label}
            </button>
          );
        })}
        {live ? (
          <button type="button" onClick={() => setLive(false)} className={pill} style={{ background: T.white, borderColor: T.line, color: T.ink }}>
            Back to screens
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onLive?.();
              setLive(true);
            }}
            className={`${pill} inline-flex items-center gap-2`}
            style={{ background: T.ink, borderColor: T.ink, color: "#fff" }}
          >
            <span className="inline-block h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-white" aria-hidden />
            Try it live
          </button>
        )}
        <a href="#demo" className="ml-auto text-[14px] font-semibold underline-offset-2 hover:underline" style={{ color: T.accent }}>
          Hear the story →
        </a>
      </div>
      <p className="text-[13px] leading-5" style={{ color: T.muted }} aria-live="polite">
        {live ? "Real screen, real data. Back to screens returns to the sample views." : active.caption}
      </p>
    </div>
  );
}
