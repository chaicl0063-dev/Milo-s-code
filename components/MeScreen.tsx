"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";
import { useFavorites } from "@/lib/favorites";
import { useLanguage } from "@/components/LanguageProvider";
import { TabBar, TAB_BAR_HEIGHT } from "@/components/TabBar";
import { ChevronRightIcon, GearIcon, InfoIcon, StarIcon } from "@/components/Icons";

/** 「我的」汇总页：收藏、设置、关于 三个入口 */
export function MeScreen() {
  const { lang } = useLanguage();
  const { favorites } = useFavorites();

  const entries = [
    { href: "/me/favorites", label: t(lang, "favorites"), sub: t(lang, "favoritesCount", { n: favorites.length }), icon: <StarIcon size={22} /> },
    { href: "/me/settings", label: t(lang, "settings"), sub: `${t(lang, "uiLanguage")} · ${t(lang, "guideLanguage")} · ${t(lang, "installTitle")}`, icon: <GearIcon size={22} /> },
    { href: "/me/about", label: t(lang, "aboutTitle"), sub: t(lang, "dataSourcesTitle"), icon: <InfoIcon size={22} /> },
  ];

  return (
    <>
      <main
        className="mx-auto flex w-full max-w-[520px] flex-col gap-6 px-6 pt-14"
        style={{ paddingBottom: `calc(${TAB_BAR_HEIGHT + 24}px + env(safe-area-inset-bottom))` }}
      >
        <h1 className="font-serif text-[36px] leading-10">{t(lang, "meTitle")}</h1>
        <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
          {entries.map((e, i) => (
            <li key={e.href}>
              {i > 0 && <div className="mx-5 h-px bg-[#EDE8DE]" />}
              <Link href={e.href} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-2/60">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink">{e.icon}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[16px] font-semibold">{e.label}</span>
                  <span className="truncate text-[13px] text-muted">{e.sub}</span>
                </span>
                <ChevronRightIcon className="shrink-0 text-[#B0AA9E]" />
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <TabBar lang={lang} />
    </>
  );
}
