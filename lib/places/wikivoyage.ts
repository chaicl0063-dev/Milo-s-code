/**
 * Wikivoyage 旅行指南：按坐标找最近的目的地条目（通常是城市或城区，如「巴黎/第七區」），取摘要；
 * 再到条目正文里找这个地点自己的「景点条目」（{{see|name=…|wikidata=Q243|content=…}}），
 * 那段是旅行者写给旅行者看的介绍，比百科摘要更像导游词，详情页直接拿它当介绍。
 * 和 Wikipedia 同一套接口，免费无 Key。先试当前语言的站点，没有再退回英文站。
 */
import { wikiFetch } from "@/lib/wikipedia";

export interface TravelGuide {
  source: "wikivoyage";
  lang: string;
  title: string;
  extract: string;
  url: string;
  /** 与查询点的距离，米 */
  dist: number;
  /** 条目里专门写这个地点的那一段（找到了才有） */
  listing?: { name: string; content: string };
}

export interface GuideMatch {
  wikidata?: string;
  title?: string;
}

async function nearestArticle(lang: string, lat: number, lon: number): Promise<{ title: string; dist: number } | null> {
  const params = new URLSearchParams({
    action: "query",
    list: "geosearch",
    gscoord: `${lat}|${lon}`,
    gsradius: "10000",
    gslimit: "5",
    format: "json",
    formatversion: "2",
  });
  const res = await wikiFetch(`https://${lang}.wikivoyage.org/w/api.php?${params}`, 86400);
  if (!res.ok) return null;
  const data = await res.json();
  const hits: Array<{ title: string; dist: number }> = data?.query?.geosearch ?? [];
  // 优先「城市/城区」这类带斜杠的分区条目，其次最近的
  const district = hits.find((h) => h.title.includes("/"));
  return district ?? hits[0] ?? null;
}

async function wikitext(lang: string, title: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query",
    prop: "revisions",
    rvprop: "content",
    rvslots: "main",
    titles: title,
    format: "json",
    formatversion: "2",
  });
  const res = await wikiFetch(`https://${lang}.wikivoyage.org/w/api.php?${params}`, 86400);
  if (!res.ok) return null;
  const data = await res.json();
  const text: unknown = data?.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content;
  return typeof text === "string" ? text : null;
}

/** 去掉 wiki 标记：链接留显示文字、去粗斜体、去内嵌模板和 ref */
export function stripWikitext(s: string): string {
  return s
    .replace(/<ref[^>]*\/>/g, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/\[https?:\/\/\S+\s+([^\]]*)\]/g, "$1")
    .replace(/\[https?:\/\/\S+\]/g, "")
    .replace(/'''?/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 把一个 {{see|…}} 模板拆成参数表；管道符要按 [[ ]] 和 {{ }} 的嵌套深度来切 */
function parseTemplate(body: string): Record<string, string> {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2);
    if (two === "[[" || two === "{{") {
      depth++;
      cur += two;
      i++;
      continue;
    }
    if (two === "]]" || two === "}}") {
      depth = Math.max(0, depth - 1);
      cur += two;
      i++;
      continue;
    }
    if (body[i] === "|" && depth === 0) {
      parts.push(cur);
      cur = "";
      continue;
    }
    cur += body[i];
  }
  parts.push(cur);
  const out: Record<string, string> = {};
  for (const p of parts.slice(1)) {
    const eq = p.indexOf("=");
    if (eq < 0) continue;
    out[p.slice(0, eq).trim().toLowerCase()] = p.slice(eq + 1).trim();
  }
  return out;
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

/** 在条目正文里找这个地点的 listing：先按 Wikidata 编号，其次按名字（含 alt / wikipedia 参数） */
function findListing(text: string, match: GuideMatch): { name: string; content: string } | null {
  const wanted = match.title ? normalize(match.title) : "";
  const re = /\{\{\s*(see|do|listing|buy|eat|drink|sleep|go)\b/gi;
  let m: RegExpExecArray | null;
  let byName: { name: string; content: string } | null = null;
  while ((m = re.exec(text))) {
    // 找到这个模板的结束 }}（考虑嵌套）
    let depth = 0;
    let end = -1;
    for (let i = m.index; i < text.length - 1; i++) {
      const two = text.slice(i, i + 2);
      if (two === "{{") {
        depth++;
        i++;
      } else if (two === "}}") {
        depth--;
        i++;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    if (end < 0) break;
    const params = parseTemplate(text.slice(m.index + 2, end - 2));
    re.lastIndex = end;
    const content = stripWikitext(params.content ?? "");
    if (content.length < 20) continue;
    const name = stripWikitext(params.name ?? "");
    if (match.wikidata && params.wikidata?.trim() === match.wikidata) return { name, content };
    if (!byName && wanted) {
      const names = [params.name, params.alt, params.wikipedia].filter(Boolean).map((x) => normalize(stripWikitext(x!)));
      if (names.some((n) => n && (n === wanted || (n.length >= 4 && (wanted.includes(n) || n.includes(wanted)))))) byName = { name, content };
    }
  }
  return byName;
}

export async function wikivoyageGuide(lat: number, lon: number, lang: string, match: GuideMatch = {}): Promise<TravelGuide | null> {
  const langs = lang === "en" ? ["en"] : [lang, "en"];
  for (const l of langs) {
    try {
      const hit = await nearestArticle(l, lat, lon);
      if (!hit) continue;
      const slug = encodeURIComponent(hit.title.replace(/ /g, "_"));
      const res = await wikiFetch(`https://${l}.wikivoyage.org/api/rest_v1/page/summary/${slug}`, 86400);
      if (!res.ok) continue;
      const d = await res.json();
      if (!d.extract) continue;
      const guide: TravelGuide = {
        source: "wikivoyage",
        lang: l,
        title: d.title ?? hit.title,
        extract: d.extract,
        url: d.content_urls?.desktop?.page ?? `https://${l}.wikivoyage.org/wiki/${slug}`,
        dist: Math.round(hit.dist),
      };
      // 这个地点自己就是一篇条目（如「北京/故宫」）：摘要就是它的介绍
      const leaf = hit.title.split("/").pop() ?? hit.title;
      if (match.title && hit.dist < 400 && normalize(leaf) && (normalize(match.title).includes(normalize(leaf)) || normalize(leaf).includes(normalize(match.title)))) {
        guide.listing = { name: leaf, content: d.extract };
        return guide;
      }
      if (match.wikidata || match.title) {
        const text = await wikitext(l, hit.title).catch(() => null);
        const listing = text ? findListing(text, match) : null;
        if (listing) guide.listing = listing;
      }
      return guide;
    } catch {
      /* 试下一个语言 */
    }
  }
  return null;
}
