/**
 * OpenStreetMap 数据源，通过公共 Overpass API 查询。
 * 免费、无 Key，但公共实例有速率限制，所以：坐标取整以提高缓存命中，失败就返回空数组不影响其他来源。
 */
import { haversine } from "@/lib/geo";
import { USER_AGENT } from "@/lib/wikipedia";
import type { Place, PlaceCategory } from "@/lib/places/types";

const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://lz4.overpass-api.de/api/interpreter"];

export interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

async function overpass(query: string, revalidateSeconds: number, timeoutMs = 15_000): Promise<OsmElement[]> {
  let lastError: unknown = null;
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate: revalidateSeconds },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
      const data = await res.json();
      return data?.elements ?? [];
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Overpass failed");
}

/** OSM 标签 → 我们的分类 */
export function categoryFromTags(tags: Record<string, string>): PlaceCategory {
  const t = tags.tourism;
  if (t === "museum") return "museum";
  if (t === "gallery") return "gallery";
  if (t === "viewpoint") return "viewpoint";
  if (t === "artwork") return "artwork";
  if (t === "zoo" || t === "aquarium") return "zoo";
  if (t === "theme_park") return "theme_park";
  if (t === "attraction") return "attraction";
  const h = tags.historic;
  if (h === "monument") return "monument";
  if (h === "memorial") return "memorial";
  if (h) return "historic";
  if (tags.amenity === "place_of_worship") return "religious";
  if (tags.amenity === "theatre" || tags.amenity === "arts_centre") return "theatre";
  if (tags.leisure === "park" || tags.leisure === "garden") return "park";
  return "other";
}

/** 名字：优先当前语言的 name:xx，其次通用 name */
export function nameFromTags(tags: Record<string, string>, lang: string): string | undefined {
  return tags[`name:${lang}`] ?? tags.name ?? tags["name:en"];
}

export function elementCoords(el: OsmElement): { lat: number; lon: number } | null {
  if (typeof el.lat === "number" && typeof el.lon === "number") return { lat: el.lat, lon: el.lon };
  if (el.center) return { lat: el.center.lat, lon: el.center.lon };
  return null;
}

/**
 * OSM 元素 id 的短写法：n123 / w123 / r123。
 * 如果元素带 wikidata 标签，顺带拼在后面（n123~Q456），
 * 这样详情页在 Overpass 超时的时候还能退回 Wikidata 取数据。
 */
export function shortOsmId(el: OsmElement): string {
  const base = `${el.type[0]}${el.id}`;
  const qid = el.tags?.wikidata;
  return qid && /^Q\d+$/.test(qid) ? `${base}~${qid}` : base;
}

export function parseShortOsmId(short: string): { type: "node" | "way" | "relation"; id: number; wikidata?: string } | null {
  const m = /^([nwr])(\d+)(?:~(Q\d+))?$/.exec(short);
  if (!m) return null;
  const type = m[1] === "n" ? "node" : m[1] === "w" ? "way" : "relation";
  return { type, id: Number(m[2]), wikidata: m[3] };
}

/** 从 OSM 的 wikipedia 标签（形如 "fr:Tour Eiffel"）拆出语言和标题 */
export function parseWikipediaTag(tag: string | undefined): { lang: string; title: string } | undefined {
  if (!tag) return undefined;
  const m = /^([a-z-]+):(.+)$/.exec(tag);
  return m ? { lang: m[1], title: m[2] } : undefined;
}

/** 周边有名字的景点、博物馆、观景点、公共艺术、历史遗迹、宗教场所、剧院、带百科的公园 */
export async function overpassNearby(lat: number, lon: number, lang: string, radiusMeters: number, limit = 80): Promise<Place[]> {
  // 坐标取 3 位小数（约 100 米），让附近的请求共用缓存
  const qlat = lat.toFixed(3);
  const qlon = lon.toFixed(3);
  const around = `(around:${Math.round(radiusMeters)},${qlat},${qlon})`;
  const query = `[out:json][timeout:10];(
nwr${around}["name"]["tourism"~"^(attraction|museum|gallery|viewpoint|artwork|zoo|aquarium|theme_park)$"];
nwr${around}["name"]["historic"];
nwr${around}["name"]["amenity"~"^(place_of_worship|theatre|arts_centre)$"];
nwr${around}["name"]["leisure"~"^(park|garden)$"]["wikidata"];
);out center tags ${limit};`;

  // 公共实例忙的时候会 504，10 秒拿不到就放弃，让 Wikipedia 的结果先出来
  const elements = await overpass(query, 3600, 11_000);
  const places: Place[] = [];
  for (const el of elements) {
    const tags = el.tags ?? {};
    const title = nameFromTags(tags, lang);
    const coords = elementCoords(el);
    if (!title || !coords) continue;
    places.push({
      id: `osm:${shortOsmId(el)}`,
      source: "osm",
      title,
      lat: coords.lat,
      lon: coords.lon,
      dist: Math.round(haversine(lat, lon, coords.lat, coords.lon)),
      category: categoryFromTags(tags),
      wikidata: tags.wikidata,
      wikipedia: parseWikipediaTag(tags.wikipedia),
    });
  }
  return places;
}

/** 按 id 取单个 OSM 元素（详情页用） */
export async function overpassElement(short: string): Promise<OsmElement | null> {
  const parsed = parseShortOsmId(short);
  if (!parsed) return null;
  const elements = await overpass(`[out:json][timeout:8];${parsed.type}(${parsed.id});out center tags;`, 86400, 9_000);
  return elements[0] ?? null;
}
