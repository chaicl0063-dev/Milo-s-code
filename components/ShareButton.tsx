"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";
import { ShareIcon } from "@/components/Icons";

/** 分享当前页面：手机上调系统分享面板，不支持的浏览器就复制链接 */
export function ShareButton({ title, lang, className = "" }: { title: string; lang: Lang; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 用户取消分享 */
    }
  }
  return (
    <button
      type="button"
      onClick={share}
      aria-label={t(lang, "share")}
      title={copied ? t(lang, "linkCopied") : t(lang, "share")}
      className={`relative flex h-11 w-11 items-center justify-center rounded-full bg-surface/95 text-ink shadow-[0_4px_14px_rgba(27,31,29,0.12)] ${className}`}
    >
      <ShareIcon size={20} />
      {copied && (
        <span className="absolute right-0 top-12 whitespace-nowrap rounded-full bg-ink px-3 py-1 text-[12px] font-semibold text-bg">{t(lang, "linkCopied")}</span>
      )}
    </button>
  );
}
