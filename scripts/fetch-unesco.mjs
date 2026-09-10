/**
 * 从 Wikidata 拉 UNESCO 世界遗产名录，写成 lib/data/unesco.json。
 * 运行：node scripts/fetch-unesco.mjs   （需要能访问 query.wikidata.org；本机走代理时加
 *       NODE_USE_ENV_PROXY=1 HTTPS_PROXY=http://127.0.0.1:7890）
 * UNESCO 官网有反爬，Wikidata 的数据更全还带多语言名字和图片，所以用它。
 *
 * Wikidata 里「是世界遗产」有三种写法，都要收：
 *   1. 遗产本身：heritage designation (P1435) = World Heritage Site (Q9259)
 *   2. 系列遗产的组成部分：P1435 = part of World Heritage Site (Q26971668)，限定词 P642 指向遗产本身
 *      （故宫就是这样：它是「明清皇宫」这项遗产的组成部分）
 *   3. 只写了 part of (P361) 指向一项遗产
 * 组成部分自己没有 UNESCO 编号（P757），从所属遗产那里继承。
 */
import { writeFileSync, mkdirSync } from "node:fs";

const FIELDS = `?item ?en ?zh ?coord ?whsId ?image ?countryLabel ?parent`;
const COMMON = `
  ?item wdt:P625 ?coord.
  OPTIONAL { ?item wdt:P757 ?whsId }
  OPTIONAL { ?item wdt:P18 ?image }
  OPTIONAL { ?item wdt:P17 ?country }
  OPTIONAL { ?item rdfs:label ?en FILTER(LANG(?en) = "en") }
  OPTIONAL { ?item rdfs:label ?zh FILTER(LANG(?zh) = "zh") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }`;

const QUERIES = [
  `SELECT ${FIELDS} WHERE { ?item wdt:P1435 wd:Q9259. BIND(?item AS ?parent) ${COMMON} }`,
  `SELECT ${FIELDS} WHERE { ?item p:P1435 ?st. ?st ps:P1435 wd:Q26971668. OPTIONAL { ?st pq:P642 ?parent } ${COMMON} }`,
  `SELECT ${FIELDS} WHERE { ?item wdt:P361 ?parent. ?parent wdt:P1435 wd:Q9259. ${COMMON} }`,
];

async function run(query) {
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ReAroundYou/0.3 (learning project; https://github.com/chaicl0063-dev/Milo-s-code)", Accept: "application/sparql-results+json" },
  });
  if (!res.ok) throw new Error(`SPARQL HTTP ${res.status}`);
  return (await res.json()).results.bindings;
}

const byItem = new Map();
const whsOf = new Map(); // qid → UNESCO 编号，给组成部分继承用

for (const [i, q] of QUERIES.entries()) {
  const rows = await run(q);
  console.log(`query ${i + 1}: ${rows.length} rows`);
  for (const r of rows) {
    const qid = r.item.value.split("/").pop();
    const m = /Point\(([-\d.eE]+) ([-\d.eE]+)\)/.exec(r.coord.value);
    if (!m) continue;
    const parent = r.parent?.value?.split("/").pop() ?? null;
    if (r.whsId?.value) whsOf.set(qid, r.whsId.value);
    if (byItem.has(qid)) continue; // 同一实体多条（多张图/多国）只留第一条
    byItem.set(qid, {
      qid,
      en: r.en?.value ?? null,
      zh: r.zh?.value ?? null,
      lat: Number(Number(m[2]).toFixed(5)),
      lon: Number(Number(m[1]).toFixed(5)),
      whs: r.whsId?.value ?? null,
      image: r.image?.value ? decodeURIComponent(r.image.value.split("/").pop()) : null,
      country: r.countryLabel?.value ?? null,
      parent: parent && parent !== qid ? parent : null,
    });
  }
}

const list = [];
for (const x of byItem.values()) {
  if (!x.en) continue;
  if (!x.whs && x.parent) x.whs = whsOf.get(x.parent) ?? null;
  // 没法确定属于哪项遗产的组成部分不要（多半是老城区里随手标的房子），也不存国家名，控制文件体积
  if (!x.whs) continue;
  const { parent, country, ...rest } = x;
  void country;
  // 组成部分记下所属遗产的名字（故宫 → 明清皇宫），详情页的世界遗产标签显示遗产名
  const p = parent ? byItem.get(parent) : undefined;
  if (p && p.en && p.en !== x.en) {
    rest.pen = p.en;
    if (p.zh && p.zh !== x.zh) rest.pzh = p.zh;
  }
  list.push(rest);
}
mkdirSync("lib/data", { recursive: true });
writeFileSync("lib/data/unesco.json", JSON.stringify(list));
console.log("sites:", list.length, "| with whs id:", list.filter((x) => x.whs).length, "| with image:", list.filter((x) => x.image).length);
