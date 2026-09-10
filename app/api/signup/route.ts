import { NextRequest, NextResponse } from "next/server";
import { isLang } from "@/lib/i18n";

/**
 * POST /api/signup  body: { email, lang?, persona? }
 * 邮箱登记。存到 Upstash Redis（Vercel Marketplace 里一键创建的免费 KV），
 * 环境变量 KV_REST_API_URL / KV_REST_API_TOKEN 由 Vercel 自动注入；没配就只返回 stored:false，
 * 前端仍然记在本机，不影响使用。不收密码：真正的登录以后接托管的身份服务。
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function kvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/** Upstash 的 REST 接口：POST 一条命令数组 */
async function kv(...command: (string | number)[]): Promise<unknown> {
  const res = await fetch(process.env.KV_REST_API_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`KV HTTP ${res.status}`);
  return (await res.json()).result;
}

export async function POST(req: NextRequest) {
  let body: { email?: string; lang?: string; persona?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) return NextResponse.json({ error: "invalid email" }, { status: 400 });
  const lang = isLang(body.lang) ? body.lang : "en";

  if (!kvConfigured()) {
    console.warn("[signup] KV not configured, not persisted:", email);
    return NextResponse.json({ ok: true, stored: false });
  }
  try {
    const key = `signup:${email}`;
    const existed = await kv("EXISTS", key);
    if (!existed) {
      await kv("HSET", key, "email", email, "createdAt", new Date().toISOString(), "lang", lang, "persona", body.persona ?? "", "ua", req.headers.get("user-agent")?.slice(0, 200) ?? "");
      await kv("SADD", "signups", email);
    }
    return NextResponse.json({ ok: true, stored: true, existed: Boolean(existed) });
  } catch (err) {
    console.error("[signup]", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: true, stored: false });
  }
}
