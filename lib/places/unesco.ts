/**
 * UNESCO 世界遗产名录（从 Wikidata 抓的静态表，见 scripts/fetch-unesco.mjs）。
 * 只在服务端用：约 8800 条，含系列遗产的组成部分（故宫是「明清皇宫」的一部分），各有坐标、中英文名、UNESCO 编号、图片。
 */
import raw from "@/lib/data/unesco.json";
import { haversine } from "@/lib/geo";
import { commonsThumb } from "@/lib/places/wikidata";
import type { Place } from "@/lib/places/types";

export interface UnescoSite {
  qid: string;
  en: string;
  zh: string | null;
  lat: number;
  lon: number;
  whs: string | null;
  image: string | null;
  /** 组成部分所属遗产的名字（本身就是遗产时没有） */
  pen?: string;
  pzh?: string;
}

const SITES = raw as UnescoSite[];
const BY_QID = new Map(SITES.map((s) => [s.qid, s]));

/** 官网页面按遗产编号；组成部分的编号形如 439-001，页面在 439 下 */
export function unescoUrl(site: UnescoSite): string {
  return site.whs ? `https://whc.unesco.org/en/list/${site.whs.split("-")[0]}/` : "https://whc.unesco.org/en/list/";
}

export function unescoName(site: UnescoSite, lang: string): string {
  return (lang === "zh" && site.zh) || site.en;
}

/** 世界遗产标签上显示的名字：组成部分显示所属遗产名（故宫 → 明清皇宫） */
export function unescoHeritageName(site: UnescoSite, lang: string): string {
  if (site.pen) return (lang === "zh" && site.pzh) || site.pen;
  return unescoName(site, lang);
}

/** 半径内的世界遗产，作为地点列出（source = unesco）。有 Wikidata 编号，会和 Wikipedia 的同一条自动合并。 */
export function unescoNearby(lat: number, lon: number, radiusMeters: number, lang: string): Place[] {
  const out: Place[] = [];
  for (const s of SITES) {
    if (Math.abs(s.lat - lat) > 0.2 || Math.abs(s.lon - lon) > 0.3) continue; // 粗筛，省得每条都算距离
    const dist = haversine(lat, lon, s.lat, s.lon);
    if (dist > radiusMeters) continue;
    out.push({
      id: `unesco:${s.qid}`,
      source: "unesco",
      title: unescoName(s, lang),
      lat: s.lat,
      lon: s.lon,
      dist: Math.round(dist),
      description: lang === "zh" ? "UNESCO 世界遗产" : "UNESCO World Heritage",
      thumbnail: s.image ? commonsThumb(s.image, 480) : undefined,
      category: "historic",
      wikidata: s.qid,
      unesco: s.whs ?? s.qid,
    });
  }
  return out;
}

export function unescoByQid(qid: string): UnescoSite | undefined {
  return BY_QID.get(qid);
}

/** 一个地点是否就是世界遗产：Wikidata 编号相同，或坐标在 250 米内 */
export function unescoMatch(opts: { wikidata?: string; lat?: number; lon?: number }): UnescoSite | undefined {
  if (opts.wikidata) {
    const hit = BY_QID.get(opts.wikidata);
    if (hit) return hit;
  }
  if (typeof opts.lat === "number" && typeof opts.lon === "number") {
    let best: UnescoSite | undefined;
    let bestDist = 250;
    for (const s of SITES) {
      if (Math.abs(s.lat - opts.lat) > 0.01 || Math.abs(s.lon - opts.lon) > 0.01) continue;
      const d = haversine(opts.lat, opts.lon, s.lat, s.lon);
      if (d < bestDist) {
        best = s;
        bestDist = d;
      }
    }
    return best;
  }
  return undefined;
}
