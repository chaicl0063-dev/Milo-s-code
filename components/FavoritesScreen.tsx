"use client";

import Link from "next/link";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { categoryLabel } from "@/lib/i18n";
import { placeHref } from "@/lib/links";
import { useFavorites, type Favorite } from "@/lib/favorites";
import { downloadPlace, removeSaved, savedKey, useSavedKeys } from "@/lib/offline";
import { audienceStyle, getAudience, getPersona, resolveGuideLang } from "@/lib/prefs";
import { useLanguage } from "@/components/LanguageProvider";
import { SubpageShell } from "@/components/SubpageShell";
import { FavoriteStar } from "@/components/FavoriteStar";
import { CheckIcon, DownloadIcon, PinIcon } from "@/components/Icons";

/** 收藏列表：每行 缩略图 · 名字 · 星 · 下载。已下载的点进去是离线阅读页。 */
export function FavoritesScreen() {
  const { lang } = useLanguage();
  const { favorites } = useFavorites();
  const savedKeys = useSavedKeys();
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState<string | null>(null);

  async function toggleDownload(fav: Favorite) {
    const key = savedKey(fav.id, fav.lang);
    if (busy.has(key)) return;
    if (savedKeys.has(key)) {
      await removeSaved(fav.id, fav.lang);
      return;
    }
    setFailed(null);
    setBusy((s) => new Set(s).add(key));
    try {
      await downloadPlace(fav, resolveGuideLang(lang), audienceStyle(getAudience()), getPersona());
    } catch {
      setFailed(key);
    } finally {
      setBusy((s) => {
        const n = new Set(s);
        n.delete(key);
        return n;
      });
    }
  }

  return (
    <SubpageShell lang={lang} title={t(lang, "favorites")}>
      {favorites.length === 0 ? (
        <p className="rounded-[20px] bg-surface px-5 py-6 text-[14px] leading-6 text-muted">{t(lang, "noFavorites")}</p>
      ) : (
        <ul className="flex flex-col gap-1 rounded-[20px] bg-surface px-2 py-2">
          {favorites.map((f) => {
            const key = savedKey(f.id, f.lang);
            const saved = savedKeys.has(key);
            const loading = busy.has(key);
            const href = saved ? `/saved?id=${encodeURIComponent(f.id)}&lang=${f.lang}` : placeHref(f.lang, f.id);
            const secondary = f.description ?? (f.category ? categoryLabel(lang, f.category) : undefined);
            return (
              <li key={key} className="flex items-center gap-1 rounded-[16px] pl-1 pr-1 hover:bg-surface-2/60">
                <Link href={href} className="flex min-w-0 flex-1 items-center gap-3.5 py-2.5">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-accent-soft/40">
                    {f.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-accent">
                        <PinIcon size={22} />
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="truncate text-[16px] font-bold leading-5">{f.title}</div>
                    <div className="truncate text-[13px] text-muted">
                      {saved ? t(lang, "offlineCopy") : secondary}
                      {failed === key && <span className="text-accent"> · {t(lang, "downloadFailed")}</span>}
                    </div>
                  </div>
                </Link>
                <FavoriteStar place={f} uiLang={lang} />
                <button
                  type="button"
                  onClick={() => toggleDownload(f)}
                  disabled={loading}
                  aria-label={t(lang, saved ? "removeDownload" : "download")}
                  title={t(lang, saved ? "removeDownload" : "download")}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                    saved ? "text-accent" : "text-[#B0AA9E] hover:text-ink"
                  } disabled:opacity-60`}
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
                  ) : saved ? (
                    <CheckIcon size={20} />
                  ) : (
                    <DownloadIcon size={20} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </SubpageShell>
  );
}
