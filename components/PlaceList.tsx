"use client";

import Link from "next/link";
import type { NearbyPlace } from "@/lib/wikipedia";
import type { Lang } from "@/lib/i18n";
import { formatDistance } from "@/lib/geo";
import { placeHref } from "@/lib/links";
import { PinIcon } from "@/components/Icons";

interface Props {
  places: NearbyPlace[];
  lang: Lang;
  selectedId: number | null;
  onSelect: (pageid: number) => void;
}

export function PlaceList({ places, lang, selectedId, onSelect }: Props) {
  return (
    <ul className="flex flex-col gap-1 px-3 pb-6">
      {places.map((p) => {
        const selected = p.pageid === selectedId;
        return (
          <li key={p.pageid}>
            <Link
              href={placeHref(lang, p.title)}
              onMouseEnter={() => onSelect(p.pageid)}
              onFocus={() => onSelect(p.pageid)}
              className={`flex items-center gap-3.5 rounded-[18px] px-2 py-2.5 transition-colors ${
                selected ? "bg-surface-2" : "hover:bg-surface-2/60"
              }`}
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-accent-soft/40">
                {p.thumbnail ? (
                  // Wikipedia 的缩略图尺寸不固定，用普通 img 最省事
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-accent">
                    <PinIcon size={22} />
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="truncate text-[16px] font-bold leading-5">{p.title}</div>
                {p.description && <div className="truncate text-[13px] text-muted">{p.description}</div>}
              </div>
              <div className="shrink-0 text-[13px] font-bold text-accent">{formatDistance(p.dist)}</div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
