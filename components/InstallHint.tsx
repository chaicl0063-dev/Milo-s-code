"use client";

import { useEffect, useState } from "react";
import { t, type Lang } from "@/lib/i18n";

const DISMISS_KEY = "tourguide.installHintDismissed";

/**
 * 首页底部面板顶部的一条安装引导：
 *  - 安卓 Chrome：显示「安装到桌面」按钮，点了弹系统安装框
 *  - iPhone Safari：系统不给按钮，只能提示「分享 → 添加到主屏幕」
 *  - 已经装好（standalone 打开）或用户点过「知道了」：不显示
 */
export function InstallHint({ lang }: { lang: Lang }) {
  const [mode, setMode] = useState<"hidden" | "button" | "ios">("hidden");

  useEffect(() => {
    try {
      if (window.localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignore */
    }
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isIos) setMode("ios");
    else if (window.__installPrompt) setMode("button");

    const onInstallable = () => setMode("button");
    const onInstalled = () => setMode("hidden");
    window.addEventListener("pwa:installable", onInstallable);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("pwa:installable", onInstallable);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setMode("hidden");
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    const prompt = window.__installPrompt;
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setMode("hidden");
    window.__installPrompt = undefined;
  }

  if (mode === "hidden") return null;

  return (
    <div className="mx-5 mt-3 flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-2.5 text-[13px]">
      <span className="min-w-0 flex-1 text-ink-soft">{mode === "ios" ? t(lang, "iosInstallTip") : t(lang, "installAppHint")}</span>
      {mode === "button" && (
        <button type="button" onClick={install} className="shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-[12px] font-bold text-bg">
          {t(lang, "installApp")}
        </button>
      )}
      <button type="button" onClick={dismiss} aria-label={t(lang, "dismiss")} className="shrink-0 text-[12px] font-semibold text-faint">
        {t(lang, "dismiss")}
      </button>
    </div>
  );
}
