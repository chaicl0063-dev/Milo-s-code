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

/** 挂载期间：<html data-rr2-smooth>（原生平滑锚点）+ <html data-rr2-snap>（桌面原生分屏对齐）；?motion=0 两者都不加。记录实际滚动容器供验收 */
export function MotionRoot() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".rr2");
    const off = new URLSearchParams(window.location.search).get("motion") === "0";
    if (off && root) root.dataset.motion = "off";
    if (off) {
      (window as unknown as { __rr2ScrollingElement?: string }).__rr2ScrollingElement = document.scrollingElement?.tagName ?? "none";
      return () => {
        if (root) delete root.dataset.motion;
      };
    }
    document.documentElement.dataset.rr2Smooth = "";

    // 分屏对齐用原生 CSS scroll-snap（不吞滚轮、不逐格前进）。只有「每一屏都装得下当前视口」时才打开：
    // 手机、矮屏、文字放大或任何一屏被内容撑高时一律关闭，回到完整阅读的普通长页（需求 v2 §3.3）。
    const desktop = window.matchMedia("(min-width: 1024px) and (min-height: 640px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applySnap = () => {
      const screens = Array.from(document.querySelectorAll<HTMLElement>(".rr2 .v2-screen"));
      const fits = screens.length > 0 && screens.every((el) => el.getBoundingClientRect().height <= window.innerHeight + 2);
      if (desktop.matches && !reduce.matches && fits) document.documentElement.dataset.rr2Snap = "";
      else delete document.documentElement.dataset.rr2Snap;
    };
    applySnap();
    const onResize = () => applySnap();
    window.addEventListener("resize", onResize);
    desktop.addEventListener("change", onResize);
    reduce.addEventListener("change", onResize);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onResize);
    document.querySelectorAll<HTMLElement>(".rr2 .v2-screen").forEach((el) => ro?.observe(el));

    // 键盘/鼠标激活页内入口后，把程序化焦点给到目标屏，焦点不改变滚动位置（需求 v2 §5）
    const onAnchor = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.<HTMLAnchorElement>("a[href^='#']");
      const id = a?.getAttribute("href")?.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      window.setTimeout(() => {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }, 60);
    };
    document.addEventListener("click", onAnchor);

    (window as unknown as { __rr2ScrollingElement?: string }).__rr2ScrollingElement = document.scrollingElement?.tagName ?? "none";
    return () => {
      delete document.documentElement.dataset.rr2Smooth;
      delete document.documentElement.dataset.rr2Snap;
      window.removeEventListener("resize", onResize);
      desktop.removeEventListener("change", onResize);
      reduce.removeEventListener("change", onResize);
      ro?.disconnect();
      document.removeEventListener("click", onAnchor);
      if (root) delete root.dataset.motion;
    };
  }, []);
  return null;
}

/**
 * 首屏出口转场（需求 v2 §6）。只做一件事：用户从首屏主动向下滚动时，让一层「近白浅蓝底 + 一行字 + 静态箭头」
 * 淡入 180ms、短暂停留后淡出。它不控制滚动（到 Moment 的对齐交给原生 scroll-snap 与锚点），不占一屏，整次加载只播一次。
 * 不触发的情况：刷新后恢复到正文位置、带 hash 的深链接、点击任何页内锚点（含导航与 Scroll to explore）、
 * 手机/矮屏/减少动态效果/关闭动效/无 JS。用户向上滚或按 Escape 立即结束。
 */
export function HeroTransition() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const desktop = window.matchMedia("(min-width: 1024px) and (min-height: 640px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motionOff = document.querySelector(".rr2")?.getAttribute("data-motion") === "off";
    // 只在真正从页顶开始、没有深链接、桌面且允许动态时才有资格播放
    let done = !desktop.matches || reduce.matches || motionOff || window.location.hash !== "" || window.scrollY > 10;

    let timers: number[] = [];
    const clear = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers = [];
    };
    const end = () => {
      clear();
      host.dataset.state = "out";
      timers.push(window.setTimeout(() => host.removeAttribute("data-state"), 260));
    };
    const play = () => {
      if (done) return;
      done = true;
      host.dataset.state = "in";
      timers.push(window.setTimeout(end, 560));
    };
    // 点击任何页内锚点 = 主动定位，跳过提示（需求 v2 §6）
    const onAnchor = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href^='#']");
      if (a) {
        done = true;
        end();
      }
    };
    const onHash = () => {
      done = true;
      end();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") end();
    };
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const downward = y > last;
      last = y;
      if (done) return;
      if (!downward) return;
      // 首屏高度的一半之后、越过首屏底之前：交接过程
      const first = document.querySelector<HTMLElement>("#top");
      const exit = first ? first.offsetHeight * 0.45 : window.innerHeight * 0.45;
      if (y > exit) play();
    };
    const onMedia = () => {
      if (!desktop.matches || reduce.matches) {
        done = true;
        end();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onAnchor, true);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onMedia);
    reduce.addEventListener("change", onMedia);
    return () => {
      clear();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onAnchor, true);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onMedia);
      reduce.removeEventListener("change", onMedia);
    };
  }, []);

  return (
    <div ref={ref} className="v2-handoff" data-check="hero-handoff" aria-hidden>
      <p className="flex flex-col items-center gap-3 text-[20px] font-semibold tracking-[-0.01em] text-(--v2-ink2)">
        Discover a deeper layer
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-(--v2-accent)" aria-hidden>
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      </p>
    </div>
  );
}
