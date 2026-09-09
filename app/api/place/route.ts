import { NextRequest, NextResponse } from "next/server";
import { isValidLang } from "@/lib/wikipedia";
import { getPlaceDetail } from "@/lib/places/detail";

/**
 * GET /api/place?lang=en&id=wp:Eiffel_Tower
 * id 带来源前缀：wp:标题 · osm:n123 · wd:Q243 · amap:B0FFG...
 * 兼容旧写法 ?title=Eiffel_Tower（等于 id=wp:Eiffel_Tower）。
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lang = sp.get("lang") ?? "en";
  const legacyTitle = sp.get("title")?.trim();
  const id = sp.get("id")?.trim() ?? (legacyTitle ? `wp:${legacyTitle}` : "");

  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }
  if (!isValidLang(lang)) {
    return NextResponse.json({ error: "invalid lang" }, { status: 400 });
  }

  try {
    const place = await getPlaceDetail(lang, id);
    if (!place) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json(place);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
