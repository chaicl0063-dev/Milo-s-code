# 官网 V2 上线自检报告（2026-09-16）

依据：`SITE-V2-RELEASE-ACCEPTANCE-20260916.md`。动效明细只引用 `SITE-V2-MOTION-SELF-CHECK-20260916.md`，不复制。
阶段：**发布前自检完成（P01–P10）；正式发布 L01–L05 未获授权、未执行。**

## 0. 候选版本与环境

- 分支 `company`，HEAD `836fceb`，工作区未提交：已修改 `app/globals.css`、`components/site/useScriptedSpeech.ts`、`docs/COLLABORATION.md`、`docs/PRODUCT-BRIEF.md`；未跟踪 `app/site-v2/`、`components/site-v2/`、`lib/site-v2/`、`assets/reference/`、`scripts/{motion-evidence,motion-perf,release-check-site-v2,shoot-site-v2,site-v2-static-map}.mjs`、`public/images/{hero-street-1280,hero-street-1920,hero-street-square,tour-saint-jacques-street-thumb,moment-detail-1800,moment-detail-portrait,route-illustration-1920,route-illustration-2508,route-illustration-mobile,map-chatelet-desktop,map-chatelet-mobile}.jpg`（最后两张为备用旧地图，页面不引用）以及 `docs/SITE-V2-*.md` 等文档。候选 = HEAD + 这份工作区；未有固定提交，发布前需先提交得到可追溯标识（用户指示暂不提交，故本轮不做）。
- 环境：本机生产构建（`pnpm build` + `pnpm exec next start -p 3001`），`http://localhost:3001/site-v2`；Windows 11 Pro 10.0.26200；本机 Chrome 稳定版无头 + CDP；Node v24.15.0；pnpm 10.33.0（使用仓库 `pnpm-lock.yaml`）；Next.js 16.3.4。本机服务端无代理（Node fetch 不走 Clash），凡需服务端访问外网的页面在本机会失败，已在相应条目单独说明。
- 证据：`docs/screens/site-v2-release/2026-09-16T06-44-06/`（最终批，`report.json` 为最小报告；`vp-<w>x<h>/first-screen.jpg`、`explore.jpg`，1440 与 375 另有 `full.jpg`；`diag-*.jpg` 为问题定位截图；`p07-plus/`；`p09-see-playing.jpg`）。发现问题的两批保留：`2026-09-16T06-34-38/`（首轮，含 1024 导游卡溢出、360 地点卡截断的 diag 截图）、`2026-09-16T06-39-45/`（导游卡修复后、首屏修复前）。脚本：`scripts/release-check-site-v2.mjs`。

## 1. 第一关：接收动效自检结果

| ID | 状态 | 检查环境/版本 | 实际结果 | 证据路径 | 修复与复测/遗留影响 |
|---|---|---|---|---|---|
| H01 结果完整 | PASS | 同候选 | 清单 v2 全部适用编号（M-B1–B4、M-D2–D4、M-U1、M-U2、M-N1）均有状态与证据，无 FAIL/BLOCKED 被写成通过；报告写明 HEAD 与工作区 | `docs/SITE-V2-MOTION-SELF-CHECK-20260916.md`；`docs/screens/site-v2-motion/2026-09-16T06-25-41/` | — |
| H02 未解决项 | PASS | 同候选 | 无未解决项；无静态降级；核心播放/互斥/状态文字在 S2、S3、S5 与本报告 P09 中均正常 | 同上 | — |
| H03 版本一致 | PASS | 同候选 | 上线自检期间为修断点问题改了 `Guides.tsx`、`SeeHear.tsx`、`Hero.tsx` 的布局类（P02 FIXED），未改动效逻辑文件；已只交回动效流程复测受影响场景：S2/S4/S7（批次 `2026-09-16T06-41-12`）与 S1/S2/S4/S7（`2026-09-16T06-45-34`）全部 PASS，未重跑全套 | `docs/screens/site-v2-motion/2026-09-16T06-41-12/report.json`、`…06-45-34/report.json` | — |

## 2. 第二关：发布前验收

| ID | 状态 | 检查环境/版本 | 实际结果 | 证据路径 | 修复与复测/遗留影响 |
|---|---|---|---|---|---|
| P01 构建 | PASS | 本机，pnpm 锁文件 | `pnpm exec tsc --noEmit` 0 错误；`pnpm lint` 0 错误、6 条既有 `@next/next/no-img-element` 警告（V2 `<img>`，此前已登记，本轮未增加）；`pnpm build` 成功，`/site-v2` 静态预渲染。修断点问题后重新执行三项仍通过。无已有测试覆盖本轮改动的逻辑 | 本报告 §0；构建输出见 COLLABORATION §50 | 两个证据脚本中一处 `no-unused-expressions` 警告已改写为 if/else |
| P02 尺寸 | FIXED | 本机生产构建，360/375/430×812、1024/1100/1280×800、1440×900 | 七个视口 `scrollWidth − innerWidth = 0`，无横向溢出；窄屏首张卡片地名、播放按钮、Mia 身份与完整第一句全部可见（卡片顶部 360: y=579、375: 573、430: 485，均在首屏下方一屏内）；1024–1279 路线段为「标题在图上方、示例场景列表在图下方」；1280+ 为左文叠图并显示示意角标；1440 全页 2574 px、375 全页 5555 px。**首轮发现并修复三处**：① 1024–1279 导游卡为两列时过窄，「Hear Mia's voice」与波形图标越出卡片（`diag-1024-guides.jpg`）→ 1024–1279 改为单列、≥1280 恢复两列；② 360 宽 See & Hear 地点卡标题被截为「Tour Saint-Jacq…」、波形被硬裁 → <400 宽标题允许换行、波形右侧渐隐；③ 1024/1280 首屏标题折成三行、四格信息条与地点卡标题被裁 → 1024–1279 标题 44 px、1280–1439 54 px、≥1440 仍 64 px（样张字号不变），信息格 <1440 改 2×2，主卡宽度上限由 42% 提到 48%（1440 处仍为 370 px），Hero 高度改为最小高度。1440 首屏与已通过的复刻版本逐像素位置一致（S7 12 元素 0 差异） | `2026-09-16T06-44-06/vp-*/first-screen.jpg`、`explore.jpg`、`vp-1440x900/full.jpg`、`vp-375x812/full.jpg`；问题截图 `2026-09-16T06-34-38/diag-*.jpg`、`2026-09-16T06-39-45/vp-1024x800/first-screen.jpg` | 复测：最终批全部通过；动效受影响场景已复测（H03） |
| P03 静态回归 | PASS | 同上 | 对照已接受的复刻版（COLLABORATION §43）与地图接入结论（§47）：六段结构、文案、Moment 照片锚框、路线插画与三场景编号、示意说明「Illustrative route · not a real map」与手机版说明文字均在；无旧 OSM 地图层或旧 SVG 残留；手机地图为裁切插画 + 三场景列表 | `vp-1440x900/full.jpg`、`vp-375x812/full.jpg`、`vp-1024x800/explore.jpg` | — |
| P04 浏览器 | BLOCKED（部分） | 桌面 Chrome 无头（本机稳定版）；手机仅 Chrome 设备模拟 | 桌面 Chrome：入口、试听、布局全部通过（P02/P05/P09）。**未实测 iOS Safari / Android Chrome 真机**：无头 Chrome 的 375/360/430 模拟不能声称已测 iOS Safari。剩余风险：iOS 的音频自动播放策略与 `backdrop-filter`、`scale` 属性表现；`touch-action` 与按压反馈在真机上的手感 | — | 需 GPT 判断替代证据或 Milo 接受该覆盖缺口；建议发布后用真机按 L03 抽查 |
| P05 入口 | PASS | 本机生产构建（内链实请求；外链只记录） | 按钮目标表见 §2.1：4 个页内锚点目标均存在；`/`（Open the app / Try it where I am ×2）200；`/guide`（Plan an hour）200；`/?persona=mia`、`/?persona=milo` 200；`/site/privacy`、`/site/terms` 200；Feedback / Contact 为 `mailto:hello@bubblefrog.fun`；署名外链两处指向 Wikimedia Commons 文件页（未请求）。页面 HTML 中 `localhost` 出现 0 次；应用地址取自 `NEXT_PUBLIC_APP_URL`（本机缺省 `/`，同域），无官网↔应用循环。示例地点页 `/p/en/wp%3ATour_Saint-Jacques` 本机 500，见 P06 | `2026-09-16T06-44-06/report.json` → `links` | — |
| P06 应用承接 | PASS（地点页以线上验证） | 本机生产构建 + 线上 `https://milo-s-code.vercel.app`（只读 GET，经代理） | 应用根页 `/`、路线页 `/guide` 本机 200；`/?persona=milo` → `localStorage["tourguide.persona"]="milo"`，`/?persona=mia` → `"mia"`，不带参数打开保留上次选择（与 PRODUCT-BRIEF I02 一致）。示例地点页本机 500：服务端 `fetch` 到上游超时（`UND_ERR_CONNECT_TIMEOUT`，本机服务端无代理），属环境限制；同一路径在线上现有部署返回 200 且含地点标题（地点页代码本轮未改）。未做更大范围产品重测 | `report.json` → `links`；`$TEMP/rr2-prod-3001.log`（服务端超时记录）；COLLABORATION §50 记录线上返回码 | 观察：无头下应用 Onboarding 的 `innerText` 缺少字母 s（疑似逐字动画或字体），不在本轮范围，仅记录 |
| P07 表单与下载 | PASS | 本机生产构建（KV 未配置） | Plus 行默认只显示「Notify me」，点开出现邮箱输入；用测试地址 `release-check@example.com` 提交：`/api/signup` 返回 200 `{ok:true, stored:false}`，界面**不**显示成功，保留输入、按钮变「Try again」并提示可重试；直接调用接口结果一致。无 APK 下载入口（Android beta 标 coming soon），符合「无正式包不强迫新增」。未向真实用户发送任何邮件 | `p07-plus/01-open.jpg`、`02-after-submit.jpg`；`report.json` → `plus` | 线上需 KV 已配置才会真正登记；若线上仍 `stored:false`，界面表现同本机（可重试、不假成功） |
| P08 素材与说明 | BLOCKED（联系邮箱） | 本机生产构建 | 13 张页面图片全部加载成功（无失败）；Inter 400/500/600/700 已加载，标题计算字体为 Inter；DOM 含「Illustrative route · not a real map」、手机版「An illustrated example, not a real map」、页脚「AI-generated illustration of a fictional city, not a real map」、Jorge Láscar (CC BY 2.0) 与 Ibex73 (CC BY 4.0) 署名、「Sample location」、导游肖像 AI 生成声明。**联系邮箱 `hello@bubblefrog.fun` 是否可收信未确认**（本机无法验证邮箱投递，且不向外发送测试邮件） | `report.json` → `assets`；`vp-1440x900/full.jpg` 页脚 | 需 Milo 确认邮箱已开通；未开通则撤下 Feedback/Contact 的 mailto 或换已确认渠道 |
| P09 运行错误 | PASS | 本机生产构建，1440×900 | 正常路径（加载 → Hero 试听 → 切到 See & Hear 试听）：控制台错误 0、失败请求 0、非 2xx 响应 0；`/api/tts` 6 次均 200；Hero 点击后 `Pause`，See & Hear 点击后 `Pause` 且 Hero 复位为 `Hear the story`（互斥）。全会话（含七视口加载、Plus 提交）控制台错误 0、失败请求 0 | `p09-see-playing.jpg`；`report.json` → `runtime`、`consoleErrorsAll`、`failedAll`、`nonOkResponses` | — |
| P10 发布候选 | BLOCKED（未提交） | — | 候选内容 = HEAD `836fceb` + §0 工作区清单，所有新素材已在列表内；无夹带未验收改动（本轮新增的三处断点修复已在 P02 复测）。**尚无固定提交或平台构建标识**：用户指示 company 分支暂不提交，发布前需先提交（或由平台构建标识）才能满足可追溯要求。发布目标、入口变化与回退版本见 §3 | `git status --short`（COLLABORATION §50 摘录） | 提交后本条转 PASS |

### 2.1 按钮目标表（P05）

| 位置 | 文案 | href | 结果 |
|---|---|---|---|
| Nav | ReAround You（logo） | `#top` | 目标存在 |
| Nav | How it works / Walks / Guides | `#see` / `#explore` / `#guides` | 目标存在 |
| Nav | Open the app | `/`（`NEXT_PUBLIC_APP_URL`） | 200 |
| Hero | Try it where I am | `/` | 200 |
| Hero | See how it works | `#see` | 目标存在 |
| Hero 卡 | Open Tour Saint-Jacques in the app（图标）/ Open this place in the app（手机） | `/p/en/wp%3ATour_Saint-Jacques` | 本机 500（环境）；线上 200 |
| Moment 图注 / 页脚 | Jorge Láscar、Ibex73 | Wikimedia Commons 文件页（`target=_blank`） | 外链，未请求 |
| See & Hear | Try this place in the app；Ask your own question in the app | `/p/en/wp%3ATour_Saint-Jacques` | 同上 |
| Keep exploring | Plan an hour in the app | `/guide` | 200 |
| Guides | Start with Mia / Start with Milo | `/?persona=mia` / `/?persona=milo` | 200，参数写入本机偏好 |
| Start | Try it where I am | `/` | 200 |
| Start | Notify me | 表单 → `/api/signup` | 见 P07 |
| Footer | Privacy / Terms | `/site/privacy` / `/site/terms` | 200 |
| Footer | Feedback / Contact | `mailto:hello@bubblefrog.fun…` | 见 P08 |

## 3. 第三关：发布前记录（准备，未执行）

- 正式入口（按验收标准 §4 读到的代码事实）：`/site-v2` 为预览，`metadata` noindex/nofollow；`proxy.ts` 按 `SITE_HOSTS` 把官网根路径重写到 `/site`；`NEXT_PUBLIC_APP_URL` 缺省 `/`。拟用方案：让正式 `/site` 呈现已验收的 V2（保留 `/site/privacy`、`/site/terms`），正式页去掉 noindex；`/site-v2` 预览可保留 noindex 或下线。**这一步会改动正式入口，未获授权前不执行。**
- 目标部署项目 / 域名：现有 Vercel 项目（线上 `https://milo-s-code.vercel.app`）；如官网与应用分域，`NEXT_PUBLIC_APP_URL` 需指向实际应用地址并验证主 CTA 不回官网。
- 候选标识：待提交（P10）。上一可用部署：线上当前部署（`/site` 为 V1，`/site-v2` 线上 404）。
- 需要变更的配置项名称：`NEXT_PUBLIC_APP_URL`（若分域）、`SITE_HOSTS`（若改根路径分流）、KV 相关变量（Plus 登记是否真正持久化）。不粘贴任何值。
- 回退：Vercel 恢复上一可用部署；若改了 `SITE_HOSTS` / `NEXT_PUBLIC_APP_URL`，同时恢复原值。不用覆盖工作区或删除未提交文件代替回退。

| ID | 状态 | 说明 |
|---|---|---|
| L01–L05 | 未执行 | 未获正式发布授权；仅在候选可追溯（提交）且 Milo 授权后，对这份具体候选请求一次发布 |

## 3.1 分屏改造后的复测（2026-09-16 晚些时候）

`SITE-V2-HERO-TRANSITION-REQUIREMENTS-20260916.md` v2 落地（首屏满铺、全站分屏、统一容器 90vw/1800px、四格重做、手机菜单、首屏出口转场）后，以下条目在同一台本机生产构建上重跑，批次 `docs/screens/site-v2-release/2026-09-16T09-15-36/`：

| ID | 结果 |
|---|---|
| P01 构建 | PASS：`tsc --noEmit` 0 错误；`pnpm lint` 0 错误、6 条既有 `no-img-element` 警告；`pnpm build` 通过 |
| P02 尺寸 | PASS：九个视口（360/375/390/412/430×812–915、1024/1100/1280×800、1440×900）可见口径横向溢出全为 0。**检查方式本身也修了**：`.rr2` 是 `overflow-x: clip`，`scrollWidth − innerWidth` 永远是 0，看不出「内容变宽、右侧被硬裁」；改为逐元素与裁切祖先求交后再比视口，并补上 390/412 两个常见手机宽度 |
| P03 静态回归 | PASS：六段结构、文案、照片锚点、路线插画与三场景编号、示意说明齐全；分屏后各屏标题左边界一致 |
| P05 入口 | PASS：入口表不变，落点改为屏起点（偏差 0px），路径与查询不变 |
| P07 表单 | PASS：Plus 仍为「不假成功、保留输入、可重试」 |
| P08 素材 | PASS：13 张图片全部加载（检查前先滚一遍触发懒加载，否则新页面下方的图还没开始加载会被误判为失败）；Inter 四个字重已加载；示意与署名文案齐全 |
| P09 运行错误 | PASS：正常路径控制台错误 0、失败请求 0、非 2xx 响应 0 |
| P10 发布候选 | 由 BLOCKED 转为**部分满足**：基线已提交为 `85b07bd` 并推到 `origin/company`；分屏改造这一轮的改动仍未提交，发布前需再提交一次 |

分屏相关的九项验收（V01–V09）见 `SITE-V2-HERO-TRANSITION-SELF-CHECK-20260916.md`，全部通过。

## 4. 最终自检摘要

- 阶段：**发布前可发布（有条件）**——静态、动效与分屏改造自检均通过，剩余条件见「需 Milo 决定」。
- 候选或部署 ID：HEAD `836fceb` + 未提交工作区（§0）；无部署 ID。
- 正式官网 URL 与应用 URL（拟用，未发布）：`https://milo-s-code.vercel.app/site`（正式）/ `/site-v2`（预览）；应用 `https://milo-s-code.vercel.app/`。
- 通过：H01–H03、P01、P03、P05、P06、P07、P09 共 9 项；修复后通过：P02 1 项；不适用：0。
- 失败或未验证：P04 BLOCKED（未测 iOS Safari / Android 真机，剩余风险为 iOS 音频策略与真机触摸手感）；P08 BLOCKED（联系邮箱可收信未确认）；P10 BLOCKED（候选未提交，缺可追溯标识）。无 FAIL。
- 装饰降级：无。
- 证据目录：`docs/screens/site-v2-release/2026-09-16T06-44-06/`（另两批见 §0）；动效 `docs/screens/site-v2-motion/2026-09-16T06-25-41/`。
- 需 GPT 复核：无异常单。P04 覆盖缺口可由 GPT 判断替代证据是否足够。
- 需 Milo 决定：① 是否接受 P04 的真机覆盖缺口（或安排真机抽查）；② 确认 `hello@bubblefrog.fun` 是否可收信（P08）；③ 何时提交 company 分支形成可追溯候选（P10）；④ 正式发布与入口切换（`/site` 呈现 V2）的授权。
- 回退目标与方式：Vercel 上一可用部署 + 恢复配置原值（§3）。
