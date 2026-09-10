/**
 * 周边搜索的聚合层：并行查 Wikipedia、OpenStreetMap、（境内）高德，
 * 用 Wikidata 给 OSM 的点补描述和图片，再把三个来源里的同一个地点合并去重。
 * 任何一个来源挂了都不影响其他来源，只在 sources 里标记 error。
 */
import { haversine, isInChina } from "@/lib/geo";
import { wikipediaNearby } from "@/lib/wikipedia";
import { amapEnabled, amapNearby } from "@/lib/places/amap";
import { overpassNearby } from "@/lib/places/overpass";
import { commonsThumb, wikidataEntities } from "@/lib/places/wikidata";
import { unescoNearby } from "@/lib/places/unesco";
import type { Place, PlaceSource } from "@/lib/places/types";

export type SourceStatus = "ok" | "error" | "skipped";
export type SourceReport = Record<PlaceSource, SourceStatus>;

export interface NearbyResult {
  places: Place[];
  sources: SourceReport;
}

function settled(result: PromiseSettledResult<Place[]>, source: PlaceSource, report: SourceReport): Place[] {
  if (result.status === "fulfilled") {
    report[source] = "ok";
    return result.value;
  }
  report[source] = "error";
  console.warn(`[nearby] ${source} failed:`, result.reason instanceof Error ? result.reason.message : result.reason);
  return [];
}

/** 去掉重音、大小写、标点，只留字母数字，用来比对名字 */
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

/** 把 b 里 a 缺的字段补到 a 上 */
function mergeInto(a: Place, b: Place): void {
  a.description ??= b.description;
  a.thumbnail ??= b.thumbnail;
  a.category ??= b.category;
  a.wikidata ??= b.wikidata;
  a.wikipedia ??= b.wikipedia;
  a.unesco ??= b.unesco;
}

/**
 * 去重规则（按传入顺序决定优先保留谁）：
 *  1. Wikidata 编号相同 → 同一个地点
 *  2. 名字归一化后相同且距离 120 米内 → 同一个地点
 */
function dedupe(candidates: Place[]): Place[] {
  const kept: Place[] = [];
  const byWikidata = new Map<string, Place>();
  for (const c of candidates) {
    if (c.wikidata && byWikidata.has(c.wikidata)) {
      mergeInto(byWikidata.get(c.wikidata)!, c);
      continue;
    }
    const norm = normalizeName(c.title);
    const twin = norm
      ? kept.find((k) => normalizeName(k.title) === norm && haversine(k.lat, k.lon, c.lat, c.lon) < 120)
      : undefined;
    if (twin) {
      mergeInto(twin, c);
      if (c.wikidata) byWikidata.set(c.wikidata, twin);
      continue;
    }
    kept.push(c);
    if (c.wikidata) byWikidata.set(c.wikidata, c);
  }
  return kept;
}

export interface NearbyOptions {
  limit?: number;
  /** fast = 只查 Wikipedia（一两秒就回），给首屏先用；之后再来一次完整查询 */
  fast?: boolean;
}

export async function searchNearby(lat: number, lon: number, lang: string, radiusMeters: number, options: NearbyOptions = {}): Promise<NearbyResult> {
  const { limit = 60, fast = false } = options;
  const sources: SourceReport = { wikipedia: "skipped", osm: "skipped", wikidata: "skipped", amap: "skipped", unesco: "ok" };
  const useAmap = !fast && amapEnabled() && isInChina(lat, lon);

  const [wpResult, osmResult, amapResult] = await Promise.allSettled([
    wikipediaNearby(lat, lon, lang, radiusMeters),
    fast ? Promise.resolve<Place[]>([]) : overpassNearby(lat, lon, lang, radiusMeters),
    useAmap ? amapNearby(lat, lon, radiusMeters) : Promise.resolve<Place[]>([]),
  ]);
  const wikipedia = settled(wpResult, "wikipedia", sources);
  const osm = fast ? [] : settled(osmResult, "osm", sources);
  const amap = useAmap ? settled(amapResult, "amap", sources) : [];

  // 用 Wikidata 给缺描述或缺图的 OSM 地点补信息
  const qids = osm.filter((p) => p.wikidata && (!p.description || !p.thumbnail)).map((p) => p.wikidata!);
  if (qids.length > 0) {
    try {
      const entities = await wikidataEntities(qids, lang);
      for (const p of osm) {
        const e = p.wikidata ? entities.get(p.wikidata) : undefined;
        if (!e) continue;
        p.description ??= e.description;
        if (!p.thumbnail && e.imageFile) p.thumbnail = commonsThumb(e.imageFile, 480);
        p.wikipedia ??= e.sitelink;
      }
      sources.wikidata = "ok";
    } catch (err) {
      sources.wikidata = "error";
      console.warn("[nearby] wikidata enrichment failed:", err instanceof Error ? err.message : err);
    }
  }

  // 世界遗产：静态表，零成本；带 Wikidata 编号，和 Wikipedia 的同一条会合并并给它打上 unesco 标记
  const unesco = unescoNearby(lat, lon, radiusMeters, lang);

  // 优先级：Wikipedia（有正文）> UNESCO > 高德（境内更准）> OSM
  const places = dedupe([...wikipedia, ...unesco, ...amap, ...osm]).sort((a, b) => a.dist - b.dist).slice(0, limit);
  return { places, sources };
}
