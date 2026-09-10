"use client";

import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { TabBar, TAB_BAR_HEIGHT } from "@/components/TabBar";
import { BackIcon } from "@/components/Icons";

/** 「我的」下面二级页的统一外壳：返回按钮 + 标题 + 底部 tab */
export function SubpageShell({ lang, title, children, fallbackHref = "/me" }: { lang: Lang; title: string; children: React.ReactNode; fallbackHref?: string }) {
  const router = useRouter();
  return (
    <>
      <main
        className="mx-auto flex w-full max-w-[520px] flex-col gap-6 px-6 pt-5"
        style={{ paddingBottom: `calc(${TAB_BAR_HEIGHT + 24}px + env(safe-area-inset-bottom))` }}
      >
        <header className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t(lang, "back")}
            onClick={() => (window.history.length > 1 ? router.back() : router.push(fallbackHref))}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink shadow-[0_4px_14px_rgba(27,31,29,0.10)]"
          >
            <BackIcon />
          </button>
          <h1 className="font-serif text-[30px] leading-9">{title}</h1>
        </header>
        {children}
      </main>
      <TabBar lang={lang} />
    </>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-[20px] bg-surface px-5 py-4">
      <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-faint">{title}</h2>
      {children}
    </section>
  );
}

export function Segmented({ options, value, onChange }: { options: Array<{ value: string; label: string }>; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`h-9 rounded-full px-4 text-[13px] font-semibold transition-colors ${
              active ? "bg-ink text-bg" : "border border-line bg-surface text-ink hover:bg-surface-2"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
