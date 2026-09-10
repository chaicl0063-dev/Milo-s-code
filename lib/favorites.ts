"use client";

/**
 * 收藏：存在 localStorage，纯本机，不需要账号。
 * 存的时候把渲染列表需要的字段一起存下来，这样「我的收藏」不联网也能显示。
 * 注意 Wikipedia 的 id 分语言（wp:Eiffel_Tower 和 wp:艾菲爾鐵塔 不是一个），所以要记下收藏时的语言。
 */
import { useCallback, useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import type { Place, PlaceCategory } from "@/lib/places/types";

export interface Favorite {
  id: string;
  lang: Lang;
  title: string;
  description?: string;
  thumbnail?: string;
  lat: number;
  lon: number;
  category?: PlaceCategory;
  savedAt: number;
}

const KEY = "tourguide.favorites";
const EVENT = "favorites:change";

export function listFavorites(): Favorite[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as Favorite[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function save(list: Favorite[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* 隐私模式可能不可用 */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function isFavorite(id: string): boolean {
  return listFavorites().some((f) => f.id === id);
}

/** 切换收藏状态，返回切换后是否已收藏 */
export function toggleFavorite(input: Omit<Favorite, "savedAt">): boolean {
  const list = listFavorites();
  const idx = list.findIndex((f) => f.id === input.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    save(list);
    return false;
  }
  save([{ ...input, savedAt: Date.now() }, ...list]);
  return true;
}

export function removeFavorite(id: string): void {
  save(listFavorites().filter((f) => f.id !== id));
}

/** 把列表里的 Place 变成收藏条目需要的输入 */
export function favoriteFromPlace(p: Place, lang: Lang): Omit<Favorite, "savedAt"> {
  return { id: p.id, lang, title: p.title, description: p.description, thumbnail: p.thumbnail, lat: p.lat, lon: p.lon, category: p.category };
}

/** 订阅收藏列表；任何地方切换收藏，所有用到这个 hook 的组件都会更新 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  useEffect(() => {
    const sync = () => setFavorites(listFavorites());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const has = useCallback((id: string) => favorites.some((f) => f.id === id), [favorites]);
  return { favorites, has, toggle: toggleFavorite, remove: removeFavorite };
}
