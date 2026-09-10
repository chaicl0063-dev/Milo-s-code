/**
 * 所有数据源（Wikipedia / OpenStreetMap / Wikidata / 高德）统一成这两个形状，
 * 页面组件只认识 Place 和 PlaceDetail，不关心数据从哪来。
 */

export type PlaceSource = "wikipedia" | "osm" | "wikidata" | "amap" | "unesco";

export type PlaceCategory =
  | "attraction"
  | "museum"
  | "gallery"
  | "viewpoint"
  | "artwork"
  | "monument"
  | "memorial"
  | "historic"
  | "religious"
  | "park"
  | "zoo"
  | "theme_park"
  | "theatre"
  | "other";

/** 列表里的一个地点 */
export interface Place {
  /** 全局唯一 id，带来源前缀：wp:Eiffel_Tower · osm:n299730585 · wd:Q243 · amap:B0FFG... */
  id: string;
  source: PlaceSource;
  title: string;
  /** WGS-84 坐标（高德返回的 GCJ-02 已经转换过） */
  lat: number;
  lon: number;
  /** 距查询中心的米数 */
  dist: number;
  description?: string;
  thumbnail?: string;
  category?: PlaceCategory;
  /** Wikidata 编号，用来跨数据源合并同一个地点 */
  wikidata?: string;
  wikipedia?: { lang: string; title: string };
  /** UNESCO 世界遗产编号（是遗产或其组成部分时才有） */
  unesco?: string;
}

/** 详情页需要的完整信息 */
export interface PlaceDetail {
  id: string;
  source: PlaceSource;
  title: string;
  description: string;
  extract: string;
  image?: { source: string; width?: number; height?: number };
  coordinates?: { lat: number; lon: number };
  category?: PlaceCategory;
  address?: string;
  openingHours?: string;
  phone?: string;
  website?: string;
  links: {
    wikipedia?: string;
    wikidata?: string;
    osm?: string;
    amap?: string;
    unesco?: string;
  };
  /** 是世界遗产（或其组成部分）时的编号和名称 */
  unesco?: { whs: string; name: string; url: string };
  /** 最近的 Wikivoyage 目的地条目摘要 */
  travelGuide?: { source: "wikivoyage"; title: string; extract: string; url: string; dist: number };
}

/** 从 id 里拆出来源前缀和剩余部分 */
export function parsePlaceId(id: string): { prefix: "wp" | "osm" | "wd" | "amap" | "unesco"; rest: string } | null {
  const m = /^(wp|osm|wd|amap|unesco):(.+)$/.exec(id);
  if (!m) return null;
  return { prefix: m[1] as "wp" | "osm" | "wd" | "amap" | "unesco", rest: m[2] };
}
