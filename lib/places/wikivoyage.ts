/**
 * Wikivoyage 旅行指南：按坐标找最近的目的地条目（通常是城市或城区，如「巴黎/第七區」），取摘要。
 * 和 Wikipedia 同一套接口，免费无 Key。先试当前语言的站点，没有再退回英文站。
 */
import { wikiFetch } from "@/lib/wikipedia";

export interface TravelGuide {
  source: "wikivoyage";
  lang: string;
  title: string;
  extract: string;
  url: string;
  /** 与查询点的距离，米 */
  dist: number;
}

async function nearestArticle(lang: string, lat: number, lon: number): Promise<{ title: string; dist: number } | null> {
  const params = new URLSearchParams({
    action: "query",
    list: "geosearch",
    gscoord: `${lat}|${lon}`,
    gsradius: "10000",
    gslimit: "5",
    format: "json",
    formatversion: "2",
  });
  const res = await wikiFetch(`https://${lang}.wikivoyage.org/w/api.php?${params}`, 86400);
  if (!res.ok) return null;
  const data = await res.json();
  const hits: Array<{ title: string; dist: number }> = data?.query?.geosearch ?? [];
  // 优先「城市/城区」这类带斜杠的分区条目，其次最近的
  const district = hits.find((h) => h.title.includes("/"));
  return district ?? hits[0] ?? null;
}

export async function wikivoyageGuide(lat: number, lon: number, lang: string): Promise<TravelGuide | null> {
  const langs = lang === "en" ? ["en"] : [lang, "en"];
  for (const l of langs) {
    try {
      const hit = await nearestArticle(l, lat, lon);
      if (!hit) continue;
      const slug = encodeURIComponent(hit.title.replace(/ /g, "_"));
      const res = await wikiFetch(`https://${l}.wikivoyage.org/api/rest_v1/page/summary/${slug}`, 86400);
      if (!res.ok) continue;
      const d = await res.json();
      if (!d.extract) continue;
      return {
        source: "wikivoyage",
        lang: l,
        title: d.title ?? hit.title,
        extract: d.extract,
        url: d.content_urls?.desktop?.page ?? `https://${l}.wikivoyage.org/wiki/${slug}`,
        dist: Math.round(hit.dist),
      };
    } catch {
      /* 试下一个语言 */
    }
  }
  return null;
}
