"use client";

/**
 * 离线下载：把一个地点的资料、头图和一段讲解存进 IndexedDB，没网也能看。
 * 只在浏览器端使用。key 带语言，因为资料和讲解都是分语言的。
 */
import { useEffect, useState } from "react";
import type { GuideLang, Lang } from "@/lib/i18n";
import type { PlaceDetail } from "@/lib/places/types";
import type { Favorite } from "@/lib/favorites";

const DB_NAME = "rearound";
const STORE = "saved";
const EVENT = "saved:change";

export interface SavedPlace {
  key: string;
  id: string;
  lang: Lang;
  guideLang: GuideLang;
  place: PlaceDetail;
  narration: string;
  image?: Blob;
  savedAt: number;
}

export function savedKey(id: string, lang: Lang): string {
  return `${lang}:${id}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

function notify() {
  window.dispatchEvent(new Event(EVENT));
}

export async function getSaved(id: string, lang: Lang): Promise<SavedPlace | undefined> {
  return tx<SavedPlace | undefined>("readonly", (s) => s.get(savedKey(id, lang)) as IDBRequest<SavedPlace | undefined>);
}

export async function listSavedKeys(): Promise<string[]> {
  const keys = await tx<IDBValidKey[]>("readonly", (s) => s.getAllKeys());
  return keys.map(String);
}

export async function removeSaved(id: string, lang: Lang): Promise<void> {
  await tx("readwrite", (s) => s.delete(savedKey(id, lang)));
  notify();
}

/** 把讲解的文本流读完整 */
async function readAll(res: Response): Promise<string> {
  if (!res.ok || !res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }
  return text;
}

/**
 * 下载一个地点：资料 + 讲解 + 头图。讲解或头图拿不到不算失败，资料拿不到才算。
 */
export async function downloadPlace(fav: Favorite, guideLang: GuideLang, style: "guide" | "kids" = "guide", persona?: string): Promise<SavedPlace> {
  const placeRes = await fetch(`/api/place?lang=${fav.lang}&id=${encodeURIComponent(fav.id)}`);
  if (!placeRes.ok) throw new Error(`place HTTP ${placeRes.status}`);
  const place = (await placeRes.json()) as PlaceDetail;

  const [narration, image] = await Promise.all([
    fetch("/api/guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: fav.id, lang: guideLang, dataLang: fav.lang, style, persona }),
    })
      .then(readAll)
      .catch(() => ""),
    place.image?.source
      ? fetch(place.image.source, { mode: "cors" })
          .then((r) => (r.ok ? r.blob() : undefined))
          .catch(() => undefined)
      : Promise.resolve(undefined),
  ]);

  const saved: SavedPlace = {
    key: savedKey(fav.id, fav.lang),
    id: fav.id,
    lang: fav.lang,
    guideLang,
    place,
    narration,
    image,
    savedAt: Date.now(),
  };
  await tx("readwrite", (s) => s.put(saved));
  notify();
  return saved;
}

/** 订阅已下载的 key 集合 */
export function useSavedKeys(): Set<string> {
  const [keys, setKeys] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (typeof indexedDB === "undefined") return;
    const sync = () => listSavedKeys().then((k) => setKeys(new Set(k))).catch(() => {});
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return keys;
}

/** 当前是否在线，并跟随变化 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  return online;
}
