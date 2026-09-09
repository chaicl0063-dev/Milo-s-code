import type { Lang } from "@/lib/i18n";

/** 地点详情页地址：/place/en/Eiffel_Tower */
export function placeHref(lang: Lang, title: string): string {
  return `/place/${lang}/${encodeURIComponent(title.trim().replace(/ /g, "_"))}`;
}

/** 首页地址，把坐标带在 URL 上，返回时列表还在，也方便分享 */
export function homeHref(lat: number, lon: number): string {
  return `/?lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}`;
}
