import { NextRequest, NextResponse } from "next/server";
import { isValidLang, USER_AGENT } from "@/lib/wikipedia";
import { gcj02ToWgs84, haversine, isInChina } from "@/lib/geo";

/**
 * GET /api/search?q=louvre&lang=en&lat=&lon=
 * 地名 / 地点搜索：OpenStreetMap 的 Nominatim（全球，免费），
 * 配了 AMAP_KEY 且（查询含中文 或 当前中心在中国境内）时再并行查高德「输入提示」，结果合并去重。
 */
export interface SearchResult {
  name: string;
  detail: string;
  lat: number;
  lon: number;
  kind: "city" | "place" | "amap" | "other";
}

const CITY_TYPES = new Set(["city", "town", "village", "municipality", "administrative", "suburb", "county", "state", "country", "hamlet"]);
const PLACE_CLASSES = new Set(["tourism", "historic", "amenity", "leisure", "building", "man_made"]);

async function nominatim(q: string, lang: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q,
    format: "jsonv2",
    limit: "8",
    "accept-language": lang === "zh" ? "zh-CN,zh,en" : `${lang},en`,
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const rows: Array<{ display_name: string; name?: string; lat: string; lon: string; class?: string; type?: string; addresstype?: string }> = await res.json();
  return rows
    .map((r) => {
      const parts = r.display_name.split(",").map((p) => p.trim());
      const name = r.name || parts[0];
      const rest = parts.filter((p) => p !== name);
      const detail = [rest[0], rest[rest.length - 1]].filter((p, i, a) => p && a.indexOf(p) === i).join(" · ");
      const kind: SearchResult["kind"] = CITY_TYPES.has(r.addresstype ?? r.type ?? "")
        ? "city"
        : PLACE_CLASSES.has(r.class ?? "")
          ? "place"
          : "other";
      return { name, detail, lat: Number(r.lat), lon: Number(r.lon), kind };
    })
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lon));
}

async function amapTips(q: string, near: { lat: number; lon: number } | null): Promise<SearchResult[]> {
  const key = process.env.AMAP_KEY;
  if (!key) return [];
  const params = new URLSearchParams({ key, keywords: q, datatype: "poi", output: "json" });
  if (near) params.set("location", `${near.lon.toFixed(6)},${near.lat.toFixed(6)}`);
  const res = await fetch(`https://restapi.amap.com/v3/assistant/inputtips?${params}`, {
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Amap HTTP ${res.status}`);
  const data = await res.json();
  if (data?.status !== "1") throw new Error(`Amap error: ${data?.info ?? "unknown"}`);
  const tips: Array<{ name: string; district?: string | string[]; address?: string | string[]; location?: string | string[] }> = data?.tips ?? [];
  const out: SearchResult[] = [];
  for (const t of tips) {
    const loc = Array.isArray(t.location) ? t.location[0] : t.location;
    if (!loc || !t.name) continue; // 有些提示是「类别」不是地点，没有坐标
    const [lon, lat] = loc.split(",").map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const wgs = gcj02ToWgs84(lat, lon);
    const district = Array.isArray(t.district) ? t.district[0] : t.district;
    out.push({ name: t.name, detail: district ?? "", lat: wgs.lat, lon: wgs.lon, kind: "amap" });
  }
  return out;
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 100);
  const lang = sp.get("lang") ?? "en";
  const lat = Number(sp.get("lat"));
  const lon = Number(sp.get("lon"));
  const near = Number.isFinite(lat) && Number.isFinite(lon) && sp.has("lat") ? { lat, lon } : null;

  if (!isValidLang(lang)) return NextResponse.json({ error: "invalid lang" }, { status: 400 });
  if (q.length < 2) return NextResponse.json({ q, results: [] });

  const hasCjk = /[㐀-鿿]/.test(q);
  const useAmap = Boolean(process.env.AMAP_KEY) && (hasCjk || (near !== null && isInChina(near.lat, near.lon)));

  const [nomi, amap] = await Promise.allSettled([nominatim(q, lang), useAmap ? amapTips(q, near) : Promise.resolve<SearchResult[]>([])]);
  const a = amap.status === "fulfilled" ? amap.value : [];
  const n = nomi.status === "fulfilled" ? nomi.value : [];
  if (nomi.status === "rejected") console.warn("[search] nominatim failed:", nomi.reason instanceof Error ? nomi.reason.message : nomi.reason);
  if (amap.status === "rejected") console.warn("[search] amap failed:", amap.reason instanceof Error ? amap.reason.message : amap.reason);

  // 高德排前（境内更准），同名且 200 米内的去重
  const merged: SearchResult[] = [];
  for (const r of [...a, ...n]) {
    const dup = merged.some((m) => normalize(m.name) === normalize(r.name) && haversine(m.lat, m.lon, r.lat, r.lon) < 200);
    if (!dup) merged.push(r);
  }
  return NextResponse.json({ q, results: merged.slice(0, 10), sources: { nominatim: nomi.status, amap: useAmap ? amap.status : "skipped" } });
}
