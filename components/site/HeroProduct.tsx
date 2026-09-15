"use client";

import { useState } from "react";
import { T } from "@/lib/site/theme";

/**
 * 首屏右侧：真机比例的设备框，里面是应用的真实截图（scripts/shoot-app.mjs 拍的，不是画的）。
 * 默认是「暂停态」的截图，四个胶囊切换看哪一屏；点「Try it live」把截图换成同源 iframe 里的真应用，可以点。
 * 规则见 DESIGN.md「Device frame」：先把静态截图做好，活的演示是加分项。
 */

type Screen = { id: string; label: string; caption: string; img: string; path: string };

const SCREENS: Screen[] = [
  { id: "home", label: "Around you", caption: "Places around you on the map, tap one to hear it.", img: "/images/app/app-home.webp", path: "/?focus=wp%3ATour_Saint-Jacques" },
  { id: "place", label: "Place", caption: "What it is, from Wikivoyage and Wikipedia, before the guide speaks.", img: "/images/app/app-place.webp", path: "/p/en/wp%3ATour_Saint-Jacques" },
  { id: "talk", label: "Listen", caption: "Mia tells the story sentence by sentence, and you can ask back.", img: "/images/app/app-talk.webp", path: "/p/en/wp%3ATour_Saint-Jacques/talk" },
  { id: "guide", label: "Guide", caption: "Three things to ask at any moment, plus an hour's walk.", img: "/images/app/app-guide.webp", path: "/guide" },
];

export function HeroProduct({ appUrl }: { appUrl: string }) {
  const [active, setActive] = useState<Screen>(SCREENS[1]);
  const [live, setLive] = useState(false);
  const base = appUrl.replace(/\/$/, "");
  const liveSrc = `${base}${active.path}`;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* 设备框：390/844 屏幕比例，墨色边框，长而软的投影 */}
      <div
        className="relative w-[272px] shrink-0 md:w-[320px]"
        style={{ aspectRatio: "410 / 864", borderRadius: 44, background: T.ink, padding: 10, boxShadow: "0 30px 60px -30px rgba(31,29,26,0.45)" }}
      >
        <div className="relative h-full w-full overflow-hidden bg-white" style={{ borderRadius: 34 }}>
          {live ? (
            <iframe
              key={liveSrc}
              src={liveSrc}
              title="ReAround You, live"
              className="h-full w-full border-0"
              allow="geolocation"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={active.img} src={active.img} alt={`ReAround You app: ${active.caption}`} width={390} height={844} className="h-full w-full object-cover object-top" fetchPriority="high" />
          )}
        </div>
        {!live && (
          <button
            type="button"
            onClick={() => setLive(true)}
            className="absolute bottom-6 left-1/2 flex h-10 -translate-x-1/2 items-center gap-2 rounded-full px-4 text-[13px] font-semibold text-white"
            style={{ background: "rgba(31,29,26,0.85)", backdropFilter: "blur(8px)" }}
          >
            <span className="inline-block h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-white" aria-hidden />
            Try it live
          </button>
        )}
        {live && (
          <button
            type="button"
            onClick={() => setLive(false)}
            className="absolute -right-2 -top-2 flex h-8 items-center rounded-full border bg-white px-3 text-[12px] font-semibold"
            style={{ borderColor: T.line, color: T.ink }}
          >
            Back to screens
          </button>
        )}
      </div>

      {/* 屏幕切换：胶囊，活动态用陶土色 */}
      <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="App screens">
        {SCREENS.map((s) => {
          const on = s.id === active.id;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(s)}
              className="h-9 rounded-full border px-4 text-[13px] font-semibold transition-colors"
              style={on ? { background: T.accent, borderColor: T.accent, color: "#fff" } : { background: "#fff", borderColor: T.line, color: T.ink }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <p className="max-w-[320px] text-center text-[13px] leading-5" style={{ color: T.muted }} aria-live="polite">
        {live ? "This is the real app running inside the frame. Tap around, it works." : active.caption}
      </p>
    </div>
  );
}
