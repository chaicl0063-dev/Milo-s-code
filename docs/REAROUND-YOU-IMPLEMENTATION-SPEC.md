# ReAround You — Implementation Spec

**状态：FROZEN · 设计方向已冻结，可交 Claude 开始执行**  
版本：1.0 · 2026-09-15  
目标分支：`company`  
本轮角色：GPT Work 决策与 QA；Claude 前端实现。

## 0. 执行结论与依据

本轮官网采用 **Light Tech / Clear / Urban / Human / Product-first**：冷浅灰背景、青蓝单一交互强调色、Manrope、细边框、轻阴影；产品 UI 解释能力，摄影提供城市情境。

**只改现有官网的呈现与编排。9 个 Section 一对一调整，不新增 Section、页面或产品功能。** 最终顺序：Hero → The Moment → See → Listen → Keep Exploring → Guides → Real-world Break → Free / Plus → Final CTA。

依据与优先顺序：

1. 用户本次明确指令：以正式简报、company 源码、已有清单和真实产品能力完成冻结；线上视觉验证后移至第一轮实现后的 QA。
2. `C:/Users/chaic/Downloads/REAROUND-YOU-LAUNCH-DESIGN-BRIEF.md`，标题「ReAround You 官网快速上线设计需求 v1」。SHA-256：`1E3EEF1AC6859A771463C4B1FDDF13AFB09C518D2723185260712486812A5152`。
3. `D:/AI_Projects/tourguide`，当前 `company`，HEAD `eede8ca`，提交说明 `docs: next-session starting point on company branch`；检查时工作区干净。与前次清单的 `1c93213` 相比，仅 `docs/COLLABORATION.md` 新增 8 行，源码落点仍有效。
4. `docs/PRODUCT-BRIEF.md` 的产品定义、人格、功能状态与技术事实；当前源码与本机现有产品截图。旧产品文档中的历史官网布局不再作为本轮视觉要求。

本 spec 取代旧 `DESIGN.md` 中本轮相冲突的官网规则，也关闭旧协作记录第 21/22 节的「首屏待通过 / 陶土还是深青待定 / 继续探索设计」事项。保留产品事实与原有功能边界。

**Blocking 状态：B01 已解除；B02 按用户指令移至实现后 QA，不阻塞设计冻结。当前没有需要用户再次选择的设计分叉。** 本文件不宣称已完成线上视觉验证，也不授予新的生产部署权限。

---

## 1. 9 个 Section 的一对一映射

下表源码位置均相对 `D:/AI_Projects/tourguide`，行号是本轮基线的定位提示，修改后以 Section id / 组件名为准。

- **KEEP**：保留现有内容或能力，仅应用统一样式。
- **MODIFY**：保留任务与能力，修改文案、布局或视觉。
- **REPLACE**：在已有 Section 内替换展示内容或结构，不增加产品能力。
- **REMOVE**：删除该行明确列出的旧内容，不表示增加或删减 Section 数量。

| 最终顺序 | 原区块 → 新区块 | 主动作 | 源码 / 组件 | 明确删除的旧内容 |
|---|---|---|---|---|
| 01 | 原 S01 Hero → **Hero** | MODIFY | `components/site/SiteLanding.tsx:88`，`HeroProduct.tsx`；保留 `#top` | REMOVE 重手机外壳、长投影、首屏「Any city, in your language」尾句及重复 Android 宣传；不删除现有进入真实应用的能力 |
| 02 | 原 S05 Look / Walk / Listen 图组 → **The Moment** | REPLACE + 移位 | `SiteLanding.tsx:223`；该 section 移到 Hero 后，设 `#moment`；`PHOTOS.hero` | REMOVE 三图拼组、Look/Walk/Listen 三套重复功能文案；品牌句只保留在这里 |
| 03 | 原 S03 How it works → **See** | REPLACE | `SiteLanding.tsx:146`；保留 `#how`，真实 `HomeScreen` 截图 | REMOVE 三列步骤卡、「Three seconds…」、餐饮句与泛化覆盖承诺 |
| 04 | 原 S02 Hear a story → **Listen** | MODIFY + 移位 | `SiteLanding.tsx:120`；移至 See 后，保留 `#demo`；`PlaceDemo.tsx` + 真实 `TalkScreen` 截图 | REMOVE 原品牌大图、`pt-28` 与负 margin 的叠压结构、玻璃背景和重阴影 |
| 05 | 原 S04 路线情境 → **Keep Exploring** | REPLACE | `SiteLanding.tsx:171`；设 `#explore`；真实 `GuideScreen` / `HomeScreen` 路线截图 + `PHOTOS.walk` | REMOVE 照片上装饰 SVG 路线、写死的「4 stops · 2.1 km · about 2 hours」、旧两小时示例对话与 Plan my day 文案 |
| 06 | 原 S06 双导游 → **Guides** | MODIFY；试听与选择 KEEP | `SiteLanding.tsx:247`，`GuideCompare.tsx`；保留 `#guides` | REMOVE 双人物品牌主色、Team Member 式视觉主导；保留两位人格与声音 |
| 07 | 原 S07 傍晚情境 → **Real-world Break** | MODIFY | `SiteLanding.tsx:261`；设 `#real-world`；`PHOTOS.alley` | REMOVE Naples 定位语录与长方向性文字、整屏渐变蒙层 |
| 08 | 原 S08 Free / Plus → **Free / Plus** | MODIFY；登记能力 KEEP | `SiteLanding.tsx:276`；保留 `#plus` 与 `submitEmail` | REMOVE 强定价对战、Plus 粗边和突出角标、未来功能长清单；不删除已有邮箱登记 |
| 09 | 原 S09 Download → **Final CTA** | MODIFY | `SiteLanding.tsx:346`；保留 `#download` | REMOVE 深色大底与长功能解释；现有 APK 条件入口保留为低权重辅助信息 |

**原区块使用顺序为：1 → 5 → 3 → 2 → 4 → 6 → 7 → 8 → 9。每个原 section 恰好使用一次。** 顶栏、页脚在这 9 个之外继续保留，不另起「How it works 总览」「功能一览」或「路线 Demo」区块。新增锚点名称不等于新增 Section。

---

## 2. Visual tokens — 冻结值

### 2.1 颜色与作用域

只改变**官网外壳及现有官网演示组件**。颜色继续集中于 `lib/site/theme.ts`，不改变 `app/globals.css` 的应用全局变量。

| Token / 现有 T 字段 | 冻结值 | 用途 |
|---|---|---|
| `T.bg` | `#F7F8FA` | 官网主背景 |
| `T.white` | `#FFFFFF` | 产品展示面、表单、选择面板 |
| `T.paper` | `#EEF2F6` | 次级面、轻分组 |
| `T.ink` | `#171717` | 标题、正文、深色图标 |
| `T.muted` | `#5E6673` | 次级文字、说明 |
| `T.line` | `#DDE3EB` | 1px 细边线 |
| `T.accent` | **`#167C80`** | 唯一主交互色：主要 CTA、播放、选中、链接 |
| `T.deep` | `#116367` | 同色系 hover / active，不是第二强调色 |
| `T.accentSoft` | `#E7F3F3` | 当前句与选中项浅底 |
| `T.focus` | `#167C80` | 键盘 focus ring，2px + 3px offset |
| `T.dark` / `T.onDark` | `#171717` / `#FFFFFF` | 仅兼容小控件及需用到的照片字幕；不建立深色 Section |
| `T.gold` / `T.teal` | 兼容别名，均等于 `T.accent` 的色值 | 防止仍引用它们的官网组件出现第二套高饱和色；改动组件优先直接用 accent |

冻结选择青蓝 `#167C80`，不再比较 Blue / Cyan / Teal 方案。该值来自正式简报建议，白字与其对比约 4.97:1，在主底上用作文字约 4.67:1；次级文字与主底约 5.45:1（按 sRGB 相对亮度计算）。

**真实 App UI 保持原生颜色与字体。** 截图、iframe 内已有陶土色、地图瓦片、人物和摄影色彩属于被展示的产品与内容，不是官网第二套交互 token。不得为了消除截图里的暖色而全局换肤、给截图套滤镜、改绘地图定位点或重画按钮。官网也不额外叠一组装饰地图点。

删除官网组件内硬编码的陶土高亮、芥末黄、暖棕正文、暖色透明叠层；字幕若需要底色，采用纯色浅底字幕条，不用渐变。`LegalPage` 共享 T，因此纳入样式回归，但法律文本、品牌信息不改。

### 2.2 字体、尺寸、间距

| 项目 | Desktop ≥1024px | Mobile <768px |
|---|---|---|
| 字体 | 已加载的 **Manrope**；fallback `Segoe UI, system-ui, sans-serif` | 同左，不加载新字体 |
| Hero h1 | 56px / 1.08，600，letter-spacing -0.025em | 36px / 1.1，600，-0.025em |
| S02—S07 h2 | 40px / 1.12，600，-0.02em | 30px / 1.15，600，-0.02em |
| S08 h2 | 28px / 1.2，600 | 24px / 1.2，600 |
| S09 h2 | 40px / 1.12，600 | 30px / 1.15，600 |
| Lead | 18px / 1.6，400，≤48ch | 16px / 1.6，400 |
| 正文 | 16px / 1.6，400 | 同左 |
| 编号 / 小标签 | 12px / 1.3，600，0.06em | 同左 |
| 辅助文案 / 状态 | 13px / 1.5 | 同左 |
| 容器 | max-width 1200px，左右 32px | 左右 20px |
| Hero 上 / 下留白 | 48 / 64px | 24 / 48px |
| S02—S07 垂直内边距 | 每侧 64px | 每侧 40px |
| S08 垂直内边距 | 每侧 40px | 每侧 32px |
| S09 垂直内边距 | 每侧 64px | 每侧 48px |
| 双列 gap | 48px；Listen 可用 32px | 单列 gap 24px |
| 内部间距阶梯 | 8 / 12 / 16 / 24 / 32px | 同左 |

768—1023px：使用单列平板布局，内容最大 720px，左右 32px，h1 44px、h2 36px。不是把双列硬挤进平板。

本轮官网所有 HTML 标题均使用 Manrope；**不启用新的 Serif 情绪标题**。Instrument Serif 继续留在未改的真实应用界面中。允许的 Serif 不等于本轮必须使用。Hero 使用 `text-wrap: balance`，不通过空格或多套文案强行断行；不为追求两行牺牲字号可读性。

### 2.3 形状、控件、动效

- 图片 / 卡片 / 展示面：20px 圆角，1px `T.line`；小型输入框 12px；按钮 pill。
- 主按钮：48px 高、左右 24px、15px/600、accent 底白字；hover deep。辅助按钮：48px 高，white 底、line 边、ink 字。试听等紧凑按钮不得小于 44px 点击高度。
- 阴影唯一值：`0 2px 8px rgba(23,23,23,0.04)`；普通内容默认无阴影。删除 20—60px 的明显漂浮阴影。
- 导航：64px 高，sticky，**不透明 bg 底 + 1px 底边**；移除 backdrop blur / 半透明玻璃效果。手机仍只显示品牌、Beta 与 Open。
- Hero：一次 opacity 0→1，360ms ease-out；无位移。其他区块可用一次 opacity reveal，300ms；不强制加入 reveal，不引入库。
- 小状态反馈：颜色 / opacity 160ms。只有真实播放时才能显示播放动画；截图永远为静态示例，不伪装成实时声音。
- `prefers-reduced-motion: reduce`：取消入场和持续动画，内容与状态文字立即可见；无脚本或动画失败时不能留下透明内容。
- 不使用渐变、Aurora、glow、玻璃拟态、3D 手机、WebGL、parallax、scroll-jacking、浮动装饰和重型动效库。锚点用普通跳转，`scroll-margin-top: 80px`，不遮住标题。

---

## 3. 各屏最终实现

### 01 — Hero · `#top`

**文案冻结：**

- Label：`AI LOCAL GUIDE`。Beta 留在导航，不把两层标签堆到标题上。
- H1：`Understand the place you're standing in.`
- Subtitle：`See what's around you, hear the story behind it, ask questions, and keep exploring.`
- Primary CTA：`Try your local guide` → 原 `appUrl`。
- Secondary CTA：`See how it works` → 原 `#how`，落在 See。
- 按钮下小字：`Free beta in your browser. No account needed.`

**产品画面：** MODIFY `HeroProduct`。默认从原 Place 单屏改为 **Around you 选中态**，在该状态中展示同一地点的两个真实 App 视图摘录：上部地图与圣雅克塔地点卡，下部 Mia 讲解首句和原生静音状态。它是官网展示板，**不是一张声称产品里存在的合成屏幕**。

具体边界：

1. 使用现有 `app-home.webp`、`app-talk.webp` 或清理后重新拍摄的同名真实截图。仅裁切、排版；保留地图、选中地点、`Tour Saint-Jacques`、原生 `Ask the guide`、Mia、实际首句与静音图标。
2. 两个截图摘录以细边界分开；注明 `App views · Tour Saint-Jacques, Paris · sample`。不得把它们拼成同一手机屏中的新控件布局。
3. 展示板外有次级文本链接 `Hear the story` → `#demo`。这是官网入口，不覆盖或伪造截图内按钮，也不把原生 `Ask the guide` 擅改成截图文字。
4. 地图和地点卡可从同一真实截图分别裁取，以缩短纯地图空白；展示归属必须清楚，原生文本不能被裁半。Mia 摘录只显示顶部、完整首句、声音状态，避免塞入长篇全文。必要的地图署名在图旁补回。
5. 保留原有四个切换项 Around you / Place / Listen / Guide；**不加第五个标签**。后面三个仍展示对应真实视图；非当前截图不同时下载大图。默认状态无需点击即满足上面七项产品识别信息。
6. 保留 `Try it live`、`Back to screens` 和既有 iframe 入口，位置在展示板下方，不覆盖地点名称。仅用户点击后加载 iframe。实时模式恢复可操作的真实视口，不能套用截图裁切隐藏真实控件。进入 live 前调用现有 `speech.stop()` 停止官网样本试听；不开发新的跨窗口音频协议。

**Desktop：** 文案 / 产品为 44:56 的双列（扣除 gap 后分配），展示板约 500—600px 宽、默认约 420—480px 高，去掉厚黑手机壳。地图/卡片占上部约 2/3，讲解摘录占下部约 1/3。主 CTA 与产品画面同时在 1280×800 首个视口可见。

**Mobile：** label → h1 → subtitle → 两个 CTA → 小字 → 产品板。两个 CTA 可同排，放不下则自然换行，不加中间摄影。产品板宽度为容器全宽，默认约 300—340px 高；先见地图和地点名，再见讲解。375×812 首个视口必须出现地图及地点名，向下不超过约半屏可看到完整讲解摘录。截图不能缩到原生关键文字无法辨认；裁掉无关留白，不用 scale 把整张 844px 高手机缩成缩略图。

### 02 — The Moment · `#moment`

- H2：`You're already here. Now let's look around.`
- 唯一短正文：`You look up at a place you don't know. Start there.`
- 使用 `PHOTOS.hero`，桌面 `hero-1672.jpg` / `hero-1200.jpg` 响应式资源，手机 `hero-portrait.jpg`。
- 由原三图组替换为一张大图；旧 S02 的这张品牌照片迁入这里，不在 Listen 再重复。`PHOTOS.look` / `listen` 暂停在首页使用，不删除原始资产。
- Desktop：标题与短句在图上方，图片 16:9，容器内满宽；Mobile：标题在前，图片 4:5。文字不覆盖人物 / 建筑，默认放在图片外。
- 无 CTA、无产品控件、无第三段解释。此屏承担首次大面积旅行氛围。

### 03 — See · `#how`

- Label：`01 SEE`。
- H2：`What's that building?`
- 正文：`Find a place on the map. Tap it to ask your guide.`
- 原三列步骤全部移除，替换为地图与已选地点卡的真实 UI；仍是原 `#how` 一屏。
- UI 来源：`HomeScreen` → `PlacesMap` / `PlaceCard`。展示周边点、示例位置、一个已选地点、地点名与真实开讲入口。截图中位置属于演示巴黎区域；图注 `App view · Paris · sample location`，不能暗示已经定位到官网访问者。
- 复用 `app-home.webp`；重新拍摄时可以调整地图缩放和展开真实地点卡，让位置标记与周边点可见，不能加画一个不存在的定位控件。用网站外部 caption 区别示例位置与用户位置。
- 既有三步区没有独立 CTA，本轮不增加新地图交互。截图中的控件不响应；Hero 的 live 与主应用入口负责真实操作。该屏的职责是清楚展示路径，不再开发第二套网页地图。
- Desktop：左文字 40%，右地图/地点 UI 60%；Mobile：label、标题、正文、地图，再紧邻地点卡。可分裁切，但始终指向同一处，地点卡关键文字至少接近正常 14px 阅读尺寸。

### 04 — Listen · `#demo`

- Label：`02 LISTEN`。
- H2：`Hear the story behind it.`
- 正文：`Listen to Mia, then ask about what caught your eye.`
- 两种真实复用同时保留：**实际 App 讲解页截图说明自由追问能力；现有 PlaceDemo 提供可操作试听。** 不为官网增加真实聊天接口。
- App 画面来自 `TalkScreen`：地点名、Mia、短讲解、真实静音状态、底部提问输入框。可把顶部/首句与底部输入区域作为两个注明来源的截图片段排在一个展示框内，中间用留白分隔；不要挪字重绘成新 App 屏。图注 `App view · sound off in this screenshot`。图片内提问框不是 HTML 表单，不伪装可输入。
- `PlaceDemo` 保留地点资料、原 `DEMO_STORY`、固定追问、音频状态和应用链接。把外壳改为正常文档流的白底 1px 边框，去掉负 margin、额外顶部垫高与 blur。
- 初始展示在播放按钮前直接可读的 `DEMO_STORY.story.sentences[0]`，标为样本首句；点击后仍按原步骤播放完整脚本并显示原跟读内容，初始首句不再重复显示。该调整只影响样本可读性，不新增问题或生成逻辑。
- 试听按钮展示名统一为 `Hear the story`，仍调用原 `hearStory`；可仅修改展示文字，不改脚本事实。`Scripted demo`、用户点击才发声、失败时可读文字必须保留。
- 保留既有 `What should I look for?` 固定追问；自由提问继续发生在真实 App。现有 `Open this place in the app` / `Try it on your own street` 的出现条件和目标保留。
- Desktop：左侧标题、短句与 PlaceDemo（约 56%）；右侧实际讲解 UI 摘录（约 44%）。Mobile：标题、短句、可读的 App UI 摘录（含输入框与声音状态），随后紧凑 PlaceDemo。不要在手机上堆两台完整手机长截图。
- Listen 使用 40px / 30px 标题、充足产品展示面积；Keep Exploring 的产品图与文字总量不得反过来压过这一屏。

### 05 — Keep Exploring · `#explore`

- Label：`03 KEEP EXPLORING`。
- H2：`An hour to wander?`
- 正文：`Find a short walk with places to stop along the way.`
- 原 `Plan my day` 链接位置保留，改为 `Open the guide` → `${appBase}/guide`。只打开现有 Guide 页面，由用户点击现有 `I have an hour.`；不新增自动生成路线参数，不暗示在官网点击即可生成。
- 图片组合：**一份真实一小时路线结果 + 同一份路线在真实地图上的编号顺序 + `PHOTOS.walk` 环境图**。不能继续使用旧照片上的 SVG 装饰线或两个小时写死数字。
- 当前 `app-guide.webp` 是入口页，不能冒充已生成路线；`app-home.webp` 的黑色聚合数字也不能冒充路线站号。
- Claude 从既有 Guide 流程点击 `I have an hour.`，生成一次真实结果，使用原 `showOnMap` 打开同一条路线，拍下真实结果与地图。源码落点：`components/GuideScreen.tsx` 的路线结果 / `StopCard` / `showOnMap`；`lib/routeStore.ts`；`HomeScreen` 的 `route=1` 展示；`PlacesMap` 的 `route.stops`。
- 新截图文件限定为 `public/images/app/app-route.webp`、`app-route-map.webp`；这是已有能力的官网素材，不是新组件能力。记录捕获日期、地点、站点、总时长和同一路线对应关系。不能编造站数、坐标、距离或虚构「恰好 60 分钟」；标题表示一小时预算，实际时长使用真实结果。
- 图注：`Example one-hour walk · route order, not navigation`。保留地图来源说明；不把直线/顺序示意当道路导航。
- Desktop：左产品约 60%（地图与路线卡放同一展示组），右约 40% 为标题、短句和一张步行照片；图片区不高于 Listen 的主要 UI 展示。Mobile：标题、正文 → 地图+路线卡 → 16:9 步行摄影 → 文本链接。照片不遮路线信息。
- 首次打开官网不生成路线、不挂第二份 Leaflet、不加载运行中路线组件。使用静态实拍。若截图阶段因服务失败暂时拿不到，列为实现未完成项并重试现有功能；不以造数据、画假图或开发新路线模块补缺口。

### 06 — Guides · `#guides`

- H2：`Choose who's walking with you.`
- `GuideCompare` 保留 `PERSONAS`、`DEMO_COMPARE`、角色事实和既有试听流程。Mia / Milo 的肖像继续用 `/images/mia-300.jpg`、`/images/milo-300.jpg`，不换人设、不重生图。
- 展示为 **声音选择面板**：每一行的重心是姓名、简短风格说明、播放键与状态；72px 肖像做识别，不把大半张面板留给照片。两段试听文本保留，字号 15—16px。
- 两位的交互统一用 accent；不再 Mia 橙 / Milo 深青。选中项用 accentSoft 底、2px accent 边、文字勾选共同表达。
- 原 `state.key === id` 是当前试听对象，不是已持久化的 App 导游选择。旁边的文字改为 `Preview selected`，不可声称已经替用户更换应用偏好。`Start with Mia` / `Start with Milo` 保留，点击后仍通过原 `?persona=` 进入应用。
- 两个 Start 链接用低权重边框按钮，不在每张面板重复一个高饱和主 CTA。实际播放、暂停、恢复、停止、重播、错误、实际时长照旧；未取得时长不写虚假「15 sec」。
- Desktop：两个宽面板并排，面板内部是紧凑横向头像 / 名称与音频动作，下面跟文本。Mobile：两面板纵向排列，不做横向滑动或隐藏第二位。
- 保留八种讲解语言说明一行，可自然换行，不加国旗、语种筛选或第三位导游。

### 07 — Real-world Break · `#real-world`

- 唯一文案：`Look up. There's more around you than you think.`
- 使用现有 `PHOTOS.alley` / `dusk.jpg`，延续夜晚街巷和人物情境；它是已有 AI 品牌图，不描述为某座真实城市的实拍。
- Desktop：max-width 1440px、左右至少 20px、图像约 16:7；Mobile：4:5，保留行人/街巷，不把焦点裁出。
- 一句字幕放图片下方同容器的浅色字幕条，字 28px / 24px；没有标题、副题、引语作者和 CTA 的第二层叙事。不用大面积深色底或渐变压图。
- 删除旧 Naples 署名和 directions。无需为「大城市」再开一轮找图；当前城市街巷摄影语言已满足节奏转换职责。

### 08 — Free / Plus · `#plus`

- 小标题：`Free during beta. Plus is coming later.`
- Desktop：一个低对比度容器内 Free 60% / Plus 40%，1px 竖分隔；Mobile：Free 在前、Plus 在后，1px 横分隔。整体字号、留白和边框弱于核心三屏，不用大价格、推荐徽章或对战卡。
- Free 标签：`Free beta`。说明：`No account needed.`。只保留下列四项，作为选择性的现有能力摘要，不表示删掉 App 其他免费能力：
  - `Places around you`
  - `Stories and follow-up questions`
  - `One-hour walking routes`
  - `Favorites and offline reading`
- 保留原 `Open in browser` → appUrl，使用文本/边框低权重样式。
- Plus 标签：`Plus` + `Coming soon`。唯一价值说明：`Save, adjust and pick up longer routes across days.`。可保留小字 `Price to be announced`，不写价格、不写永久免费。
- 删除官网 Plus 里的旅行者观点、主题漫步、日记长清单；这是减少本页宣传，不改商业模式或产品内预告。
- 保留现有邮箱表单与 `Get notified`，`submitEmail`、POST 目标、校验、sending / done / error、重试文案全部沿用。给输入框补明确可访问名称 `Email address`；不是新增字段或新的用户收集流程。
- 不把普通问答变成付费能力，不在本轮接入登录、支付、订阅或路线编辑。

### 09 — Final CTA · `#download`

- H2：`Start with the street you're on.`
- 主 CTA：`Try your local guide` → appUrl。
- 视觉：bg 浅色区、white 展示面、1px line。Desktop 左标题右按钮，Mobile 标题后主按钮；无新功能介绍、无新大图、无深色结尾。
- 现有 Android 条件入口保留在主 CTA 下方低权重一行：有 `apkUrl` 时显示 `Download Android beta` 和原版本信息；无配置时显示不可点击的 `Android beta · coming soon`。保留下载属性及现有环境变量判断。
- 只有存在下载链接时才显示已有必要说明：版本（如有）、Android 7.0+、需要联网。不要为了配齐文案开发或打包 Android，不把 Android 变成 Web 体验前置。
- 删除旧长段 PWA / 远程加载说明，不改产品能力。

---

## 4. 顶栏、页脚与入口合同

顶栏 KEEP：桌面保留 `How it works` → `#how`、`Guides` → `#guides`、`Plus` → `#plus` 与 `Open the app`；手机品牌 / Beta / `Open`。不增加目录项。Beta 与品牌内容取现有值。

页脚 KEEP：Privacy、Terms、Send feedback、联系邮箱、运营主体、来源说明和图片署名。只应用新色值与间距，不修改运营主体、域名、邮箱或法律文案。

| 入口 | 最终目标 / 行为 | 实施边界 |
|---|---|---|
| Hero / Final 主 CTA；顶栏 Open；Free Open | 原 `appUrl` | 不强制跳特定城市、自动定位或自动开始路线 |
| Hero See how it works | `#how` | 指向最终 See，旧锚点保持可达 |
| Hero Hear the story | `#demo` | 指向最终 Listen，普通页内锚点 |
| Hero 四屏 live | 沿用原 SCREENS 四条真实 App 路由 | 不新增路由或接口；Around 的既有 focus 演示可同时带已支持的巴黎 lat/lon，见下文 |
| PlaceDemo 应用入口 | `${appBase}${DEMO_PLACE.appPath}` 与原 appUrl | 保留同地点资料入口和原步骤条件；不改成假网页聊天 |
| Keep Exploring 原文本 CTA | `${appBase}/guide` | 只打开现有 Guide，无自动生成承诺 |
| GuideCompare 两个 Start | `${appBase}/?persona=mia` / `milo` | 保留真实偏好传递，不由试听自动改 App 偏好 |
| 邮箱登记 | `${appBase}/api/signup` | payload / 校验 / 状态逻辑不改 |
| Android | 原 apkUrl | 原配置条件、download 行为不改 |
| 法律 / 反馈 | 原 BRAND 路径与 feedbackMailto | 不重建表单或法律页面 |

`appBase = appUrl.replace(/\/$/, "")`，保持现有拼接约定；本地相对 `/` 和独立 App 域名两种配置均要检查。Hero Around 真实示例入口若原路径只有 `focus`，在**该展示入口**使用已有支持的 `lat=48.8579&lon=2.3489&focus=wp%3ATour_Saint-Jacques`，坐标来自现有 `scripts/shoot-app.mjs`，明确是 Paris sample；不改 HomeScreen 参数处理，不把这组示例坐标套到主 CTA。

---

## 5. 真实 App UI / 资产复用合同

### 5.1 复用层级

1. **截图**：官网 Hero / See / Listen / Explore 复用真实 App 的已渲染状态；裁切可减少无关控件，不得改写事实或添加不存在按钮。
2. **现有官网组件**：PlaceDemo 和 GuideCompare 保留原交互，换布局、颜色及本 spec 明确的展示文案。`useScriptedSpeech` 继续由 SiteLanding 创建单一实例并传给两者，保持试听互斥。
3. **现有真实 iframe**：只保留 Hero 已有 live 模式，不在其他 Section 再挂 HomeScreen、TalkScreen、GuideScreen 或 iframe。
4. **产品代码只作来源**：不把有定位、存储、地图、音频副作用的屏幕组件直接挂进营销页，也不为截屏重构业务组件。

### 5.2 素材清单

| 素材 | 使用处 | 本轮动作 |
|---|---|---|
| `app-home.webp` | Hero Around / See | KEEP 内容来源，按需要重新拍摄干净状态或做显示裁切；不可把聚合点当路线 |
| `app-place.webp` | Hero Place 切换 | KEEP；仅清理开发标识和 framing |
| `app-talk.webp` | Hero Mia 摘录 / Listen | KEEP 内容来源；选择真实短句与静音/输入区域，保持可读性 |
| `app-guide.webp` | Hero Guide 切换 | KEEP；可以裁去下方未来功能，以显示现有核心入口，不能冒充生成结果 |
| `app-route.webp` / `app-route-map.webp` | Keep Exploring | 从已有一小时功能新拍素材；同一路线与实际状态一致 |
| `PHOTOS.hero` | The Moment | MOVE；复用已有人物/街景与手机独立版本 |
| `PHOTOS.walk` | Keep Exploring | KEEP；城市步行情境，不声称与路线相同地点 |
| `PHOTOS.alley` | Real-world Break | KEEP；不添加真实城市地点归属 |
| `PHOTOS.demoPlace` | PlaceDemo 真实地点小图 | KEEP；Commons 署名与许可保留 |
| Mia / Milo 肖像 | Guides / 现有 Demo | KEEP；不改角色定位 |
| `PHOTOS.square`、`look`、`listen` | 原路线 / 三图 | REMOVE 首页引用，原文件留存，不进行无关资产清理 |

本机现有 App 截图带开发环境的 Next 标识。Claude 优先在已有生产模式预览中重拍去除；也可裁掉与核心操作无关的角落，但不能擦画遮住控件或把重要输入文字一起裁掉。既有 `scripts/shoot-app.mjs` 是素材流程线索，不是要求绕过执行环境的浏览器规则；使用当前环境允许的截图方式。

摄影主要限于 S02 / S05 / S07，产品中的真实地点缩略图和导游头像不算额外氛围摄影。已有大幅场景为 AI 品牌图，必须继续保留页脚说明；不写「实拍巴黎 / 那不勒斯」。本轮不找新参考、不批量生图、不把真实地图交给生图工具。

### 5.3 资源与性能

- 新/重拍截图用 WebP，通常 2× 显示尺寸；按实际展示裁切导出，避免下载整张超长图后只显示一行。
- 默认 Hero 只优先加载当前可见的地图/讲解摘录，不预载四套完整屏幕；其余选择后再加载。截图长边无需超过真实使用尺寸的 2×。
- 单张新增 UI 图目标 ≤250KB；若可读性需要超出，记录实际尺寸与原因，不为了机械达标损坏文字。不要增加自动视频或大原始 PNG。
- S02 以后图片 lazy-load，设置 width/height 或 aspect-ratio，避免载入时跳动；Hero 产品图按首屏资源优先加载。
- 静态看官网不应请求定位、生成讲解或生成路线。保留 TTS / 邮箱原来的用户触发请求，禁止新增分析埋点或服务。

---

## 6. 修改文件清单与禁止范围

### 6.1 Claude 实施文件

| 文件 / 路径 | 操作 |
|---|---|
| `components/site/SiteLanding.tsx` | 9 区块重排、冻结文案、响应式、锚点、全站浅色外壳；保留表单和现有配置 |
| `components/site/HeroProduct.tsx` | 默认地图+讲解真实摘录、四屏切换呈现、去重手机框；保留 live 入口和路由 |
| `components/site/PlaceDemo.tsx` | 正常文档流、tokens、可读首句和按钮展示名；保留步骤、音频、追问与链接 |
| `components/site/GuideCompare.tsx` | Voice selection 排版、统一交互色、Preview selected 文案、响应式；保留试听与 persona 链接 |
| `lib/site/theme.ts` | 写入本 spec 冻结 tokens，保留必要兼容字段 |
| `lib/site/photos.ts` | 仅按新槽位更新使用说明或已有资源规格；不篡改来源与 generated 标记 |
| `public/images/app/` | 干净真实截图和两个路线截图；仅必要新增/替换资产 |
| `app/site/page.tsx` | 官网 metadata 对齐：title `ReAround You · AI local guide`；description 使用 Hero subtitle；原配置传递不改 |
| `DESIGN.md` | 更新为本轮已冻结系统，明确旧暖色官网、强设备壳与深色 Final CTA 不再适用 |
| `docs/IMAGE-MANIFEST.md` | 记录截图来源、日期、尺寸、裁切、路线同源关系；区分 App 截图与 AI 氛围图 |
| `docs/COLLABORATION.md` | 追加本轮冻结依据、实施提交、验证状态，旧待定事项标被本 spec 覆盖，不抹掉历史 |
| `docs/REAROUND-YOU-IMPLEMENTATION-SPEC.md` | 将本最终文件放入仓库，供 Claude 与后续 QA 共用 |

若需要抽一个**纯展示**截图容器，可在 `components/site/` 内做最小辅助组件；它不增加 Section、页面、状态业务或依赖。优先在现有文件完成，不把本轮变成组件库重建。

`LegalPage.tsx` 原则上不改代码，因共享 theme 做回归；若现有直接色值导致文字消失，只允许同步新官网 token，不修改正文。

### 6.2 禁止修改

- 不修改 App IA、Around / Guide / Me 三 Tab、首次引导、地点详情/讲解分离、Mia / Milo 人格和声音。
- 不改 `HomeScreen`、`TalkScreen`、`GuideScreen`、`PlacesMap`、`PlaceCard`、`Onboarding`、`TabBar` 的业务代码；这些是截图来源，不是本轮开发目标。
- 不改 `app/globals.css` 和 `app/layout.tsx` 的全局字体/应用色值；官网局部规则放官网作用域。
- 不改 `app/api/*`、路线算法、`routeStore`、位置权限、数据筛选、模型、语音后端、账号、支付、数据库、限流、隐私数据流。
- 不开发餐饮、Plus、复杂路线编辑、Android，不调整价格/商业模式，不增加页面、Section、FAQ、城市货架、Logo wall、评价、数据背书或新的功能演示。
- 不改 `BRAND` 身份信息、部署环境、域名分流、`proxy.ts`、Capacitor 或 Android 工程；不碰 `personal`。本轮不自行合并 main 或部署。
- 不为官网新增真实聊天输入、后台路线生成、第二套地图、用户追踪或新依赖；不使用 AI-powered / intelligent / smart / seamless 等禁用词。
- 不把「3–5 秒理解产品」写成「3 秒生成或播出」承诺；不把静态示例写成实时个性化结果。
- 不进行无关代码清理、全仓库重排或旧资产删除。发现与本轮无关的非阻断问题不追加开发任务。

---

## 7. 正式简报逐条覆盖索引

| 简报条款 | 最终落点 / 执行结果 |
|---|---|
| §1 目标与不做事项 | 本 spec §0、§6；Hero 定义产品，九区块不扩展 |
| §2 看懂这里优先、继续探索其次 | S01 / S03 / S04 优先；S05 次级；S08 弱化便利与预告 |
| §3 视觉方向与参考用途 | §2 tokens；S01/03/04 科技骨架，S02/05/07 摄影节奏；不继续访问或照搬参考站 |
| §4.1 背景 | bg #F7F8FA、surface #FFFFFF，官网移除大面积奶油底 |
| §4.2 文字 | ink #171717、muted #5E6673 |
| §4.3 单 accent | #167C80；真实 App 内容不伪造换肤 |
| §4.4 Border | 1px #DDE3EB；网格/间距/字体优先 |
| §4.5 Shadow | 唯一极轻阴影；去漂浮卡片与长手机影 |
| §4.6 圆角 | 20px 容器、pill 按钮 |
| §5 字体 | 官网 Manrope；不新增字体；App 原生 Serif 不动 |
| §6 Screen 01 | §3 S01，地图+地点+开讲入口+Mia+首句+静音状态，无新 App UI |
| §6 Screen 02 | §3 S02，品牌句、大摄影、少量短句 |
| §6 Screen 03 | §3 S03，01 SEE，真实地图 / 地点卡 / 示例位置 |
| §6 Screen 04 | §3 S04，02 LISTEN，真实声音/输入状态 + 既有可操作试听 |
| §6 Screen 05 | §3 S05，03 KEEP EXPLORING，真实一小时路线/编号/地图/步行情境 |
| §6 Screen 06 | §3 S06，两位声音选择，头像/性格/试听/状态 |
| §6 Screen 07 | §3 S07，大幅城市场景与一句文案 |
| §6 Screen 08 | §3 S08，Free 为当前状态、Plus Coming soon、路线延续价值 |
| §6 Screen 09 | §3 S09，浅色直接 CTA，不增加新功能解释 |
| §7 摄影原则 | §5.2；主要 S02/05/07，复用现有资产并保留真实性说明 |
| §8 产品 UI 展示 | §5；截图 / 原 Demo / 原 iframe，禁止营销假 App |
| §9 动效 | §2.3；轻淡入、真实状态反馈、可选普通 reveal |
| §10 Mobile | 每屏已写 mobile；§8 指定并行检查和截图证据 |
| §11 禁止修改 | §6.2 完整限制；没有新模块和功能 |
| §12 验收 | §8 Blocking-only QA，检查可理解性/真实能力/手机/入口/性能 |
| §13 分工 | GPT Work 本次冻结；Claude 按 §8 实施，结束后回传截图 |
| §14 快速流程 | 第一轮完整九屏 → 截图 QA → 仅修 Blocking Issues，不开第二套设计 |
| §15 上线后原则 | 本轮不加数据看板/埋点；后续优化由用户真实反馈另行触发 |
| §16 最终原则 | 不能帮助理解“眼前这是什么”的新增设计不进入本轮 |

---

## 8. Claude 执行顺序与 QA 交付

### 8.1 实现顺序

1. 复核 `company` 与当前 HEAD，读项目 AGENTS.md 及安装版本 Next.js 对应指南；保留其他人的改动。
2. 写入 tokens 和官网局部排版，更新 `DESIGN.md`；重排现有 9 个 section，保持旧锚点。
3. 完成 Hero、The Moment、See、Listen；**每屏完成即同时检查桌面与手机**。
4. 从现有产品获得真实一小时路线素材，完成 Keep Exploring。拿不到素材时不造数据。
5. 完成 Guides、Free / Plus、Real-world Break、Final CTA 与页脚回归；本轮交付是全部九屏，不在前五屏后自称完成。
6. 用现有项目命令执行适当验证：`pnpm lint`、`pnpm test`、`pnpm build`，记录真实结果。只对实际交互改动补必要测试，不为纯文案/token 添加镜像式测试。
7. 保存素材来源和截图，提交修改清单及未解决事项；停止自行优化，等待 GPT Work 的 Blocking-only QA。

### 8.2 第一轮必须交回的证据

- 分支、提交号、候选预览地址（若当前可用）、修改文件列表。
- **Desktop：1440×900 整页截图 + 1280×800 Hero 原始视口截图。**
- **Mobile：375×812 整页截图 + 同尺寸 Hero 首视口截图。** 另检查 360px 和 430px 宽无横向溢出，异常才追加截图。
- Hero 默认状态、四项切换及 live / 返回结果；See 地图/地点；Listen 声音/输入摘录与试听控件；Keep Exploring 的真实地图与路线卡，分别提供可读截图，不只一张缩小到无法阅读的长图。
- 试听 `idle / loading / playing / paused / error` 的实际结果说明；角色切换是否互斥、persona 入口是否保留。静态截图不能证明音频或链接已通过，需附实际操作结果；未测写未测。
- Plus 邮箱状态、APK 有/无配置分支与所有主要链接的检查结果；不要求向真实邮箱提交无关测试数据。
- 冻结 tokens 实际落点、路线素材来源、图片尺寸/大小，构建与检查结果。

截图是 Claude 第一轮实现后的交付要求，**不是本次冻结的前置条件**。若当前浏览器通道不可用，Claude 可先完成实现，并如实交代尚缺的 QA 证据；不能用旧截图冒充本轮。

### 8.3 QA 只输出 Blocking Issues

以下问题才阻止本轮验收：

| 类别 | Blocking 判定 |
|---|---|
| 产品识别 | Hero 默认不见地图/地点/导游讲解路径，仍需用户点击或滚很久才明白产品；首屏仍由旅行大图主导 |
| 内容/范围 | 顺序不是 See→Listen→Explore；漏掉某屏或新增 Section/功能；出现未开放能力、假路线、假状态、过度承诺 |
| 手机/可读性 | 360—430px 横向溢出，关键文字/按钮被裁，Hero 首视口见不到地图及地点名，截图缩小到不可读，输入/按钮互相遮挡 |
| 关键视觉 | 大面积回到暖黄/暗色，仍有多套官网高饱和交互主色、玻璃/渐变等明确禁项；Listen 权重被路线吞没 |
| 功能回归 | 主 CTA / 锚点 / persona / 原试听 / 原表单 / APK 条件入口损坏；真实 iframe 不能进入或无法退出；新布局导致控件无法操作 |
| 状态真实性 | 没播放却显示播放中；截图伪装可输入；未选择 App 导游却宣称已设置；示例位置冒充用户位置 |
| 性能与稳定 | 新增重型库、首屏自动生成/定位、明显未预留尺寸导致关键内容跳动，或修改造成构建失败 |
| 验证缺口 | 缺少本轮桌面/手机截图，无法核实上述关键项；明确标“QA 待完成”，不反向重开设计 |

每条输出格式：`BI-编号｜屏号/组件｜截图或操作证据｜为什么阻断｜最小修复｜复测条件`。

**不输出**新设计方向、非必要文案润色、更多摄影方案、微小间距偏好或新功能建议。轻微裁切/2px 间距差异只要不伤害理解、可读性和操作，不成为 Blocking Issue。没有阻断时输出：`No blocking issues. 本轮官网设计实现验收通过。`

验收通过后按已有部署职责交付；不以「还不够完美」开启第二轮。生产部署、main 更新及运维交接沿用用户已建立的权限与职责。

---

## 9. 可直接交给 Claude 的执行指令

> 在 `company` 分支按 `REAROUND-YOU-IMPLEMENTATION-SPEC.md` v1.0 执行。设计已冻结，不再请求确认方向。
>
> 基于现有 9 个 Section 完成 Hero、The Moment、See、Listen、Keep Exploring、Guides、Real-world Break、Free / Plus、Final CTA；冷浅灰 #F7F8FA、单 accent #167C80、Manrope。逐屏同时完成 desktop / mobile。
>
> 优先复用现有 HeroProduct、PlaceDemo、GuideCompare 和真实 App 截图；路线画面从现有一小时路线流程实拍，不造数据、不新开发路线演示。产品本体、IA、业务逻辑和应用原生颜色不改。
>
> 保持原有官网/应用入口、试听、邮箱登记、角色传递及 APK 条件入口。不要新增 Section、页面、功能或设计方向，不改 personal，不自行部署。
>
> 完成全部九屏后，交回本 spec §8 要求的 desktop / mobile 截图、修改文件、提交号、tokens、验证结果与未解决事项。暂停自行优化，后续只修 GPT Work 提出的 Blocking Issues。

**冻结完成。本次产出为实施规格；源码尚未修改，视觉与功能 QA 将针对 Claude 第一轮实现进行。**
