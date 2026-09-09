/**
 * Wikidata 数据源。免费、无 Key。
 * 用途：给 OSM 的地点补描述和图片（OSM 很多点带 wikidata 编号），以及作为独立详情来源。
 */
import { wikiFetch } from "@/lib/wikipedia";

export interface WikidataEntity {
  id: string;
  label?: string;
  description?: string;
  /** Commons 文件名，例如 "Tour Eiffel Wikimedia Commons.jpg" */
  imageFile?: string;
  coordinates?: { lat: number; lon: number };
  website?: string;
  /** 当前语言（或英文）的 Wikipedia 词条 */
  sitelink?: { lang: string; title: string };
}

/** Commons 图片的缩略图地址，会 302 到真正的图片文件 */
export function commonsThumb(file: string, width: number): string {
  return `https://commons.wikimedia.org/w/index.php?title=Special:FilePath/${encodeURIComponent(file)}&width=${width}`;
}

type Claim = { mainsnak?: { datavalue?: { value?: unknown } } };

function firstClaim<T>(claims: Record<string, Claim[]> | undefined, prop: string): T | undefined {
  return claims?.[prop]?.[0]?.mainsnak?.datavalue?.value as T | undefined;
}

/** 批量取实体（一次最多 50 个），语言优先当前语言，退回英文 */
export async function wikidataEntities(ids: string[], lang: string): Promise<Map<string, WikidataEntity>> {
  const result = new Map<string, WikidataEntity>();
  const unique = [...new Set(ids.filter((id) => /^Q\d+$/.test(id)))];
  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50);
    const params = new URLSearchParams({
      action: "wbgetentities",
      ids: batch.join("|"),
      props: "labels|descriptions|claims|sitelinks",
      languages: lang === "en" ? "en" : `${lang}|en`,
      sitefilter: lang === "en" ? "enwiki" : `${lang}wiki|enwiki`,
      format: "json",
    });
    const res = await wikiFetch(`https://www.wikidata.org/w/api.php?${params}`, 86400);
    if (!res.ok) continue;
    const data = await res.json();
    const entities: Record<string, WikidataRaw> = data?.entities ?? {};
    for (const [id, e] of Object.entries(entities)) {
      if (!e || e.missing !== undefined) continue;
      const coord = firstClaim<{ latitude: number; longitude: number }>(e.claims, "P625");
      const site = e.sitelinks?.[`${lang}wiki`] ?? e.sitelinks?.enwiki;
      result.set(id, {
        id,
        label: e.labels?.[lang]?.value ?? e.labels?.en?.value,
        description: e.descriptions?.[lang]?.value ?? e.descriptions?.en?.value,
        imageFile: firstClaim<string>(e.claims, "P18"),
        coordinates: coord ? { lat: coord.latitude, lon: coord.longitude } : undefined,
        website: firstClaim<string>(e.claims, "P856"),
        sitelink: site ? { lang: site.site.replace(/wiki$/, ""), title: site.title } : undefined,
      });
    }
  }
  return result;
}

interface WikidataRaw {
  missing?: string;
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  claims?: Record<string, Claim[]>;
  sitelinks?: Record<string, { site: string; title: string }>;
}
