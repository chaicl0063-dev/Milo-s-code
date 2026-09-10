"use client";

import Link from "next/link";
import type { Place } from "@/lib/places/types";
import { categoryLabel, type Lang } from "@/lib/i18n";
import { formatDistance } from "@/lib/geo";
import { placeHref } from "@/lib/links";
import { favoriteFromPlace } from "@/lib/favorites";
import { PinIcon } from "@/components/Icons";
import { FavoriteStar } from "@/components/FavoriteStar";

interface Props {
  places: Place[];
  lang: Lang;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** 每行：缩略图 · 名字 · 星 · 距离。图和名字是链接，星是独立按钮。 */
export function PlaceList({ places, lang, selectedId, onSelect }: Props) {
  return (
    <ul className="flex flex-col gap-1 px-3 pb-6">
      {places.map((p) => {
        const selected = p.id === selectedId;
        const secondary = p.description ?? (p.category ? categoryLabel(lang, p.category) : undefined);
        return (
          <li
            key={p.id}
            onMouseEnter={() => onSelect(p.id)}
            className={`flex items-center gap-1 rounded-[18px] pl-2 pr-3 transition-colors ${selected ? "bg-surface-2" : "hover:bg-surface-2/60"}`}
          >
            <Link href={placeHref(lang, p.id)} onFocus={() => onSelect(p.id)} className="flex min-w-0 flex-1 items-center gap-3.5 py-2.5">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-accent-soft/40">
                {p.thumbnail ? (
                  // 各数据源的缩略图尺寸不固定，用普通 img 最省事
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-accent">
                    <PinIcon size={22} />
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-[16px] font-bold leading-5">{p.title}</span>
                  {p.unesco && <span className="shrink-0 rounded-full bg-ink px-1.5 py-0.5 text-[9px] font-bold leading-none text-bg">UNESCO</span>}
                </div>
                {secondary && <div className="truncate text-[13px] text-muted">{secondary}</div>}
              </div>
            </Link>
            <FavoriteStar place={favoriteFromPlace(p, lang)} uiLang={lang} />
            <div className="w-12 shrink-0 text-right text-[13px] font-bold text-accent">{formatDistance(p.dist)}</div>
          </li>
        );
      })}
    </ul>
  );
}
