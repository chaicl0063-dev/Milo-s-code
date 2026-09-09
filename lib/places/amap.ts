/**
 * 高德地图数据源（仅中国境内）。
 * 用的是「Web 服务 API」（服务端调用，不需要 JS API 的安全密钥）。
 * 需要在环境变量里配 AMAP_KEY；没配就整个跳过，App 其他功能不受影响。
 * 注意：高德坐标是 GCJ-02，进出都要和 WGS-84 互转。
 * 文档：https://lbs.amap.com/api/webservice/guide/api/search
 */
import { gcj02ToWgs84, haversine, wgs84ToGcj02 } from "@/lib/geo";
import type { Place, PlaceCategory, PlaceDetail } from "@/lib/places/types";

const BASE = "https://restapi.amap.com/v3/place";
/** 风景名胜 | 博物馆 | 展览馆 | 美术馆 */
const TYPES = "110000|140100|140200|140300";

export function amapEnabled(): boolean {
  return Boolean(process.env.AMAP_KEY);
}

interface AmapPoi {
  id: string;
  name: string;
  type?: string;
  typecode?: string;
  location?: string; // "lon,lat"
  address?: string | string[];
  tel?: string | string[];
  distance?: string;
  website?: string | string[];
  photos?: Array<{ url?: string | string[]; title?: string | string[] }>;
  biz_ext?: { open_time?: string | string[]; opentime2?: string | string[]; rating?: string | string[] };
}

/** 高德的空字段经常是 [] 而不是 ""，统一成字符串 */
function str(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v.length ? String(v[0]) : undefined;
  return v ? String(v) : undefined;
}

function categoryFromTypecode(typecode: string | undefined): PlaceCategory {
  const code = typecode?.split("|")[0] ?? "";
  if (code.startsWith("1401")) return "museum";
  if (code.startsWith("1402")) return "attraction";
  if (code.startsWith("1403")) return "gallery";
  if (code.startsWith("1101")) return "park";
  if (code.startsWith("1102")) return "historic";
  if (code.startsWith("1103")) return "religious";
  if (code.startsWith("1100")) return "attraction";
  return "other";
}

function parseLocation(location: string | undefined): { lat: number; lon: number } | null {
  if (!location) return null;
  const [lon, lat] = location.split(",").map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return gcj02ToWgs84(lat, lon);
}

async function amapFetch(path: string, params: Record<string, string>, revalidateSeconds: number): Promise<AmapPoi[]> {
  const key = process.env.AMAP_KEY;
  if (!key) return [];
  const search = new URLSearchParams({ key, output: "json", ...params });
  const res = await fetch(`${BASE}/${path}?${search}`, {
    next: { revalidate: revalidateSeconds },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Amap HTTP ${res.status}`);
  const data = await res.json();
  if (data?.status !== "1") throw new Error(`Amap error: ${data?.info ?? "unknown"}`);
  return data?.pois ?? [];
}

/** 周边搜索。输入 WGS-84 坐标，输出也是 WGS-84。 */
export async function amapNearby(lat: number, lon: number, radiusMeters: number): Promise<Place[]> {
  const gcj = wgs84ToGcj02(lat, lon);
  const pois = await amapFetch(
    "around",
    {
      location: `${gcj.lon.toFixed(6)},${gcj.lat.toFixed(6)}`,
      radius: String(Math.round(radiusMeters)),
      types: TYPES,
      offset: "25",
      page: "1",
      extensions: "all",
    },
    3600,
  );
  const places: Place[] = [];
  for (const poi of pois) {
    const coords = parseLocation(poi.location);
    if (!coords || !poi.name) continue;
    const typeLabel = str(poi.type)?.split(";").pop();
    places.push({
      id: `amap:${poi.id}`,
      source: "amap",
      title: poi.name,
      lat: coords.lat,
      lon: coords.lon,
      dist: Math.round(Number(poi.distance) || haversine(lat, lon, coords.lat, coords.lon)),
      description: typeLabel,
      thumbnail: str(poi.photos?.[0]?.url),
      category: categoryFromTypecode(str(poi.typecode)),
    });
  }
  return places;
}

/** POI 详情 */
export async function amapDetail(id: string): Promise<PlaceDetail | null> {
  const pois = await amapFetch("detail", { id, extensions: "all" }, 86400);
  const poi = pois[0];
  if (!poi) return null;
  const coords = parseLocation(poi.location);
  const photo = str(poi.photos?.[0]?.url);
  return {
    id: `amap:${poi.id}`,
    source: "amap",
    title: poi.name,
    description: str(poi.type)?.split(";").pop() ?? "",
    extract: "",
    image: photo ? { source: photo } : undefined,
    coordinates: coords ?? undefined,
    category: categoryFromTypecode(str(poi.typecode)),
    address: str(poi.address),
    phone: str(poi.tel),
    openingHours: str(poi.biz_ext?.opentime2) ?? str(poi.biz_ext?.open_time),
    website: str(poi.website),
    links: { amap: `https://uri.amap.com/marker?position=${poi.location}&name=${encodeURIComponent(poi.name)}` },
  };
}
