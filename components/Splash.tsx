"use client";

import { useEffect, useState } from "react";

const KEY = "tourguide.splashShown";
const MIN_MS = 1200;
const MAX_MS = 3000;

/**
 * 开屏：每次打开 App（同一个浏览器会话只一次）盖住首页 1.2 到 3 秒，
 * 数据到了就提前收起，给首屏加载一个过渡而不是白屏或骨架。
 */
export function Splash({ ready }: { ready: boolean }) {
  const [phase, setPhase] = useState<"hidden" | "show" | "fade">("hidden");
  const [startedAt, setStartedAt] = useState(0);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(KEY)) return;
      window.sessionStorage.setItem(KEY, "1");
    } catch {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase("show");
    setStartedAt(Date.now());
  }, []);

  useEffect(() => {
    if (phase !== "show") return;
    const elapsed = Date.now() - startedAt;
    const wait = ready ? Math.max(0, MIN_MS - elapsed) : Math.max(0, MAX_MS - elapsed);
    const timer = window.setTimeout(() => setPhase("fade"), wait);
    return () => window.clearTimeout(timer);
  }, [phase, ready, startedAt]);

  useEffect(() => {
    if (phase !== "fade") return;
    const timer = window.setTimeout(() => setPhase("hidden"), 350);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "hidden") return null;
  return (
    <div
      className={`fixed inset-0 z-[3000] flex flex-col items-center justify-center gap-5 bg-bg transition-opacity duration-300 ${phase === "fade" ? "opacity-0" : "opacity-100"}`}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" className="h-24 w-24 rounded-[26px] shadow-[0_10px_30px_rgba(27,31,29,0.18)]" />
      <div className="flex flex-col items-center gap-1">
        <div className="font-serif text-[32px] leading-9">ReAround You</div>
        <div className="text-[13px] text-muted">AI Tour Guide</div>
      </div>
    </div>
  );
}
