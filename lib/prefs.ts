/**
 * 浏览器端的偏好设置，都存 localStorage。服务端渲染时拿不到，调用方要在 useEffect 里读。
 */
import { GUIDE_LANGS, isGuideLang, type GuideLang, type Lang } from "@/lib/i18n";
import { DEFAULT_PERSONA, isPersona, type PersonaId } from "@/lib/personas";

export type GuideLangPref = "auto" | GuideLang;
export type Audience = "adult" | "kids";

const KEYS = {
  lang: "tourguide.lang",
  guideLang: "tourguide.guideLang",
  myLocation: "tourguide.myLocation",
  center: "tourguide.coords",
  installDismissed: "tourguide.installHintDismissed",
  audience: "tourguide.audience",
  onboarded: "tourguide.onboarded",
  autoSpeak: "tourguide.autoSpeak",
  persona: "tourguide.persona",
} as const;

/** 选的导游人物（Mia / Milo） */
export function getPersona(): PersonaId {
  const v = read(KEYS.persona);
  return isPersona(v) ? v : DEFAULT_PERSONA;
}

export function setPersona(p: PersonaId): void {
  write(KEYS.persona, p);
}

export type VoiceEnginePref = "cloud" | "browser";

/** 朗读音色：cloud = 神经网络语音（联网，默认），browser = 手机自带 */
export function getVoiceEngine(): VoiceEnginePref {
  return read("tourguide.voiceEngine") === "browser" ? "browser" : "cloud";
}

export function setVoiceEngine(v: VoiceEnginePref): void {
  write("tourguide.voiceEngine", v === "cloud" ? null : v);
}

/** 自动朗读默认开；用户关过才为 false */
export function getAutoSpeak(): boolean {
  return read(KEYS.autoSpeak) !== "0";
}

export function setAutoSpeak(v: boolean): void {
  write(KEYS.autoSpeak, v ? null : "0");
}

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
  return isGuideLang(v) ? v : "auto";
}

/** 浏览器语言能对上讲解语言列表就用它，否则退回界面语言 */
export function browserGuideLang(uiLang: Lang): GuideLang {
  const code = (typeof navigator !== "undefined" ? navigator.language : "").toLowerCase().slice(0, 2);
  return (GUIDE_LANGS as readonly string[]).includes(code) ? (code as GuideLang) : uiLang;
}

export function getAudience(): Audience {
  return read(KEYS.audience) === "kids" ? "kids" : "adult";
}

export function setAudience(a: Audience): void {
  write(KEYS.audience, a);
}

/** 受众对应的讲解风格 */
export function audienceStyle(a: Audience): "guide" | "kids" {
  return a === "kids" ? "kids" : "guide";
}

export function isOnboarded(): boolean {
  return read(KEYS.onboarded) === "1";
}

export function setOnboarded(): void {
  write(KEYS.onboarded, "1");
}

export function setGuideLangPref(v: GuideLangPref): void {
  write(KEYS.guideLang, v === "auto" ? null : v);
}

/** 讲解实际使用的语言：偏好里指定了就用它，否则按浏览器语言，再退回界面语言 */
export function resolveGuideLang(uiLang: Lang): GuideLang {
  const pref = getGuideLangPref();
  return pref === "auto" ? browserGuideLang(uiLang) : pref;
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
