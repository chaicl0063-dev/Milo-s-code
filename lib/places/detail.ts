/**
 * 详情页的数据入口：根据 id 前缀决定去哪个数据源取，并尽量把其他来源的信息拼进来
 * （比如一个 OSM 地点带 wikidata 编号，就顺着拿 Wikidata 的图片和 Wikipedia 的正文）。
 */
import { placeSummary } from "@/lib/wikipedia";
import { amapDetail, amapEnabled } from "@/lib/places/amap";
import { categoryFromTags, nameFromTags, overpassElement, parseShortOsmId, parseWikipediaTag, elementCoords } from "@/lib/places/overpass";
import { commonsThumb, wikidataEntities, type WikidataEntity } from "@/lib/places/wikidata";
import { parsePlaceId, type PlaceDetail } from "@/lib/places/types";
import { unescoByQid, unescoHeritageName, unescoMatch, unescoName, unescoUrl } from "@/lib/places/unesco";
import { wikivoyageGuide } from "@/lib/places/wikivoyage";

export async function getPlaceDetail(lang: string, id: string): Promise<PlaceDetail | null> {
  const parsed = parsePlaceId(id);
  if (!parsed) return null;
  let detail: PlaceDetail | null;
  switch (parsed.prefix) {
    case "wp":
      detail = await fromWikipedia(lang, parsed.rest);
      break;
    case "wd":
      detail = await fromWikidata(lang, parsed.rest);
      break;
    case "osm":
      detail = await fromOsm(lang, parsed.rest);
      break;
    case "amap":
      detail = amapEnabled() ? await amapDetail(parsed.rest) : null;
      break;
    case "unesco":
      detail = await fromUnesco(lang, parsed.rest);
      break;
  }
  if (!detail) return null;
  return enrich(lang, detail);
}

/** 给任何来源的详情补两样：是不是世界遗产、最近的 Wikivoyage 目的地指南 */
async function enrich(lang: string, detail: PlaceDetail): Promise<PlaceDetail> {
  const qid = detail.links.wikidata?.split("/").pop();
  const site = unescoMatch({ wikidata: qid, lat: detail.coordinates?.lat, lon: detail.coordinates?.lon });
  if (site && !detail.unesco) {
    detail.unesco = { whs: site.whs ?? site.qid, name: unescoHeritageName(site, lang), url: unescoUrl(site) };
    detail.links.unesco = unescoUrl(site);
  }
  if (detail.coordinates && !detail.travelGuide) {
    const guide = await wikivoyageGuide(detail.coordinates.lat, detail.coordinates.lon, lang).catch(() => null);
    if (guide) detail.travelGuide = guide;
  }
  return detail;
}

/** 世界遗产条目：静态表给名字/坐标/编号，Wikidata + Wikipedia 给正文和图 */
async function fromUnesco(lang: string, qid: string): Promise<PlaceDetail | null> {
  const site = unescoByQid(qid);
  if (!site) return null;
  const entities = await wikidataEntities([qid], lang).catch(() => new Map<string, WikidataEntity>());
  const e = entities.get(qid);
  const base: Partial<PlaceDetail> = {
    id: `unesco:${qid}`,
    source: "unesco",
    title: unescoName(site, lang),
    coordinates: { lat: site.lat, lon: site.lon },
    category: "historic",
    unesco: { whs: site.whs ?? qid, name: unescoHeritageName(site, lang), url: unescoUrl(site) },
    links: { unesco: unescoUrl(site) },
  };
  if (e) return detailFromEntity(lang, e, base);
  return {
    ...(base as PlaceDetail),
    description: lang === "zh" ? "UNESCO 世界遗产" : "UNESCO World Heritage",
    extract: "",
    image: site.image ? { source: commonsThumb(site.image, 960) } : undefined,
  };
}

async function fromWikipedia(lang: string, title: string): Promise<PlaceDetail | null> {
  const s = await placeSummary(lang, title.replace(/_/g, " "));
  if (!s) return null;
  return {
    id: `wp:${title}`,
    source: "wikipedia",
    title: s.title,
    description: s.description,
    extract: s.extract,
    image: s.image,
    coordinates: s.coordinates,
    links: {
      wikipedia: s.url,
      wikidata: s.wikidata ? `https://www.wikidata.org/wiki/${s.wikidata}` : undefined,
    },
  };
}

/** 从 Wikidata 实体拼出详情；有 Wikipedia 词条就顺着把正文和链接拿过来 */
async function detailFromEntity(lang: string, e: WikidataEntity, base: Partial<PlaceDetail>): Promise<PlaceDetail> {
  let extract = "";
  let image = e.imageFile ? { source: commonsThumb(e.imageFile, 960) } : undefined;
  let wikipediaUrl: string | undefined;
  if (e.sitelink) {
    const s = await placeSummary(e.sitelink.lang, e.sitelink.title).catch(() => null);
    if (s) {
      extract = s.extract;
      wikipediaUrl = s.url;
      image ??= s.image;
    }
  }
  return {
    id: base.id ?? `wd:${e.id}`,
    source: base.source ?? "wikidata",
    title: base.title ?? e.label ?? e.id,
    description: base.description || e.description || "",
    extract,
    image,
    coordinates: base.coordinates ?? e.coordinates,
    category: base.category,
    address: base.address,
    openingHours: base.openingHours,
    phone: base.phone,
    website: base.website ?? e.website,
    links: {
      ...base.links,
      wikipedia: wikipediaUrl,
      wikidata: `https://www.wikidata.org/wiki/${e.id}`,
    },
  };
}

async function fromWikidata(lang: string, qid: string): Promise<PlaceDetail | null> {
  const e = (await wikidataEntities([qid], lang)).get(qid);
  if (!e) return null;
  return detailFromEntity(lang, e, {});
}

async function fromOsm(lang: string, short: string): Promise<PlaceDetail | null> {
  const parsed = parseShortOsmId(short);
  if (!parsed) return null;
  const osmUrl = `https://www.openstreetmap.org/${parsed.type}/${parsed.id}`;

  // Overpass 和 Wikidata 并行取；公共 Overpass 实例经常慢或超时，有 Wikidata 编号时它只是锦上添花
  const [elResult, entityResult] = await Promise.allSettled([
    overpassElement(short),
    parsed.wikidata ? wikidataEntities([parsed.wikidata], lang) : Promise.resolve(new Map<string, WikidataEntity>()),
  ]);
  const el = elResult.status === "fulfilled" ? elResult.value : null;
  const knownEntity = entityResult.status === "fulfilled" && parsed.wikidata ? entityResult.value.get(parsed.wikidata) : undefined;

  if (!el) {
    // Overpass 没拿到：退回 Wikidata；连它也没有就只能 404
    if (!knownEntity) return null;
    return detailFromEntity(lang, knownEntity, { id: `osm:${short}`, source: "osm", links: { osm: osmUrl } });
  }

  const tags = el.tags ?? {};
  const addressParts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean);
  const base: Partial<PlaceDetail> = {
    id: `osm:${short}`,
    source: "osm",
    title: nameFromTags(tags, lang) ?? short,
    description: tags[`description:${lang}`] ?? tags.description ?? "",
    coordinates: elementCoords(el) ?? undefined,
    category: categoryFromTags(tags),
    address: addressParts.length ? addressParts.join(" ") : undefined,
    openingHours: tags.opening_hours,
    phone: tags.phone ?? tags["contact:phone"],
    website: tags.website ?? tags["contact:website"],
    links: { osm: osmUrl },
  };

  // 有 Wikidata 编号：把图片、正文、链接都补上（优先用已经并行拿到的实体）
  const qid = tags.wikidata ?? parsed.wikidata;
  if (qid) {
    const e = knownEntity?.id === qid ? knownEntity : (await wikidataEntities([qid], lang).catch(() => new Map())).get(qid);
    if (e) return detailFromEntity(lang, e, base);
  }
  // 只有 wikipedia 标签：直接读那篇词条
  const wp = parseWikipediaTag(tags.wikipedia);
  if (wp) {
    const s = await placeSummary(wp.lang, wp.title).catch(() => null);
    if (s) {
      return {
        ...(base as PlaceDetail),
        description: base.description || s.description,
        extract: s.extract,
        image: s.image,
        links: { ...base.links, wikipedia: s.url },
      };
    }
  }
  return { ...(base as PlaceDetail), extract: "" };
}
