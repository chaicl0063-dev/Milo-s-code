/**
 * 官网 V2 用到的事实内容。全部来自应用里已有的真实数据与既有演示脚本，不另造地点、能力或数字：
 * - 地点：巴黎 圣雅克塔（Tour Saint-Jacques），与 lib/site/demo.ts 同一地点、同一组核对过的事实
 * - 描述句 "Monument located in Paris, France" 是应用详情页/讲解页真实显示的 Wikidata 描述
 * - 周边地点与距离：2026-09-15 用本机 dev 服务器跑 /api/nearby?lat=48.8579&lon=2.3489&radius=1000（60 条）的真实结果
 * - 一小时路线：scripts/fixtures/route-paris-1h.json（应用真实跑出来的结果，3 站 · 约 1 小时）
 * - 界面文案 "Today's route · 3 stops · about 1 h" / "Stay 15 min" / "Ask a follow-up…" / "Send" / "AI-generated" 与应用一致
 * 「120 m」是演示距离（V1 起沿用的示例值），不是某次真实定位结果。
 */
import { DEMO_STORY, DEMO_PLACE } from "@/lib/site/demo";

export const PLACE = {
  name: DEMO_PLACE.name,
  /** 应用里显示的一行描述（Wikidata） */
  description: "Monument located in Paris, France",
  /** 短类别，用在图钉标签 */
  kind: "Monument",
  area: "Châtelet · Paris 4e",
  areaShort: "Châtelet, Paris",
  lat: "48.8579° N",
  lon: "2.3489° E",
  /** 演示距离 */
  distance: "120 m",
  appPath: DEMO_PLACE.appPath,
  /** 核对过的事实（lib/site/demo.ts 文件头） */
  facts: ["Built 1509–1523", "52 m tall", "Flamboyant Gothic", "UNESCO listed 1998"],
  intro: "The only remaining part of Saint-Jacques-de-la-Boucherie, a church pulled down after the Revolution.",
  sources: ["Wikipedia", "Wikivoyage", "Wikidata", "UNESCO"],
  /**
   * 01 The Moment 的塔顶细部：Wikimedia Commons「Tour Saint-Jacques, Paris, 2023, détails (1)」，Ibex73，CC BY 4.0
   *（2026-09-16 按 docs/REAROUND-YOU-IMAGE-HANDOFF-2026-09-16.md 接入；原图 3728×2417，sha256 1c1eff55…3116dfe）。
   * detail：3:2 轻裁 x=51,y=0,w=3626,h=2417 → 1800×1200；detailPortrait：手机 4:5，x=0,y=0,w=1934,h=2417 → 900×1125（保留尖顶与持杖雕像）。
   * 画面：塔顶尖上一尊手持长杖的雕像、火焰哥特花饰、伸出的滴水兽、角上一尊带翼雕像。雕像身份按应用讲解脚本（lib/site/demo.ts 文件头）：
   * 顶上持朝圣杖者为圣雅各；页面文案只说「the figure with the pilgrim's staff」，不在图上标注专名。
   */
  photo: {
    detail: "/images/moment-detail-1800.jpg",
    detailPortrait: "/images/moment-detail-portrait.jpg",
    detailAlt: "The top of Tour Saint-Jacques against a blue sky: a statue with a pilgrim's staff on the pinnacle, gargoyles and Flamboyant Gothic tracery",
    author: "Ibex73",
    license: "CC BY 4.0",
    page: "https://commons.wikimedia.org/wiki/File:Tour_Saint-Jacques,_Paris,_2023,_d%C3%A9tails_(1).jpg",
  },
} as const;

/** Mia 讲这个地点的三句话（核对过的事实，见 lib/site/demo.ts 文件头） */
export const STORY = DEMO_STORY.story.sentences;

export const MIA = { name: "Mia", image: "/images/mia-300.jpg", role: "Your guide" } as const;

/** 01 · 同一个地点，多一层：四行都对应应用已有能力 */
export const LAYERS = [
  { title: "What it is", text: "From Wikivoyage and Wikipedia, before anyone speaks." },
  { title: "The story behind it", text: "Mia tells it sentence by sentence, in your language." },
  { title: "What to look for", text: "Details on the building you would walk past." },
  { title: "Your questions, answered", text: "Ask a follow-up about anything you noticed." },
] as const;

/**
 * 街景照片槽位。
 * hero：首屏的街头场景。首屏的图钉标的是巴黎真实地点，所以这里必须是同一地点的真实照片。
 *   2026-09-16 起用 Wikimedia Commons 上 Jorge Láscar 的平视街景（CC BY 2.0，原图 5520×3680）：
 *   塔在画面左中、右侧是天空（放产品卡）、底部是行人、单车与车流（行人尺度）。
 *   square 是同一张照片的正方形裁切（手机用；原图 x 500–4180），thumb 是塔冠的裁切（卡片缩略图）。
 *   pin 是塔顶在两种裁切里的位置（百分比），只标这一个画面里看得见的地标；访客位置不画在照片上。
 */
export const STREET = {
  hero: {
    src: "/images/hero-street-1280.jpg",
    srcSet: "/images/hero-street-1280.jpg 1280w, /images/hero-street-1920.jpg 1920w",
    square: "/images/hero-street-square.jpg",
    thumb: "/images/tour-saint-jacques-street-thumb.jpg",
    alt: "Tour Saint-Jacques seen from the street at Châtelet, Paris, with people, bikes and traffic below it",
    pin: { landscape: { x: 42, y: 9 }, square: { x: 49, y: 9 } },
    author: "Jorge Láscar",
    license: "CC BY 2.0",
    page: "https://commons.wikimedia.org/wiki/File:Tour_Saint-Jacques_(22284511318).jpg",
  },
} as const;

/** 应用真实跑出的一小时路线（scripts/fixtures/route-paris-1h.json），起点即圣雅克塔坐标 */
export interface RouteStop {
  n: number;
  name: string;
  kind: string;
  stay: string;
  /** 从上一站走过来（fixture 的 legMinutes，按地点间距离估算，不是道路实测） */
  walk: string;
  /** 真实坐标（fixture） */
  lat: number;
  lon: number;
}

/**
 * 口径（2026-09-16 结构轮复核 C03）：fixture 的 dist / legMeters 是地点间的直线估算，不是道路步行距离，所以官网不显示米数与总公里数；
 * 步行分钟标 "est."；「about 1 hour」是应用的规划预算（3 × 15 min 停留 + 估算步行），不是测得时长；停留是建议。
 */
export const ROUTE = {
  headline: "Today's route · 3 stops · about 1 h",
  time: "About 1 hour",
  timeLabel: "planned · 3 stops",
  stopsLabel: "3 stops",
  stay: "15 min each",
  stayLabel: "suggested stay",
  /** 起点 = fixture.origin（示例起点，不是访客位置） */
  origin: { lat: 48.8579, lon: 2.3489 },
  stops: [
    { n: 1, name: "Place du Châtelet", kind: "Public square", stay: "Stay 15 min", walk: "est. 1 min walk", lat: 48.85763888888889, lon: 2.3473611111111112 },
    { n: 2, name: "Fontaine du Palmier", kind: "Monumental fountain", stay: "Stay 15 min", walk: "est. 1 min walk", lat: 48.85749722222222, lon: 2.3472694444444446 },
    { n: 3, name: "Rue des Lombards", kind: "Street", stay: "Stay 15 min", walk: "est. 3 min walk", lat: 48.85930555555556, lon: 2.3491666666666666 },
  ] as RouteStop[],
} as const;

/**
 * 03 的路线配图（2026-09-16 起用）：用户用 ChatGPT 按 docs/SITE-V2-MAP-IMAGE-PROMPT-20260916.md 生成的**虚构城市示意插画**，
 * 验收见 docs/SITE-V2-MAP-IMAGE-ACCEPTANCE-20260916.md。原图 2508×627（4:1），sha256 654c326e…2df7c，
 * 桌面整幅使用（左侧 0–35% 是留给网页文字的浅色区），手机取路线部分裁切（x 1050–2470，含起点到 Old market 卡）+ HTML 列表承担信息。
 * 图里的三个地点（Public square / City garden / Old market）是示例场景，不是巴黎真实地点；图旁必须可见「Illustrative route · not a real map」。
 * 不叠旧 SVG 路线与点位，不做画线动效，不沿用 OSM 署名。
 */
export const ROUTE_ILLUSTRATION = {
  src: "/images/route-illustration-1920.jpg",
  srcSet: "/images/route-illustration-1920.jpg 1920w, /images/route-illustration-2508.jpg 2508w",
  width: 2508,
  height: 627,
  mobile: { src: "/images/route-illustration-mobile.jpg", width: 1000, height: 442 },
  alt: "Illustration of a fictional city map: a dashed route runs from a start point through three example stops, a public square, a city garden and an old market. Not a real map.",
  notice: "Illustrative route · not a real map",
  /** 图里三个示例场景，按访问顺序（手机上用 HTML 列出，不依赖图中小字） */
  scenes: ["Public square", "City garden", "Old market"],
} as const;

/**
 * 旧的真实底图与点位（OpenStreetMap 瓦片 + fixture 真坐标投影）。2026-09-16 起页面不再显示（换成上面的示意插画），
 * 数据与 scripts/site-v2-static-map.mjs 保留以备回退；不能用它给插画背书。
 * 两版裁切各有一组点位百分比，由 Web Mercator 从 fixture 的真实经纬度算出（不是估的 x/y）；换底图、裁切或容器比例都要重算（scripts/site-v2-static-map.mjs）。
 * 容器用与图片相同的 aspect-ratio，让百分比精确对应。署名：© OpenStreetMap contributors（ODbL / 瓦片 CC BY-SA 2.0），页面上可见。
 */
export const MAP = {
  desktop: {
    src: "/images/map-chatelet-desktop.jpg",
    width: 1920,
    height: 480,
    /** z17，约 4:1（样张地图带 255px@1024 ≈ 358px@1440）；西边界东经 2.336970 → 东边界东经 2.357569（巴黎此处两端都是东经）；约 1.05 m / css px（1440 宽） */
    points: { you: { x: 57.92, y: 64.8 }, s1: { x: 50.44, y: 72.5 }, s2: { x: 50, y: 76.69 }, s3: { x: 59.21, y: 23.31 } },
  },
  mobile: {
    src: "/images/map-chatelet-mobile.jpg",
    width: 900,
    height: 900,
    /** z18；西边界东经 2.345804 → 东边界东经 2.350632 */
    points: { you: { x: 64.12, y: 61.34 }, s1: { x: 32.25, y: 69.56 }, s2: { x: 30.35, y: 74.02 }, s3: { x: 69.65, y: 17.09 } },
  },
  attribution: { text: "© OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright" },
} as const;

/* ------------------------------------------------------------------ */
/* Phase 2 内容                                                        */
/* ------------------------------------------------------------------ */

/** SCREEN 04 · 追问。两问两答，答案全部来自 lib/site/demo.ts 文件头核对过的事实 */
export const ASK = [
  {
    q: "Why is the tower standing on its own?",
    a: "It was the bell tower of a church, Saint-Jacques-de-la-Boucherie. The church was sold after the Revolution and pulled down in 1797. Only the tower was kept.",
  },
  {
    q: DEMO_STORY.followUp.prompt,
    a: "The very top: Saint James with his pilgrim's staff on one corner, and a lion, an ox and an eagle on the other three.",
  },
] as const;

/** SCREEN 06 · 两位导游。性格词来自 brief；代表句 = lib/site/demo.ts DEMO_COMPARE 的第一句（同一地点同一事实，两种讲法），试听只播这一句 */
export const GUIDES = [
  { id: "mia", name: "Mia", traits: ["Calm", "Observant", "Thoughtful"], image: "/images/mia-600.jpg" },
  { id: "milo", name: "Milo", traits: ["Lively", "Curious", "Straightforward"], image: "/images/milo-600.jpg" },
] as const;

export const GUIDE_LANGS = "English, 中文, Español, Français, Deutsch, 日本語, 한국어, Português";
