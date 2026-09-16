"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type { SpeechStatus } from "@/components/site/useScriptedSpeech";

/**
 * 官网 V2 的动效辅助（docs/SITE-V2-MOTION-EXECUTION-CHECKLIST-20260916.md v2）。
 * 三件事、三种生命周期：
 *  - Reveal：桌面展示组的一次性轻显现（M-D2–D4）。服务端与默认状态没有属性 = 完全可见；只有挂载时整组还在视口下方才 pending（0.8），
 *    首次可见 ≥30% 走 revealing（300ms 到 1）再 done；被快速滚过、锚点跳过或到达、组内获焦、断点变手机、开启减少动态、观察器不可用 → 直接 done。
 *    状态直接写在包裹层的 data-reveal 属性上（不经 React state，避免挂载时的同步 setState 与多余渲染）。
 *  - useVisualActive：波形的「视觉是否该跑」：组件在视口内且页面可见。只影响装饰动画，不碰音频。
 *  - MotionRoot：挂载期间给 <html> 加 data-rr2-smooth（原生平滑锚点，M-N1），并支持 ?motion=0 关闭本轮全部动效作对比基线。
 */

export type WaveMode = "static" | "running" | "paused";

/** 真实播放状态 + 视觉可见性 → 波形视觉模式（M-B1–B3） */
export function waveMode(status: SpeechStatus, mine: boolean, visuallyActive: boolean): WaveMode {
  if (!mine) return "static";
  if (status === "playing") return visuallyActive ? "running" : "paused";
  if (status === "paused") return "paused";
  return "static";
}

/** 组件在视口内且页面可见。独立、持续工作的观察器（阈值 0），不与显现的观察器复用 */
export function useVisualActive<T extends HTMLElement>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(() => (typeof document === "undefined" ? true : document.visibilityState === "visible"));
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const on = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  return [ref, inView && pageVisible];
}

/**
 * 显现组。渲染成 display: contents 的包裹层，状态写在包裹层的 data-reveal 上，样式作用于直接子元素（网格列不受影响）。
 * 位置与可见性都按子元素的实际盒子测量。
 */
export function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const set = (state: "pending" | "revealing" | "done") => {
      host.dataset.reveal = state;
    };
    const kids = Array.from(host.children).filter((k): k is HTMLElement => k instanceof HTMLElement);
    if (kids.length === 0) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motionOff = document.querySelector(".rr2")?.getAttribute("data-motion") === "off";
    if (!desktop.matches || reduce.matches || motionOff || typeof IntersectionObserver === "undefined") {
      set("done");
      return;
    }
    const box = () => {
      const rs = kids.map((k) => k.getBoundingClientRect());
      return { top: Math.min(...rs.map((r) => r.top)), bottom: Math.max(...rs.map((r) => r.bottom)) };
    };
    // 挂载时已可见或已滚过：直接 done，不变暗
    if (box().top < window.innerHeight) {
      set("done");
      return;
    }
    set("pending");

    let finished = false;
    let timer: number | undefined;
    let cleanup: () => void = () => {};
    const finish = (animate: boolean) => {
      if (finished) return;
      finished = true;
      cleanup();
      if (animate) {
        set("revealing");
        timer = window.setTimeout(() => set("done"), 340);
      } else {
        set("done");
      }
    };
    const io = new IntersectionObserver(
      (entries) => {
        const ratio = Math.max(...entries.map((e) => e.intersectionRatio));
        const passed = entries.every((e) => !e.isIntersecting && e.boundingClientRect.bottom < 0);
        if (ratio >= 0.3) finish(true);
        else if (passed) finish(false);
      },
      { threshold: [0, 0.3] },
    );
    kids.forEach((k) => io.observe(k));
    const onHash = () => {
      const b = box();
      if (b.bottom < 0 || b.top < window.innerHeight) finish(false);
    };
    const onFocus = () => finish(false);
    const onMedia = () => {
      if (!desktop.matches || reduce.matches) finish(false);
    };
    window.addEventListener("hashchange", onHash);
    host.addEventListener("focusin", onFocus);
    desktop.addEventListener("change", onMedia);
    reduce.addEventListener("change", onMedia);
    cleanup = () => {
      io.disconnect();
      window.removeEventListener("hashchange", onHash);
      host.removeEventListener("focusin", onFocus);
      desktop.removeEventListener("change", onMedia);
      reduce.removeEventListener("change", onMedia);
    };
    return () => {
      cleanup();
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  );
}

/** 挂载期间：<html data-rr2-smooth>（原生平滑锚点）；?motion=0 → .rr2[data-motion="off"]（关闭本轮动效的对比基线）。记录实际滚动容器供验收 */
export function MotionRoot() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".rr2");
    const off = new URLSearchParams(window.location.search).get("motion") === "0";
    if (off && root) root.dataset.motion = "off";
    if (!off) document.documentElement.dataset.rr2Smooth = "";
    (window as unknown as { __rr2ScrollingElement?: string }).__rr2ScrollingElement = document.scrollingElement?.tagName ?? "none";
    return () => {
      delete document.documentElement.dataset.rr2Smooth;
      if (root) delete root.dataset.motion;
    };
  }, []);
  return null;
}
