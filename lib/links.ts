import type { Lang } from "@/lib/i18n";

/** 地点详情页地址：/p/en/wp:Eiffel_Tower · /p/zh/osm:n123 */
export function placeHref(lang: Lang, id: string): string {
  return `/p/${lang}/${encodeURIComponent(id)}`;
}

/** 和导游对话的独立页面：/p/en/wp:Eiffel_Tower/talk */
export function talkHref(lang: Lang, id: string): string {
  return `${placeHref(lang, id)}/talk`;
}

/** 首页地址，把坐标带在 URL 上，返回时列表还在，也方便分享；focus 是要高亮的地点 id */
export function homeHref(lat: number, lon: number, focusId?: string): string {
  const base = `/?lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}`;
  return focusId ? `${base}&focus=${encodeURIComponent(focusId)}` : base;
}
