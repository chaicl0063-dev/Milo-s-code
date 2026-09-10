# ReAround You · AI 导游 App（练手项目）

线上地址：https://milo-s-code.vercel.app （推送到 main 分支后 Vercel 自动重新部署）

打开网页，看到身边 1 公里内有哪些值得了解的地方，点进去读介绍。地图来自 OpenStreetMap，地点数据来自 Wikipedia、OpenStreetMap、Wikidata 三个免费来源合并去重，中国境内可选叠加高德。全部免费、默认不需要任何 Key。第二阶段会加上 AI 讲解。

## 数据源

| 来源 | 提供什么 | Key |
|---|---|---|
| Wikipedia GeoSearch + REST | 有百科词条的地点、摘要、图片 | 不需要 |
| OpenStreetMap（Overpass） | 景点、博物馆、观景点、公共艺术、历史遗迹、宗教场所、剧院 | 不需要 |
| Wikidata | 给 OSM 的点补描述、图片、维基百科链接；也是三个来源合并去重的依据 | 不需要 |
| 高德（可选） | 中国境内的景点和博物馆，含地址、电话、开放时间 | 需要 `AMAP_KEY`，没配就跳过 |
| UNESCO 世界遗产 | 静态表 `lib/data/unesco.json`（约 8800 条，含系列遗产的组成部分），由 `node scripts/fetch-unesco.mjs` 从 Wikidata 抓；周边列表和详情页给世界遗产打标并链到官网 | 不需要 |
| Wikivoyage | 详情页「更多来源」里最近的目的地指南摘要（10 公里内，优先城市/街区条目），也喂给 AI 讲解 | 不需要 |
| TripAdvisor 论坛 | 没有开放接口，详情页只放一个「旅行者论坛观点 · 付费预览」占位，以后由 AI 检索 | 暂无 |

合并规则在 `lib/places/nearby.ts`：Wikidata 编号相同视为同一地点；否则名字归一化后相同且 120 米内视为同一地点。高德坐标是 GCJ-02，进出都在 `lib/geo.ts` 里转成 WGS-84。

地点 id 带来源前缀：`wp:Eiffel_Tower`、`osm:n123~Q243`（`~Q` 是顺带的 Wikidata 编号，Overpass 超时时退回 Wikidata）、`wd:Q243`、`amap:B0FFG...`、`unesco:Q80290`。

## 本地运行

```bash
pnpm install
pnpm dev
```

然后打开 http://localhost:3000 。固定测试用例：埃菲尔铁塔 http://localhost:3000/?lat=48.8584&lon=2.2945

如果你的网络访问 Wikipedia 需要代理，把 `.env.example` 复制为 `.env.local`，打开里面的代理四行。`pnpm dev` 走的是 `scripts/dev.mjs`，它会在 Node 启动前把这些变量放进环境（Node 的 fetch 不认系统代理）。

## 常用命令

| 命令 | 作用 |
|---|---|
| `pnpm dev` | 开发服务器，改代码自动刷新 |
| `pnpm build` | 生产构建，部署前跑一次确认没错 |
| `pnpm exec tsc --noEmit` | 只做类型检查 |
| `pnpm lint` | 代码规范检查 |

## 界面结构

- 首次进入先走「选择您的导游」：讲解语言（8 种）和受众（成人 / 儿童），然后请求定位。两项都可在「我的 → 设置」里改。
- 两个一级页面，底部 tab 切换：**身边**（首页）和**我的**（汇总入口：收藏、设置、关于）。
- 收藏：列表行和详情页的星。收藏页里每个地点可「下载离线资料」（资料 + 讲解 + 头图存 IndexedDB），下载过的从收藏进去是 `/saved` 离线阅读页，没网也能开。
- 选地面板：顶部搜索框可切「地名 / 坐标」，地名走 `/api/search`（Nominatim，配了 `AMAP_KEY` 时叠加高德输入提示）；从首页进入时有返回按钮。
- 首页顶部：搜索栏（显示当前地名到区一级，点开是选地面板）、地图 / 列表切换、范围选择、分类筛选（全部 / 收藏 / 结果里出现的分类）。地图是默认视图，图钉按距离聚合（放大到街区级散开），点图钉底部弹出带大图的卡片，可直达「听导游讲讲」或查看详情；列表视图是普通页面滚动。没有任何拖动手势。「浏览中心」和「我的位置」分开：搜索围着前者，蓝点画在后者；地图拖远后出现「搜索这一片」；右下按钮是拍照识别和回到我的位置。
- 周边列表两段加载：先要 Wikipedia 的快速结果（`/api/nearby?sources=fast`，约 1 到 2 秒），再要完整结果覆盖。
- 详情页：顶部返回 / 收藏 / 分享三个图标；标题下是坐标和折叠的「更多信息」（地址、开放时间、电话、网站，同号小字），再是文字介绍，然后「听导游讲讲」。讲解是聊天式布局（导游左侧浅底气泡带头像、用户右侧深底气泡），输入栏固定在屏幕底部。带 `?guide=1` 打开时自动开讲（地图卡片的直达按钮用）。点坐标会回首页并高亮这个地点。

## 目录

```
app/
  page.tsx                     首页（地图 + 周边列表），实际内容在 components/HomeScreen.tsx
  place/[lang]/[title]/        地点详情页，服务端渲染
  api/nearby/route.ts          GET ?lat&lon&lang&radius   周边地点（代理 Wikipedia GeoSearch）
  api/place/route.ts           GET ?lang&title            地点摘要（代理 Wikipedia REST）
  globals.css                  设计令牌：颜色、字体都在这里改
components/
  HomeScreen.tsx               首页状态：定位、坐标、范围、请求周边
  PlacesMap.tsx                Leaflet 地图（只在浏览器端渲染）
  PlaceList.tsx                周边列表
  LocatePanel.tsx              定位失败 / 换地方时的选城市面板
  LanguageProvider.tsx         en / zh 切换，存 localStorage
lib/
  wikipedia.ts                 所有 Wikipedia 请求的封装
  i18n.ts                      界面文案
  cities.ts                    备选城市坐标
  geo.ts                       距离、坐标格式化
design/                        设计稿源文件（Claude Design 画布用）
scripts/dev.mjs                开发启动器，负责把 .env.local 里的代理变量提前放进环境
```

## AI 讲解

详情页的「听导游讲讲」调 `/api/guide`，服务端把地点的事实（名字、描述、百科摘要、地址等）整理成资料卡喂给模型，用导游口吻生成 150 到 250 字的口语化介绍，流式返回，可以继续追问。界面上不再选风格，接口仍接受 `style` 参数（history / architecture / stories / kids），默认综合讲解。讲解语言可在「我的」里单独设置。

导游人物在 `lib/personas.ts`：Mia（女声，温和爱讲细节）和 Milo（男声，爽朗爱讲故事），首次引导时选，设置里可改。人物决定朗读的声音性别、系统提示里的性格说明和对话区的头像；讲解缓存键也带人物。

- 走 OpenAI 兼容接口，服务商由 `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` 三个环境变量决定，Key 只在服务端。
- 主模型被限流（429）时自动换 `LLM_FALLBACK_MODEL`；用智谱时默认退到 glm-4-flash-250414。
- 首次讲解按「语言+风格+地点」在服务实例内存里缓存，同一地方不重复花额度。
- 没有百科正文的地点，提示词会要求只做 60 到 100 字的短介绍并禁止编年代和事件，减少胡编；页面上始终显示「AI 生成，请自行核对」。
- 没配 LLM 环境变量时，详情页不显示讲解面板，其他功能不受影响。

## 「导游」tab：AI 中心

底栏三个入口：身边（地图）、导游（AI）、我的。「导游」页（`components/GuideScreen.tsx`）是一个聊天界面：导游先打招呼，下面四张快捷卡片，底部输入框。

- **随手问** `/api/ask`：不针对某个地点。服务端拿浏览中心周边 1.5 公里的 Wikipedia 快速结果当资料，流式回答。
- **帮我规划今天** `/api/plan` + `lib/plan.ts`：全靠按钮，先选时间（1 小时 / 半天 / 一天），再多选兴趣。模型只负责「从候选里挑几站并说为什么」，其余由代码兜底：
  - 候选来自 `searchNearby`，半径按预算 1 / 3 / 5 公里，按「有百科正文、有图、世界遗产、匹配兴趣」打分取前 40 个；
  - 站点顺序用最近邻重排，避免折返；步行按 80 米/分钟；一段路超过 2 公里标「公交或打车」，超过 6 公里直接丢；
  - 每站停留时间夹在 10 分钟到该档上限（25 / 60 / 90 分钟）之间，总时长超预算就从尾部截断；站数不够再就近补；
  - 模型限流或输出解析失败时按分数拼一条，结果带 `fallback: true`，界面提示「这几站是按距离挑的」。
  结果存 localStorage（`lib/routeStore.ts`），「在地图上看」回到首页：编号图钉 + 虚线 + 顶部路线栏 + 底部当前站卡片（耳机图标直达讲解），叉掉即结束。
- **拍照翻译**：相机弹层多了「这是什么 / 翻译文字」切换，`/api/identify` 加 `mode=translate`，读出原文并翻成讲解语言。
- **主题漫步、旅行日记**：只有入口，标「付费功能」，点了导游会说明尚未开放。

## 语音与拍照

- **朗读**：默认「自然音色」，即 `/api/tts` 用 `msedge-tts` 调微软 Edge「大声朗读」背后的神经网络语音（每种语言一男一女，随导游人物切换：Mia 用晓晓、Jenny 等，Milo 用云希、Guy 等；免费无 Key，但非官方签约接口，失效时前端自动退回手机自带语音）；设置里可切「手机自带」（`speechSynthesis`，离线可用）。`lib/useNarrator.ts` 按句切开逐句读、边读边预取下一句、当前句高亮；设置里有「自动朗读」开关。音频响应带一天的缓存头。
- **拍照识别**：首页地图右下的相机按钮，照片前端压到 1024 像素后发 `/api/identify`，走多模态模型（智谱时默认 `glm-4v-flash`，可用 `LLM_VISION_MODEL` 覆盖），同时把周边地点列表给模型做匹配，匹配上直接跳详情，否则用识别出的名字去搜索。照片不落盘。
- **语音提问**：追问框旁「按住说话」，录音发 `/api/transcribe`，转发到任何 OpenAI 兼容的 `/audio/transcriptions`（`ASR_BASE_URL` / `ASR_API_KEY` / `ASR_MODEL`，见 `.env.example`）。没配就不显示按钮。

## 阶段

1. **MVP（已完成）**：定位、地图、周边列表、详情、en/zh、部署 Vercel。
2. **AI 讲解（已完成）**：`/api/guide` 流式讲解、风格选择、追问、限流降级。
3. **PWA、收藏、离线、搜索、高德、拍照识别（已完成）**。
4. **语音（已完成朗读；语音提问需配 ASR 服务）**。
5. **导游人物、UNESCO / Wikivoyage 数据、开屏（已完成）**。
6. **「导游」tab：随手问、AI 行程规划、拍照翻译，主题漫步 / 旅行日记付费占位（已完成）**。以后：主动提醒、日记、论坛观点。

## PWA

- `app/manifest.ts` 生成 `/manifest.webmanifest`；图标由 `node scripts/make-icons.mjs` 从一段内联 SVG 渲染（改图标改那段 SVG 再重跑）。
- `public/sw.js` 只在线上注册（开发时不注册，免得缓存干扰热更新）。策略：页面和 `/api/*` 网络优先、失败回缓存；`/_next/static` 缓存优先；OSM 瓦片和 Wikimedia 图片缓存优先加后台更新，各有条数上限。改了 sw.js 要把里面的 `VERSION` 加一。
- 安卓 Chrome 首页会出现「安装」按钮；iPhone 只能提示手动「分享 → 添加到主屏幕」，这是 iOS 的限制。

## 部署到 Vercel

1. 把仓库推到 GitHub。
2. 在 vercel.com 用 GitHub 登录，Import 这个仓库，默认设置直接 Deploy。
3. 用手机浏览器打开 Vercel 给的 https 地址，允许定位。浏览器定位只在 https 下可用，所以本地用局域网 IP 访问拿不到定位是正常的。

线上不需要任何环境变量；第二阶段接 LLM 时再在 Vercel 后台加 `LLM_API_KEY` 等。
