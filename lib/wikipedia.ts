/**
 * Wikipedia 数据层。
 * 两个公开接口，都不需要 API Key：
 *  - MediaWiki Action API  (https://{lang}.wikipedia.org/w/api.php)      → 按坐标搜周边、批量取缩略图
 *  - Wikimedia REST API    (https://{lang}.wikipedia.org/api/rest_v1/...) → 单个词条摘要
 * Wikipedia 要求所有请求带能识别应用的 User-Agent，否则可能被限流。
 */

const USER_AGENT =
  "TourGuideApp/0.1 (personal learning project; https://github.com/)";

/** 只允许形如 en / zh / pt-br 的语言代码，防止拼接出奇怪的域名 */
export function isValidLang(lang: string): boolean {
  return /^[a-z]{2,3}(-[a-z]{2,8})?$/.test(lang);
}

export interface NearbyPlace {
  pageid: number;
  title: string;
  lat: number;
  lon: number;
  /** 与查询中心的距离，单位米 */
  dist: number;
  /** 一句话描述，可能为空 */
  description?: string;
  /** 缩略图地址，可能为空 */
  thumbnail?: string;
}

export interface PlaceSummary {
  lang: string;
  title: string;
  description: string;
  extract: string;
  thumbnail?: { source: string; width: number; height: number };
  originalImage?: { source: string; width: number; height: number };
  /** 详情页头图：优先 Action API 选出的照片，其次 REST 的原图/缩略图 */
  image?: { source: string; width: number; height: number };
  coordinates?: { lat: number; lon: number };
  /** Wikipedia 桌面版页面链接 */
  url: string;
}

async function wikiFetch(url: string, revalidateSeconds: number): Promise<Response> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    // Next.js 的 fetch 缓存：同一 URL 在这段时间内复用结果，减少对 Wikipedia 的请求
    next: { revalidate: revalidateSeconds },
  });
  return res;
}

/** 第一步：按坐标找周边词条（只有标题和坐标，没有图片） */
export async function geosearch(
  lat: number,
  lon: number,
  lang = "en",
  radiusMeters = 1000,
  limit = 30,
): Promise<NearbyPlace[]> {
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
  const items: Array<{ pageid: number; title: string; lat: number; lon: number; dist: number }> =
    data?.query?.geosearch ?? [];
  return items.map((p) => ({
    pageid: p.pageid,
    title: p.title,
    lat: p.lat,
    lon: p.lon,
    dist: Math.round(p.dist),
  }));
}

/** 第二步：按 pageid 批量补缩略图和一句话描述（一次请求最多 50 个） */
export async function pageThumbnails(
  lang: string,
  pageids: number[],
  thumbSize = 240,
): Promise<Map<number, { thumbnail?: string; description?: string }>> {
  const result = new Map<number, { thumbnail?: string; description?: string }>();
  if (pageids.length === 0) return result;
  const params = new URLSearchParams({
    action: "query",
    prop: "pageimages|description",
    piprop: "thumbnail",
    pithumbsize: String(thumbSize),
    pageids: pageids.slice(0, 50).join("|"),
    format: "json",
    formatversion: "2",
  });
  const res = await wikiFetch(`https://${lang}.wikipedia.org/w/api.php?${params}`, 3600);
  if (!res.ok) return result; // 缩略图拿不到不算致命错误，列表照常返回
  const data = await res.json();
  const pages: Array<{ pageid: number; thumbnail?: { source: string }; description?: string }> =
    data?.query?.pages ?? [];
  for (const p of pages) {
    result.set(p.pageid, { thumbnail: p.thumbnail?.source, description: p.description });
  }
  return result;
}

/** 组合：周边词条 + 缩略图，按距离排序 */
export async function nearbyPlaces(
  lat: number,
  lon: number,
  lang = "en",
  radiusMeters = 1000,
  limit = 30,
): Promise<NearbyPlace[]> {
  const places = await geosearch(lat, lon, lang, radiusMeters, limit);
  const extras = await pageThumbnails(lang, places.map((p) => p.pageid));
  return places
    .map((p) => ({ ...p, ...extras.get(p.pageid) }))
    .sort((a, b) => a.dist - b.dist);
}

/**
 * 词条的头图（原图 + 指定宽度的缩略图）。
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
  const page = data?.query?.pages?.[0];
  return page?.thumbnail ?? null;
}

/** 单个词条摘要。词条不存在时返回 null。 */
export async function placeSummary(lang: string, title: string): Promise<PlaceSummary | null> {
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
    url: d.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${slug}`,
  };
}
