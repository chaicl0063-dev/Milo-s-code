"use client";

import { useEffect } from "react";

/**
 * 注册 Service Worker（只在线上，开发时不注册，免得缓存干扰热更新）。
 * 「可以安装」事件的捕获放在 layout 的内联脚本里，因为它可能在 React 挂载前就触发。
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => console.warn("[pwa] register failed", err));
  }, []);
  return null;
}

/** Chrome / Edge / 安卓浏览器才有的事件，TypeScript 标准库里没有，这里补一个声明 */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __installPrompt?: BeforeInstallPromptEvent;
  }
}
