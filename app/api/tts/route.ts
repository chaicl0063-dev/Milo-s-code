import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { isGuideLang, type GuideLang } from "@/lib/i18n";

/**
 * GET /api/tts?text=...&lang=zh
 * 用微软 Edge「大声朗读」背后的神经网络语音把一句话合成 MP3。免费、不要 Key，
 * 但不是公开签约的官方接口，哪天失效了前端会自动退回手机自带语音。
 * 一次只合成一句（客户端按句请求并预取下一句），所以限制 400 字。
 */
export const runtime = "nodejs";
export const maxDuration = 30;

const VOICE: Record<GuideLang, string> = {
  zh: "zh-CN-XiaoxiaoNeural",
  en: "en-US-JennyNeural",
  es: "es-ES-ElviraNeural",
  fr: "fr-FR-DeniseNeural",
  de: "de-DE-KatjaNeural",
  ja: "ja-JP-NanamiNeural",
  ko: "ko-KR-SunHiNeural",
  pt: "pt-BR-FranciscaNeural",
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const text = (sp.get("text") ?? "").trim().slice(0, 400);
  const lang = isGuideLang(sp.get("lang")) ? (sp.get("lang") as GuideLang) : "en";
  if (!text) return NextResponse.json({ error: "missing text" }, { status: 400 });

  try {
    // Edge 的连接偶尔会在合成完成前被关掉（"no turn.end received"），换个连接重试一次
    let buf: Buffer | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 2 && !buf; attempt++) {
      try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata(VOICE[lang], OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        const { audioStream } = tts.toStream(text);
        const chunks: Buffer[] = [];
        for await (const c of audioStream) chunks.push(c as Buffer);
        const out = Buffer.concat(chunks);
        if (out.length < 200) throw new Error("empty audio");
        buf = out;
      } catch (err) {
        lastErr = err;
      }
    }
    if (!buf) throw lastErr instanceof Error ? lastErr : new Error("tts failed");
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(buf.length),
        // 同一句话同一语言的音频不会变，让浏览器和 CDN 缓存一天
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
      },
    });
  } catch (err) {
    console.error("[tts]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "tts_failed" }, { status: 502 });
  }
}
