/**
 * 「可到访地点」过滤（COLLABORATION.md C02）。
 * Wikipedia 的坐标搜索会把带坐标的一切词条都返回：国家、战役、机构、行政区、人物团体……
 * 它们对讲解是背景资料，但不该作为「附近可以去看的地方」出现在地图、列表和路线候选里。
 *
 * 两个信号：
 *  1. Wikipedia 坐标的 type / dim（来自词条 {{coord}} 模板）：country、adm1st、city、event 这类是区域或事件，dim 很大的是区域尺度
 *  2. Wikidata 的一句话描述：通常以类型开头（"Country in …"、"Urban district in …"、"9th-century siege battle"、"Central Bank of …"）
 * 判断不了的保留（宁可多放，不误删真实遗址）。
 */
import type { Place } from "@/lib/places/types";

/** {{coord}} 的 type 里明确是区域、行政单位或事件的 */
export const NON_PLACE_COORD_TYPES = new Set(["country", "state", "adm1st", "adm2nd", "adm3rd", "city", "event", "satellite", "edu"]);
/** dim 是词条标注的对象尺度（米）。Wikipedia 对 city / waterbody 等类型默认填 10000，所以只有明显超过默认值的才算区域（例如三角洲的 100000） */
export const MAX_POINT_DIM_M = 20000;

/**
 * 描述里的类型词。描述多为 Wikidata 自动生成，形如「<类型> in/of <地方>」，所以只看开头 60 个字符。
 * 分组只为可读，逻辑上都是「命中即排除」。
 */
const NON_PLACE_DESCRIPTION = new RegExp(
  [
    // 政权、行政区、地理区域
    "\\b(country|sovereign state|former country|historical country|kingdom|dynasty|empire|republic|province|prefecture|region|county|district|arrondissement|municipality|commune|borough|ward|neighbou?rhood|quarter|suburb|metropolitan area|urban area|river delta|basin|watershed|plain|valley)\\b",
    // 事件
    "\\b(battle|siege|war|campaign|uprising|revolt|rebellion|massacre|riot|coup|treaty|conference|summit|election|earthquake|flood|fire of|disaster|incident|attack|bombing|festival|exhibition|expo|race|championship|olympic)\\b",
    // 人和团体
    "\\b(politician|writer|poet|painter|composer|emperor|king|queen|general|monk|saint|bishop|group of|gang|dynasty|family|clan|tribe|people)\\b",
    // 机构（有楼，但不是给游客看的）
    "\\b(mission|commission|committee|ministry|department|agency|authority|bureau|central bank|bank|stock exchange|company|corporation|conglomerate|enterprise|business|brand|newspaper|magazine|publisher|broadcaster|radio station|television station|airline|political party|trade union|archdiocese|diocese|eparchy|order|society|association|federation|league|club|team|hospital|clinic|school|college|university|institute|academy|faculty|laboratory|embassy|consulate|court)\\b",
  ].join("|"),
  "i",
);

/** 描述里出现这些词说明是实体建筑或场所，即使前面撞上机构词也保留（比如 "museum of the university"） */
const PLACE_OVERRIDE = /\b(university museum|school museum|historic|heritage|landmark|department store|museum|gallery|memorial|monument|temple|church|cathedral|mosque|synagogue|shrine|pagoda|palace|castle|fort|fortress|citadel|tower|gate|bridge|square|plaza|park|garden|lake|market|theatre|theater|opera house|library|stadium|arena|station|lighthouse|monastery|abbey|chapel|mausoleum|tomb|ruins|archaeological site|historic site|building|house|villa|hotel|street|boulevard|avenue|promenade|waterfront|viewpoint|observatory|aquarium|zoo|botanical)\b/i;

export interface VisitableHints {
  /** Wikipedia {{coord}} 的 type，可能没有 */
  coordType?: string;
  /** Wikipedia {{coord}} 的 dim（米），可能没有 */
  coordDim?: number;
}

/** 这个地点能不能作为「附近可以去看的地方」出现 */
export function isVisitable(place: Pick<Place, "description" | "title" | "source"> & VisitableHints): boolean {
  if (place.coordType && NON_PLACE_COORD_TYPES.has(place.coordType.toLowerCase())) return false;
  if (typeof place.coordDim === "number" && place.coordDim > MAX_POINT_DIM_M) return false;
  const desc = (place.description ?? "").slice(0, 60);
  if (!desc) return true; // 没有描述判断不了，保留
  // 谁先出现谁说了算："Archdiocese of the Catholic Church" 是机构，"Museum of the University" 是场所
  const deny = NON_PLACE_DESCRIPTION.exec(desc);
  if (!deny) return true;
  const keep = PLACE_OVERRIDE.exec(desc);
  return Boolean(keep && keep.index <= deny.index);
}
