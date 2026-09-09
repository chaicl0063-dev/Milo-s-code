import { NextRequest, NextResponse } from "next/server";
import { isValidLang, placeSummary } from "@/lib/wikipedia";

/**
 * GET /api/place?lang=en&title=Eiffel_Tower
 * 返回单个地点的摘要、图片、坐标和 Wikipedia 链接。
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lang = sp.get("lang") ?? "en";
  const title = sp.get("title")?.trim() ?? "";

  if (!title) {
    return NextResponse.json({ error: "missing title" }, { status: 400 });
  }
  if (!isValidLang(lang)) {
    return NextResponse.json({ error: "invalid lang" }, { status: 400 });
  }

  try {
    const place = await placeSummary(lang, title);
    if (!place) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json(place);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
