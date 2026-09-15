# 图片清单 · IMAGE-MANIFEST

两类图，分开登记：

- **A. 应用真实截图**（`public/images/app/`）：`scripts/shoot-app.mjs` 用无头 Chrome 拍真实应用（390×844，2 倍像素，去掉 Next 开发角标），WebP 82。官网上的产品画面全部来自这里，只裁切、不改绘（实施规格 §5）。
- **B. AI 品牌氛围图**（`public/images/`）：用户手动生成的虚构街景与角色，原图在 `assets/generated/`（不进网页）。页脚统一注明不是真实地点。例外 REAL-01 是 Commons 真实照片，需署名。

## A. 应用真实截图（2026-09-15 拍摄，本机 dev，巴黎 4 区示例坐标 48.8579, 2.3489，Mia，静音）

| 文件 | 尺寸 / 大小 | 来源页面 · 状态 | 官网用处 | 裁切（像素，2 倍图） |
|---|---|---|---|---|
| `app-home.webp` | 780×1688 · 170 KB | `/?focus=wp:Tour_Saint-Jacques`：地图 + 周边点 + 圣雅克塔地点卡（Ask the guide / View） | S03 See 的主图（容器按 780/1560 裁掉底部 tab）；Hero「Around you」live 入口 | 整屏 |
| `app-home-focus.webp` | 780×1000 · 107 KB | 同上 | Hero 展示板左块：地图下半 + 地点卡（手机上容器 780/860，只露卡片上方更少的地图） | `app-home` y 560–1560 |
| `app-place.webp` | 780×1688 · 161 KB | `/p/en/wp:Tour_Saint-Jacques`：地点页（Wikivoyage 介绍、Ask the guide、更多来源） | Hero「Place」切换（容器只露上部） | 整屏 |
| `app-talk.webp` | 780×1688 · 99 KB | `/p/en/wp:Tour_Saint-Jacques/talk`：Mia 的讲解（真实生成文本）、静音图标、AI-generated、底部追问栏 | Hero「Listen」切换 | 整屏 |
| `app-talk-top.webp` | 780×1000 · 59 KB | 同上 | Hero 展示板右块；S04 Listen 摘录上块（地点名、Mia、静音状态、完整首句及后几行） | `app-talk` y 0–1000 |
| `app-talk-ask.webp` | 780×148 · 3 KB | 同上 | S04 Listen 摘录下块（追问输入栏，是截图不是表单） | `app-talk` y 1540–1688 |
| `app-guide.webp` | 780×1688 · 60 KB | `/guide`：导游页三主入口 + 翻译 + Coming soon | Hero「Guide」切换（容器只露上部，Coming soon 组在下方被裁掉） | 整屏 |
| `app-route.webp` | 780×1247 · 见文件 | `/guide` 真实流程：点「I have an hour.」→「Make the route」→ `/api/plan` 返回的结果消息（开场白、3 站卡片、站间步行、总时长、顺序说明、Show on map） | S05 Keep Exploring 右块 | 结果消息整块（DOM 定位，上下各留 24px） |
| `app-route-map.webp` | 780×1688 · 见文件 | 上一步点「Show on map」后的首页路线模式：路线栏「Today's route · 3 stops · about 1 h」、编号图钉 1–3、顺序虚线、当前站卡片 | S05 Keep Exploring 左块（容器 780/1560 裁掉底部 tab） | 整屏 |

**路线截图对应的真实路线**（`scripts/fixtures/route-paris-1h.json`，脚本每次重拍都会覆盖记录）：2026-09-15 · Place du Châtelet（停 15 分）→ 步行 1 分 17 米 → Fontaine du Palmier（停 15 分）→ 步行 3 分 244 米 → Rue des Lombards（停 15 分）；起点到第一站 116 米；应用显示「3 stops · about 1 h」（totalMinutes 60，含缓冲）。两张图是同一条路线的两个视图；站数、距离、时长都是接口真实返回，没有手改。图注写「route order, not navigation」，应用内也注明距离按直线算。

重拍：`pnpm dev` 起好后 `node scripts/shoot-app.mjs`（全部）或 `node scripts/shoot-app.mjs --route`（只重跑路线流程）。讲解文本是模型生成，每次重拍首句可能不同；裁切区域按控件位置定，不依赖具体文字。截图里的陶土色、地图瓦片、Instrument Serif 是应用原生的，官网不换肤（规格 §2.1）。地图署名：图注与页脚写「map © OpenStreetMap contributors」。

## B. AI 品牌氛围图与真实照片

| 编号 | 用途 / 组件（2026-09-15 起） | 原图 | 网页版本 | 裁切焦点 / 位置 | 替代文本 | 状态 |
|---|---|---|---|---|---|---|
| IMG-01 | S02 The Moment 大图 `PHOTOS.hero`（原首屏图迁到这里） | `hero-img01-v1.png` 1672×941；竖版 `手机独立版.png` 1122×1402 | `hero-1672.jpg` 227 KB、`hero-1200.jpg` 129 KB（桌面 16:9 响应式）；`hero-portrait.jpg` 900×1125 176 KB（手机 4:5） | 桌面 16:9 容器 `object-position: 50% 30%`；文字在图外 | A traveler pausing to look up at an architectural detail on a sunlit street. | 已接入 |
| IMG-02 | Mia 头像：S06 Guides 72px、PlaceDemo 24px、应用内 `PersonaAvatar` | `IMG-02.png` 1254×1254 | `mia-600.jpg` 36 KB、`mia-300.jpg` 13 KB、`mia-96.jpg` 3 KB | 圆形 / 16px 圆角裁切，脸居中 | Mia, an AI guide character | 已接入 |
| IMG-03 | Milo 头像，同上 | `IMG-03.png` 1254×1254 | `milo-600.jpg` 32 KB、`milo-300.jpg` 12 KB、`milo-96.jpg` 2 KB | 同上 | Milo, an AI guide character | 已接入 |
| IMG-04a | Look `PHOTOS.look` | `IMG-04a.png` 1362×1155 | `look.jpg` 200 KB | — | A traveler looking up at a carved doorway… | 首页不再引用，文件保留 |
| IMG-04b | S05 Keep Exploring 步行情境图 `PHOTOS.walk` | `IMG-04b.png` 1448×1086 | `walk.jpg` 1200 宽 193 KB | 桌面 4:5、手机 16:9 容器，object-cover 居中 | A traveler walking away down a narrow lane… | 已接入 |
| IMG-04c | Listen `PHOTOS.listen` | `IMG-04c.png` 1448×1086 | `listen.jpg` 159 KB | — | A carved church facade and bell tower… | 首页不再引用，文件保留 |
| IMG-05 | 原路线区 `PHOTOS.square` | `IMG-05.png` 1448×1086 | `square.jpg` 224 KB | — | A small sunlit square with warm facades… | 首页不再引用（连同其上的 SVG 示意线一起删除），文件保留 |
| REAL-01 | S04 PlaceDemo 里的真实地点缩略图 `PHOTOS.demoPlace`（I01） | Wikimedia Commons `File:Tour Saint-Jacques au crépuscule.jpg`，Fabien Barrau，CC BY-SA 4.0 | `tour-saint-jacques-1280.jpg` 223 KB、`-720.jpg` 49 KB | 面板内 80×56 缩略图；页脚署名 | Tour Saint-Jacques in Paris at dusk… | 已接入（真实照片，非生成） |
| IMG-06 | S07 Real-world Break 大图 `PHOTOS.alley` | `IMG-06.png` 2048×768 | `dusk.jpg` 1920 宽 151 KB | 桌面 16:7、手机 4:5 容器，`object-position: 50% 60%`；一句字幕在图下浅色条，不压图、无渐变 | A lane at dusk with light from a doorway… | 已接入 |

接入流程：用户把生成的原图按编号放进 `assets/generated/` → Claude 用 sharp 出网页版本（JPEG 80 到 85，需要时裁切）→ 更新 `lib/site/photos.ts` 与本表 → 桌面 1440 宽和手机 375 宽各看一次文字遮挡。
