import { NextRequest, NextResponse } from "next/server";
import { isValidLang, USER_AGENT } from "@/lib/wikipedia";

/**
 * GET /api/geocode?lat=48.8584&lon=2.2945&lang=zh
 * 反向地理编码：坐标 → 「巴黎 · 第七区」这样的地名，用 OpenStreetMap 的 Nominatim（免费，要求带 User-Agent，别高频）。
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lon = Number(sp.get("lon"));
  const lang = sp.get("lang") ?? "en";
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "invalid lat/lon" }, { status: 400 });
  }
  if (!isValidLang(lang)) return NextResponse.json({ error: "invalid lang" }, { status: 400 });

  // 坐标取 3 位小数（约 100 米），附近的请求共用缓存
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: lat.toFixed(3),
    lon: lon.toFixed(3),
    zoom: "15",
    "accept-language": lang === "zh" ? "zh-CN,zh,en" : `${lang},en`,
  });
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
    const d = await res.json();
    const a = d?.address ?? {};
    const city: string | undefined = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? a.state;
    // 巴黎这种 city_district 和 city 同名的，跳过重复项，往下取第七区这一级
    const area = [a.city_district, a.borough, a.suburb, a.quarter, a.neighbourhood].find((v): v is string => typeof v === "string" && v.length > 0 && v !== city);
    const parts = [city, area].filter(Boolean);
    const name = parts.length ? parts.join(" · ") : (d?.name as string | undefined) ?? null;
    return NextResponse.json({ name, country: a.country ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ name: null, error: message }, { status: 200 });
  }
}
