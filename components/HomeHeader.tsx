"use client";

import type { PlaceCategory } from "@/lib/places/types";
import { categoryLabel, t, type Lang } from "@/lib/i18n";
import { formatDistance } from "@/lib/geo";
import { BackIcon, ListIcon, MapIcon, SearchIcon, StarIcon } from "@/components/Icons";

export type HomeFilter = "all" | "favorites" | PlaceCategory;
export type HomeView = "map" | "list";

interface Props {
  lang: Lang;
  placeName: string;
  showBack: boolean;
  onBack: () => void;
  onOpenSearch: () => void;
  view: HomeView;
  onView: (v: HomeView) => void;
  filter: HomeFilter;
  onFilter: (f: HomeFilter) => void;
  categories: PlaceCategory[];
  radius: number;
  radiusOptions: number[];
  onRadius: (r: number) => void;
  /** 地图视图时叠在地图上，列表视图时是普通块 */
  overlay: boolean;
}

/** 首页顶部：搜索栏（显示当前位置） · 地图/列表切换 · 范围 · 分类筛选 */
export function HomeHeader({ lang, placeName, showBack, onBack, onOpenSearch, view, onView, filter, onFilter, categories, radius, radiusOptions, onRadius, overlay }: Props) {
  const chips: Array<{ value: HomeFilter; label: string; icon?: React.ReactNode }> = [
    { value: "all", label: t(lang, "filterAll") },
    { value: "favorites", label: t(lang, "favorites"), icon: <StarIcon size={14} filled /> },
    ...categories.map((c) => ({ value: c as HomeFilter, label: categoryLabel(lang, c) })),
  ];
  const shadow = "shadow-[0_4px_14px_rgba(27,31,29,0.10)]";

  return (
    <div className={`${overlay ? "pointer-events-none absolute inset-x-0 top-0 z-[1000]" : "sticky top-0 z-10 bg-bg/95 backdrop-blur"} flex flex-col gap-2.5 px-4 pt-4 pb-2`}>
      <div className="flex items-center gap-2">
        {showBack && (
          <button type="button" onClick={onBack} aria-label={t(lang, "back")} className={`pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink ${shadow}`}>
            <BackIcon />
          </button>
        )}
        <button
          type="button"
          onClick={onOpenSearch}
          className={`pointer-events-auto flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full bg-surface pl-4 pr-4 text-left ${shadow}`}
        >
          <SearchIcon size={18} className="shrink-0 text-faint" />
          <span className="truncate text-[14px] font-semibold text-ink">{placeName}</span>
        </button>
        <div className={`pointer-events-auto flex h-11 shrink-0 items-center rounded-full bg-surface p-1 ${shadow}`} role="tablist">
          {(["list", "map"] as HomeView[]).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              aria-label={t(lang, v === "map" ? "viewMap" : "viewList")}
              onClick={() => onView(v)}
              className={`flex h-9 w-10 items-center justify-center rounded-full transition-colors ${view === v ? "bg-ink text-bg" : "text-ink"}`}
            >
              {v === "map" ? <MapIcon size={18} /> : <ListIcon size={18} />}
            </button>
          ))}
        </div>
      </div>

      <div className="pointer-events-auto -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <label className={`flex h-9 shrink-0 items-center rounded-full bg-surface px-3 text-[13px] font-semibold ${shadow}`}>
          <span className="sr-only">{t(lang, "radius")}</span>
          <select value={radius} onChange={(e) => onRadius(Number(e.target.value))} className="bg-transparent outline-none">
            {radiusOptions.map((r) => (
              <option key={r} value={r}>
                {formatDistance(r)}
              </option>
            ))}
          </select>
        </label>
        {chips.map((c) => {
          const active = c.value === filter;
          return (
            <button
              key={c.value}
              type="button"
              aria-pressed={active}
              onClick={() => onFilter(c.value)}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors ${shadow} ${
                active ? "bg-ink text-bg" : "bg-surface text-ink"
              }`}
            >
              {c.icon}
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
