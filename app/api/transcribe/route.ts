import { NextRequest, NextResponse } from "next/server";
import { asrConfigured } from "@/lib/asr";

/**
 * POST /api/transcribe  (multipart: audio=<文件>, lang=<讲解语言>)
 * 把录音转发给 OpenAI 兼容的语音识别接口，返回 { text }。
 */
export async function POST(req: NextRequest) {
  if (!asrConfigured()) return NextResponse.json({ error: "asr_not_configured" }, { status: 503 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid form" }, { status: 400 });
  }
  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) return NextResponse.json({ error: "missing audio" }, { status: 400 });
  if (audio.size > 10 * 1024 * 1024) return NextResponse.json({ error: "audio too large" }, { status: 413 });
  const lang = typeof form.get("lang") === "string" ? (form.get("lang") as string).slice(0, 2) : undefined;

  const upstreamForm = new FormData();
  const filename = audio instanceof File && audio.name ? audio.name : "audio.webm";
  upstreamForm.append("file", audio, filename);
  upstreamForm.append("model", process.env.ASR_MODEL!);
  upstreamForm.append("response_format", "json");
  if (lang) upstreamForm.append("language", lang);

  try {
    const base = process.env.ASR_BASE_URL!.replace(/\/+$/, "");
    const res = await fetch(`${base}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.ASR_API_KEY}` },
      body: upstreamForm,
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[transcribe]", res.status, detail.slice(0, 200));
      return NextResponse.json({ error: "asr_failed" }, { status: 502 });
    }
    const data = (await res.json()) as { text?: string };
    return NextResponse.json({ text: (data.text ?? "").trim() });
  } catch (err) {
    console.error("[transcribe]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "asr_failed" }, { status: 502 });
  }
}
