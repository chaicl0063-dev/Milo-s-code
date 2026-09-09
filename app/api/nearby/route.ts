import { NextRequest, NextResponse } from "next/server";
import { isValidLang, nearbyPlaces } from "@/lib/wikipedia";

/**
 * GET /api/nearby?lat=48.8584&lon=2.2945&lang=en&radius=1000
 * 返回当前坐标周边的 Wikipedia 地点，按距离排序。
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lon = Number(sp.get("lon"));
  const lang = sp.get("lang") ?? "en";
  // 半径限制在 100 米到 10 公里之间，超出就夹到边界
  const radius = Math.min(Math.max(Number(sp.get("radius") ?? 1000) || 1000, 100), 10000);

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "invalid lat/lon" }, { status: 400 });
  }
  if (!isValidLang(lang)) {
    return NextResponse.json({ error: "invalid lang" }, { status: 400 });
  }

  try {
    const places = await nearbyPlaces(lat, lon, lang, radius);
    return NextResponse.json({ lang, center: { lat, lon }, radius, count: places.length, places });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
