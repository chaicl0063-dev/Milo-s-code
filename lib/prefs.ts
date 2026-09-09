/**
 * 浏览器端的偏好设置，都存 localStorage。服务端渲染时拿不到，调用方要在 useEffect 里读。
 */
import { isLang, type Lang } from "@/lib/i18n";

export type GuideLangPref = "auto" | Lang;

const KEYS = {
  lang: "tourguide.lang",
  guideLang: "tourguide.guideLang",
  myLocation: "tourguide.myLocation",
  center: "tourguide.coords",
  installDismissed: "tourguide.installHintDismissed",
} as const;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* 隐私模式可能不可用 */
  }
}

export function getGuideLangPref(): GuideLangPref {
  const v = read(KEYS.guideLang);
  return isLang(v) ? v : "auto";
}

export function setGuideLangPref(v: GuideLangPref): void {
  write(KEYS.guideLang, v === "auto" ? null : v);
}

/** 讲解实际使用的语言：偏好里指定了就用它，否则跟界面 */
export function resolveGuideLang(uiLang: Lang): Lang {
  const pref = getGuideLangPref();
  return pref === "auto" ? uiLang : pref;
}

export function readCoords(key: "myLocation" | "center"): { lat: number; lon: number } | null {
  const raw = read(KEYS[key]);
  if (!raw) return null;
  try {
    const c = JSON.parse(raw) as { lat: number; lon: number };
    return Number.isFinite(c.lat) && Number.isFinite(c.lon) ? c : null;
  } catch {
    return null;
  }
}

export function writeCoords(key: "myLocation" | "center", c: { lat: number; lon: number }): void {
  write(KEYS[key], JSON.stringify(c));
}

/** 「清除缓存」：本地偏好、坐标记录，加上 Service Worker 的所有缓存 */
export async function clearAllLocalData(): Promise<void> {
  for (const k of Object.values(KEYS)) write(k, null);
  if (typeof caches !== "undefined") {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
}
