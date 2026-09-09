# Around You · AI 导游 App（练手项目）

线上地址：https://milo-s-code.vercel.app （推送到 main 分支后 Vercel 自动重新部署）

打开网页，看到身边 1 公里内有哪些值得了解的地方，点进去读介绍。数据来自 Wikipedia，地图来自 OpenStreetMap，全部免费、不需要 API Key。第二阶段会加上 AI 讲解。

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

## 阶段

1. **MVP（本阶段）**：定位、地图、周边列表、详情、en/zh、部署 Vercel。
2. AI 讲解：`/api/guide` 调 LLM 流式生成导游口吻介绍，Key 放服务端。
3. PWA、Overpass 补充景点、收藏、拍照识别。
4. 以后：语音、路线、离线。

## 部署到 Vercel

1. 把仓库推到 GitHub。
2. 在 vercel.com 用 GitHub 登录，Import 这个仓库，默认设置直接 Deploy。
3. 用手机浏览器打开 Vercel 给的 https 地址，允许定位。浏览器定位只在 https 下可用，所以本地用局域网 IP 访问拿不到定位是正常的。

线上不需要任何环境变量；第二阶段接 LLM 时再在 Vercel 后台加 `LLM_API_KEY` 等。
