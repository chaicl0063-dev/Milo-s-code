"use client";

import { useFavorites, type Favorite } from "@/lib/favorites";
import { t, type Lang } from "@/lib/i18n";
import { StarIcon } from "@/components/Icons";

interface Props {
  place: Omit<Favorite, "savedAt">;
  uiLang: Lang;
  size?: number;
  className?: string;
}

/** 五角星：空心未收藏，实心已收藏。点击不冒泡，放在链接旁边也不会触发跳转。 */
export function FavoriteStar({ place, uiLang, size = 20, className = "" }: Props) {
  const { has, toggle } = useFavorites();
  const active = has(place.id);
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={t(uiLang, active ? "removeFavorite" : "addFavorite")}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(place);
      }}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
        active ? "text-accent" : "text-[#B0AA9E] hover:text-ink"
      } ${className}`}
    >
      <StarIcon size={size} filled={active} />
    </button>
  );
}
