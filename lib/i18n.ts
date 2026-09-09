/**
 * 界面文案。key 相同，两种语言各一份。
 * 用法：t(lang, "aroundYou") 或 t(lang, "placesWithin", { n: 30, r: "1 km" })
 */
import type { PlaceCategory } from "@/lib/places/types";

export const LANGS = ["en", "zh"] as const;
export type Lang = (typeof LANGS)[number];

export function isLang(value: string | null | undefined): value is Lang {
  return value === "en" || value === "zh";
}

const en = {
  appName: "Around You",
  aroundYou: "Around you",
  placesWithin: "{n} places within {r}",
  noPlaces: "Nothing found within {r}. Try a wider radius.",
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
  viewOnOsm: "View on OpenStreetMap",
  viewOnAmap: "Open in Amap",
  viewOnWikidata: "View on Wikidata",
  coordinates: "Coordinates",
  address: "Address",
  openingHours: "Opening hours",
  phone: "Phone",
  website: "Website",
  noExtract: "No written introduction yet for this place.",
  notFoundTitle: "We don't know this place yet",
  notFoundBody: "None of our sources has an entry for it in this language.",
  language: "Language",
  yourLocation: "You are here",
  view: "View",
  askGuide: "Ask the guide",
  guideHint: "A short spoken-style introduction, in your language",
  guideThinking: "The guide is thinking…",
  guideError: "The guide is unavailable right now. Please try again.",
  guideBusy: "The guide is busy with other travelers. Try again in a moment.",
  guideDisclaimer: "AI-generated",
  askFollowUp: "Ask a follow-up…",
  send: "Send",
  styleHistory: "History",
  styleArchitecture: "Architecture",
  styleStories: "Stories",
  styleKids: "For kids",
} as const;

const zh: Record<keyof typeof en, string> = {
  appName: "身边",
  aroundYou: "你身边",
  placesWithin: "{r} 内有 {n} 个地点",
  noPlaces: "{r} 内没有找到地点，试试放大范围。",
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
  viewOnOsm: "在 OpenStreetMap 查看",
  viewOnAmap: "在高德地图打开",
  viewOnWikidata: "在 Wikidata 查看",
  coordinates: "坐标",
  address: "地址",
  openingHours: "开放时间",
  phone: "电话",
  website: "网站",
  noExtract: "这个地方还没有文字介绍。",
  notFoundTitle: "还不认识这个地方",
  notFoundBody: "所有数据源里都没有它这个语言的条目。",
  language: "语言",
  yourLocation: "你在这里",
  view: "查看",
  askGuide: "听导游讲讲",
  guideHint: "一段口语化的简短介绍，用你的语言",
  guideThinking: "导游在想…",
  guideError: "导游暂时不在，请稍后再试。",
  guideBusy: "导游正忙着接待别的游客，稍等一下再试。",
  guideDisclaimer: "AI 生成",
  askFollowUp: "继续问点什么…",
  send: "发送",
  styleHistory: "历史",
  styleArchitecture: "建筑",
  styleStories: "趣闻",
  styleKids: "讲给孩子",
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

const categories: Record<Lang, Record<PlaceCategory, string>> = {
  en: {
    attraction: "Attraction",
    museum: "Museum",
    gallery: "Gallery",
    viewpoint: "Viewpoint",
    artwork: "Public art",
    monument: "Monument",
    memorial: "Memorial",
    historic: "Historic site",
    religious: "Place of worship",
    park: "Park",
    zoo: "Zoo",
    theme_park: "Theme park",
    theatre: "Theatre",
    other: "Place",
  },
  zh: {
    attraction: "景点",
    museum: "博物馆",
    gallery: "美术馆",
    viewpoint: "观景点",
    artwork: "公共艺术",
    monument: "纪念建筑",
    memorial: "纪念碑",
    historic: "历史遗迹",
    religious: "宗教场所",
    park: "公园",
    zoo: "动物园",
    theme_park: "主题公园",
    theatre: "剧院",
    other: "地点",
  },
};

export function categoryLabel(lang: Lang, category: PlaceCategory): string {
  return categories[lang][category] ?? categories.en[category];
}
