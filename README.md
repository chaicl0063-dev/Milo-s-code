# Around You · AI 导游 App（练手项目）

线上地址：https://milo-s-code.vercel.app （推送到 main 分支后 Vercel 自动重新部署）

打开网页，看到身边 1 公里内有哪些值得了解的地方，点进去读介绍。地图来自 OpenStreetMap，地点数据来自 Wikipedia、OpenStreetMap、Wikidata 三个免费来源合并去重，中国境内可选叠加高德。全部免费、默认不需要任何 Key。第二阶段会加上 AI 讲解。

## 数据源

| 来源 | 提供什么 | Key |
|---|---|---|
| Wikipedia GeoSearch + REST | 有百科词条的地点、摘要、图片 | 不需要 |
| OpenStreetMap（Overpass） | 景点、博物馆、观景点、公共艺术、历史遗迹、宗教场所、剧院 | 不需要 |
| Wikidata | 给 OSM 的点补描述、图片、维基百科链接；也是三个来源合并去重的依据 | 不需要 |
| 高德（可选） | 中国境内的景点和博物馆，含地址、电话、开放时间 | 需要 `AMAP_KEY`，没配就跳过 |

合并规则在 `lib/places/nearby.ts`：Wikidata 编号相同视为同一地点；否则名字归一化后相同且 120 米内视为同一地点。高德坐标是 GCJ-02，进出都在 `lib/geo.ts` 里转成 WGS-84。

地点 id 带来源前缀：`wp:Eiffel_Tower`、`osm:n123~Q243`（`~Q` 是顺带的 Wikidata 编号，Overpass 超时时退回 Wikidata）、`wd:Q243`、`amap:B0FFG...`。

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

详情页的「听导游讲讲」调 `/api/guide`，服务端把地点的事实（名字、描述、百科摘要、地址等）整理成资料卡喂给模型，用导游口吻生成 150 到 250 字的口语化介绍，流式返回；可选四种风格（历史、建筑、趣闻、讲给孩子），可以继续追问。

- 走 OpenAI 兼容接口，服务商由 `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` 三个环境变量决定，Key 只在服务端。
- 主模型被限流（429）时自动换 `LLM_FALLBACK_MODEL`；用智谱时默认退到 glm-4-flash-250414。
- 首次讲解按「语言+风格+地点」在服务实例内存里缓存，同一地方不重复花额度。
- 没有百科正文的地点，提示词会要求只做 60 到 100 字的短介绍并禁止编年代和事件，减少胡编；页面上始终显示「AI 生成，请自行核对」。
- 没配 LLM 环境变量时，详情页不显示讲解面板，其他功能不受影响。

## 阶段

1. **MVP（已完成）**：定位、地图、周边列表、详情、en/zh、部署 Vercel。
2. **AI 讲解（已完成）**：`/api/guide` 流式讲解、风格选择、追问、限流降级。
3. PWA、收藏、拍照识别、高德 Key 接入。
4. 以后：语音、路线、离线。

## 部署到 Vercel

1. 把仓库推到 GitHub。
2. 在 vercel.com 用 GitHub 登录，Import 这个仓库，默认设置直接 Deploy。
3. 用手机浏览器打开 Vercel 给的 https 地址，允许定位。浏览器定位只在 https 下可用，所以本地用局域网 IP 访问拿不到定位是正常的。

线上不需要任何环境变量；第二阶段接 LLM 时再在 Vercel 后台加 `LLM_API_KEY` 等。
