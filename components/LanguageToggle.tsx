"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";

/** 右上角的 EN / 中 切换按钮 */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const next = lang === "en" ? "zh" : "en";
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={t(lang, "language")}
      className={`flex h-11 items-center justify-center rounded-full bg-surface/95 px-4 text-[13px] font-bold tracking-wide text-ink shadow-[0_4px_14px_rgba(27,31,29,0.10)] ${className}`}
    >
      {lang === "en" ? "EN" : "中"}
    </button>
  );
}
