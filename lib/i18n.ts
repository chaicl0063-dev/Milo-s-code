/**
 * 界面文案。key 相同，两种语言各一份。
 * 用法：t(lang, "aroundYou") 或 t(lang, "placesWithin", { n: 30, r: "1 km" })
 */
export const LANGS = ["en", "zh"] as const;
export type Lang = (typeof LANGS)[number];

export function isLang(value: string | null | undefined): value is Lang {
  return value === "en" || value === "zh";
}

const en = {
  appName: "Around You",
  aroundYou: "Around you",
  placesWithin: "{n} places within {r}",
  noPlaces: "Nothing on Wikipedia within {r}. Try a wider radius.",
  loadingPlaces: "Looking around…",
  loadError: "Couldn't load nearby places.",
  retry: "Retry",
  locating: "Finding your location…",
  whereAreYou: "Where are you?",
  couldNotLocate: "We couldn't get your location. Pick a city to start exploring, or allow location access.",
  allowLocation: "Allow location",
  popularCities: "Popular cities",
  enterCoordinates: "Enter coordinates instead",
  coordsPlaceholder: "48.8584, 2.2945",
  coordsInvalid: "Please enter latitude and longitude like 48.8584, 2.2945",
  go: "Go",
  locateMe: "Use my location",
  changePlace: "Change place",
  radius: "Radius",
  back: "Back",
  readOnWikipedia: "Read on Wikipedia",
  coordinates: "Coordinates",
  notFoundTitle: "We don't know this place yet",
  notFoundBody: "There is no Wikipedia article for it in this language.",
  language: "Language",
  yourLocation: "You are here",
  view: "View",
} as const;

const zh: Record<keyof typeof en, string> = {
  appName: "身边",
  aroundYou: "你身边",
  placesWithin: "{r} 内有 {n} 个地点",
  noPlaces: "{r} 内没有维基百科条目，试试放大范围。",
  loadingPlaces: "正在环顾四周…",
  loadError: "周边地点加载失败。",
  retry: "重试",
  locating: "正在获取你的位置…",
  whereAreYou: "你在哪里？",
  couldNotLocate: "没能获取到你的位置。选一个城市开始探索，或者允许定位。",
  allowLocation: "允许定位",
  popularCities: "热门城市",
  enterCoordinates: "改为输入坐标",
  coordsPlaceholder: "48.8584, 2.2945",
  coordsInvalid: "请按「纬度, 经度」输入，例如 48.8584, 2.2945",
  go: "前往",
  locateMe: "用我的位置",
  changePlace: "换个地方",
  radius: "范围",
  back: "返回",
  readOnWikipedia: "在维基百科阅读",
  coordinates: "坐标",
  notFoundTitle: "还不认识这个地方",
  notFoundBody: "这个语言的维基百科里没有它的条目。",
  language: "语言",
  yourLocation: "你在这里",
  view: "查看",
};

export const dict = { en, zh } as const;
export type MessageKey = keyof typeof en;

export function t(lang: Lang, key: MessageKey, vars?: Record<string, string | number>): string {
  let text: string = dict[lang][key] ?? dict.en[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}
