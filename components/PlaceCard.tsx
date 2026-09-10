"use client";

import Link from "next/link";
import type { Place } from "@/lib/places/types";
import { categoryLabel, t, type Lang } from "@/lib/i18n";
import { formatDistance } from "@/lib/geo";
import { placeHref, talkHref } from "@/lib/links";
import { favoriteFromPlace } from "@/lib/favorites";
import { FavoriteStar } from "@/components/FavoriteStar";
import { CloseIcon, PinIcon, SparkIcon } from "@/components/Icons";

/** 地图上点图钉后，底部弹出的卡片：大图、名字、一句描述、距离、收藏，直达讲解或查看详情 */
export function PlaceCard({ place, lang, onClose }: { place: Place; lang: Lang; onClose: () => void }) {
  const secondary = place.description ?? (place.category ? categoryLabel(lang, place.category) : "");
  return (
    <div className="overflow-hidden rounded-[22px] bg-surface shadow-[0_10px_30px_rgba(27,31,29,0.22)]">
      <div className="relative h-36 w-full bg-accent-soft/40">
        {place.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={place.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-accent">
            <PinIcon size={32} />
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={t(lang, "close")}
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface/95 text-ink shadow-[0_4px_14px_rgba(27,31,29,0.12)]"
        >
          <CloseIcon size={16} />
        </button>
        <FavoriteStar place={favoriteFromPlace(place, lang)} uiLang={lang} className="absolute right-3 top-3 h-9 w-9 bg-surface/95 shadow-[0_4px_14px_rgba(27,31,29,0.12)]" size={18} />
      </div>
      <div className="flex flex-col gap-3 px-4 pb-4 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-bold leading-6">{place.title}</h2>
            {secondary && <p className="truncate text-[13px] text-muted">{secondary}</p>}
          </div>
          <span className="shrink-0 pt-0.5 text-[13px] font-bold text-accent">{formatDistance(place.dist)}</span>
        </div>
        <div className="flex gap-2">
          <Link href={talkHref(lang, place.id)} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-[14px] font-bold text-bg">
            <SparkIcon size={16} />
            {t(lang, "askGuide")}
          </Link>
          <Link href={placeHref(lang, place.id)} className="flex h-11 items-center justify-center rounded-full border border-line px-5 text-[14px] font-semibold text-ink">
            {t(lang, "view")}
          </Link>
        </div>
      </div>
    </div>
  );
}
