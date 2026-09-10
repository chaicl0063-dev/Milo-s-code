/**
 * Wikipedia 数据源。
 * 两个公开接口，都不需要 API Key：
 *  - MediaWiki Action API  (https://{lang}.wikipedia.org/w/api.php)      → 按坐标搜周边、批量取缩略图和 Wikidata 编号
 *  - Wikimedia REST API    (https://{lang}.wikipedia.org/api/rest_v1/...) → 单个词条摘要
 * Wikipedia 要求所有请求带能识别应用的 User-Agent，否则可能被限流。
 */
import type { Place } from "@/lib/places/types";

export const USER_AGENT = "ReAroundYou/0.3 (personal learning project; https://github.com/chaicl0063-dev/Milo-s-code)";

/** 只允许形如 en / zh / pt-br 的语言代码，防止拼接出奇怪的域名 */
export function isValidLang(lang: string): boolean {
  return /^[a-z]{2,3}(-[a-z]{2,8})?$/.test(lang);
}

export interface WikiSummary {
  lang: string;
  title: string;
  description: string;
  extract: string;
  thumbnail?: { source: string; width: number; height: number };
  originalImage?: { source: string; width: number; height: number };
  /** 详情页头图：优先 Action API 选出的照片，其次 REST 的原图/缩略图 */
  image?: { source: string; width: number; height: number };
  coordinates?: { lat: number; lon: number };
  wikidata?: string;
  /** Wikipedia 桌面版页面链接 */
  url: string;
}

export async function wikiFetch(url: string, revalidateSeconds: number): Promise<Response> {
  return fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    // Next.js 的 fetch 缓存：同一 URL 在这段时间内复用结果，减少对 Wikipedia 的请求
    next: { revalidate: revalidateSeconds },
    signal: AbortSignal.timeout(12_000),
  });
}

interface GeoHit {
  pageid: number;
  title: string;
  lat: number;
  lon: number;
  dist: number;
}

/** 第一步：按坐标找周边词条（只有标题和坐标，没有图片） */
async function geosearch(lat: number, lon: number, lang: string, radiusMeters: number, limit: number): Promise<GeoHit[]> {
  const params = new URLSearchParams({
    action: "query",
    list: "geosearch",
    gscoord: `${lat}|${lon}`,
    gsradius: String(radiusMeters),
    gslimit: String(limit),
    format: "json",
    formatversion: "2",
  });
  const res = await wikiFetch(`https://${lang}.wikipedia.org/w/api.php?${params}`, 300);
  if (!res.ok) throw new Error(`Wikipedia geosearch failed: HTTP ${res.status}`);
  const data = await res.json();
  return data?.query?.geosearch ?? [];
}

/** 第二步：按 pageid 批量补缩略图、一句话描述和 Wikidata 编号（一次最多 50 个） */
async function pageExtras(
  lang: string,
  pageids: number[],
  thumbSize = 240,
): Promise<Map<number, { thumbnail?: string; description?: string; wikidata?: string }>> {
  const result = new Map<number, { thumbnail?: string; description?: string; wikidata?: string }>();
  if (pageids.length === 0) return result;
  const params = new URLSearchParams({
    action: "query",
    prop: "pageimages|description|pageprops",
    piprop: "thumbnail",
    pithumbsize: String(thumbSize),
    ppprop: "wikibase_item",
    pageids: pageids.slice(0, 50).join("|"),
    format: "json",
    formatversion: "2",
  });
  const res = await wikiFetch(`https://${lang}.wikipedia.org/w/api.php?${params}`, 3600);
  if (!res.ok) return result; // 补充信息拿不到不算致命错误，列表照常返回
  const data = await res.json();
  const pages: Array<{
    pageid: number;
    thumbnail?: { source: string };
    description?: string;
    pageprops?: { wikibase_item?: string };
  }> = data?.query?.pages ?? [];
  for (const p of pages) {
    result.set(p.pageid, {
      thumbnail: p.thumbnail?.source,
      description: p.description,
      wikidata: p.pageprops?.wikibase_item,
    });
  }
  return result;
}

/** 组合：周边词条 + 补充信息，输出统一的 Place */
export async function wikipediaNearby(lat: number, lon: number, lang: string, radiusMeters: number, limit = 40): Promise<Place[]> {
  const hits = await geosearch(lat, lon, lang, radiusMeters, limit);
  const extras = await pageExtras(lang, hits.map((h) => h.pageid));
  return hits.map((h) => {
    const extra = extras.get(h.pageid) ?? {};
    return {
      id: `wp:${h.title.replace(/ /g, "_")}`,
      source: "wikipedia",
      title: h.title,
      lat: h.lat,
      lon: h.lon,
      dist: Math.round(h.dist),
      description: extra.description,
      thumbnail: extra.thumbnail,
      wikidata: extra.wikidata,
      wikipedia: { lang, title: h.title },
    };
  });
}

/**
 * 词条的头图。
 * 为什么不用 REST 摘要里自带的图：REST 用的「页面图片」偶尔是 LOGO（埃菲尔铁塔就是），
 * 而 Action API 默认只选自由版权图片，通常是信息框里的照片。拿不到时返回 null。
 */
export async function pageImage(
  lang: string,
  title: string,
  thumbWidth = 960,
): Promise<{ source: string; width: number; height: number } | null> {
  const params = new URLSearchParams({
    action: "query",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: String(thumbWidth),
    titles: title,
    redirects: "1",
    format: "json",
    formatversion: "2",
  });
  const res = await wikiFetch(`https://${lang}.wikipedia.org/w/api.php?${params}`, 3600);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.query?.pages?.[0]?.thumbnail ?? null;
}

/** 单个词条摘要。词条不存在时返回 null。 */
export async function placeSummary(lang: string, title: string): Promise<WikiSummary | null> {
  const slug = encodeURIComponent(title.trim().replace(/ /g, "_"));
  const [res, image] = await Promise.all([
    wikiFetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`, 3600),
    pageImage(lang, title).catch(() => null),
  ]);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Wikipedia summary failed: HTTP ${res.status}`);
  const d = await res.json();
  return {
    lang,
    title: d.title ?? title,
    description: d.description ?? "",
    extract: d.extract ?? "",
    thumbnail: d.thumbnail,
    originalImage: d.originalimage,
    image: image ?? d.originalimage ?? d.thumbnail,
    coordinates: d.coordinates,
    wikidata: d.wikibase_item,
    url: d.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${slug}`,
  };
}
