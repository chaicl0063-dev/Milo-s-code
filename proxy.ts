import { NextResponse, type NextRequest } from "next/server";

/**
 * 域名分流（部署时由运维配置，代码不写死域名）：
 *   SITE_HOSTS=bubblefrog.fun,www.bubblefrog.fun   官网域名，根路径显示官网（内部重写到 /site）
 *   应用子域名（例如 app.bubblefrog.fun）不用配置，根路径本来就是应用。
 * 没配 SITE_HOSTS 时什么都不做：官网仍在 /site，应用在 /，和 Beta 期的单域名部署一致。
 * 只重写根路径和两个法律页面，其它路径（/api、/p/…）在任何域名下都照常可用。
 */
const SITE_HOSTS = (process.env.SITE_HOSTS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const SITE_PATHS: Record<string, string> = {
  "/": "/site",
  "/privacy": "/site/privacy",
  "/terms": "/site/terms",
};

export function proxy(req: NextRequest) {
  if (SITE_HOSTS.length === 0) return NextResponse.next();
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (!SITE_HOSTS.includes(host)) return NextResponse.next();
  const target = SITE_PATHS[req.nextUrl.pathname];
  if (!target) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = target;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/", "/privacy", "/terms"],
};
