# 官网 V2 全站分屏 / 统一宽度 / 四卡 / 页内转场 自检报告（2026-09-16）

依据：`SITE-V2-HERO-TRANSITION-REQUIREMENTS-20260916.md` v2。本文只覆盖该需求的 V01–V09；动效实现与上线放行仍分别由 `SITE-V2-MOTION-SELF-CHECK-20260916.md`、`SITE-V2-RELEASE-SELF-CHECK-20260916.md` 负责。
本轮未部署、未重做地图、未新增其它动画。

## 0. 候选版本与环境

- 分支 `company`，基线提交 `85b07bd`，本轮改动**未提交**（见 §1 文件列表）。
- 环境：本机生产构建（`pnpm build` + `pnpm exec next start -p 3001`），`http://localhost:3001/site-v2`；Windows 11 Pro 10.0.26200；本机 Chrome 稳定版无头 + CDP；Node v24.15.0；Next.js 16.3.4。
- 证据：`docs/screens/site-v2-hero-transition/2026-09-16T09-19-30/`（V01–V09 一次跑完的最终批次，`report.json` 九项 `pass` 全为 true），脚本 `scripts/hero-transition-check.mjs`。

## 1. 修改文件

| 文件 | 改了什么 |
|---|---|
| `components/site-v2/ui.tsx` | 全站统一容器 `container`：视口宽 90%、上限 1800px、居中；手机固定左右 20px（取代旧 `max-w-[1440px] + 5%` 混用）。`Tile` 改为「图标在上、主值、说明」整组水平垂直居中，等宽等高，内边距 12px。 |
| `components/site-v2/SiteV2Landing.tsx` | 屏序与分屏 CSS：首屏 = 顶栏 + Hero 合一屏；Moment / See & Hear / Explore / Guides 各一屏；Start + Plus + Footer 合为收尾屏。新增 `.v2-screen` / `.v2-screen--center` / `.v2-screen--top` 与 `html[data-rr2-snap]` 的 `scroll-snap-type: y mandatory`（只在 ≥1024 且视口 ≥640 高时）。新增首屏出口转场层样式 `.v2-handoff`。挂上 `<HeroTransition />`。 |
| `components/site-v2/motion.tsx` | `MotionRoot` 增加：按「每一屏都装得下当前视口」决定是否打开 `data-rr2-snap`（resize / 断点 / 减少动态 / ResizeObserver 重算），以及页内入口激活后把程序化焦点给到目标屏（`preventScroll`）。新增 `HeroTransition`：首屏出口一次性淡入提示。 |
| `components/site-v2/Hero.tsx` | 首屏成为一屏的下半部分（`flex-1`）；主卡与示例角标改为对齐统一舞台的图层；底部一行「Scroll to explore」静态提示 + 照片署名（署名压在照片上，桌面加浅色底保证可读）；四格 ≥1440 一行四列、1024–1439 与手机 2×2；经纬度每行一个完整坐标不折断。 |
| `components/site-v2/Nav.tsx`、`components/site-v2/NavMenu.tsx`（新增） | 手机顶栏新增可见的「Menu」按钮，用原生 `<details>` 承载三个段落入口（无 JS 也能展开），Open the app 仍常驻；选完 / 点外面 / Escape 收起。 |
| `components/site-v2/Explore.tsx` | 插画放进统一舞台，保持 4:1 原比例（不 cover、不拉伸）；桌面文字层左边界 = 舞台左边界，与其它屏标题起始线一致；示意角标改为贴舞台右边。 |
| `components/site-v2/Moment.tsx`、`SeeHear.tsx`、`Guides.tsx`、`Start.tsx` | 加上屏类名；按屏高调整栏目占比与间距（照片比例、卡片内边距、肖像尺寸、行高、标题字号），不是只加底部空白。 |
| `scripts/hero-transition-check.mjs`（新增） | V01–V09 的证据脚本。 |
| `scripts/release-check-site-v2.mjs`、`scripts/motion-evidence.mjs` | 配合新布局修正取证方式：横向溢出改「可见口径」（`.rr2` 是 `overflow-x: clip`，`scrollWidth` 看不出问题）、新增 390/412 两个手机宽度、资源检查前先滚一遍触发懒加载；动效 S1 改为滚到真实页底（页面从 2574px 变成 5400px）、S7 用 instant 滚动并忽略零尺寸隐藏元素。 |

## 2. 逐项结果

| ID | 状态 | 检查环境/版本 | 实际结果 | 证据路径 | 修复与复测/遗留影响 |
|---|---|---|---|---|---|
| V01 首屏 | PASS | 本机生产构建，1440×900 / 1280×800 / 1920×1080，scrollY=0 | 首屏（顶栏 + Hero + 署名）总高分别 900 / 800 / 1080，与视口**差 0px**；正文未提前露出（0px）；塔、地点标签、主卡、四格齐全 | `V01-first-1440x900.jpg`、`V01-first-1280x800.jpg`、`V01-first-1920x1080.jpg` | 首屏原本按样张固定 540/560px，本轮改为按可视区域；样张仍用于颜色、字体与构图关系 |
| V02 四卡 | FIXED | 1440 / 1280 / 1024 / 430 / 375 | 全部：等宽、等高、无裁字、无越界；内边距 12px；整组 `text-align: center` 且图标/主值/说明垂直居中。列数 ≥1440 为 4 列一行，1024–1439 与手机为 2×2。经纬度两行、每行一个完整坐标。绿点与说明同一行居中 | `V02-tiles-1440.jpg`、`V02-tiles-1280.jpg`、`V02-tiles-1024.jpg`、`V02-tiles-430.jpg`、`V02-tiles-375.jpg` | 原实现是左图标右文字 + `whitespace-nowrap`，最小内容宽把四列网格撑破左栏并压到照片上、文字被裁（用户截图即此问题）。已改为纵向居中结构并去掉 nowrap |
| V03 导航 | FIXED | 1440×900，逐个点击 + 键盘激活 | Logo / How it works / Walks / Guides / See how it works / Scroll to explore 六个入口全部落到目标屏起点，**偏差 0px**；URL 路径与查询不变、无新增页面；目标标题完整可见。键盘激活后焦点落在 `SECTION#guides`，滚动位置不被焦点改变。应用入口（Open the app / Try it where I am / Plan an hour）仍指向应用地址 | `report.json` → `results.V03` | 首次测得偏差 24px（旧的 `section[id]{scroll-margin-top:24px}` 优先级更高），已用 `[id].v2-screen` 覆盖为 0 |
| V04 下滚 | FIXED | 1440×900，从首屏逐屏下滚到底 | 6 个屏，`scroll-snap-type: y mandatory`；停滚后**5/5 对齐**屏起点；首屏出口转场提示只出现 **1 次**；回顶后再下滚不重播 | `report.json` → `results.V04` | 先用 `proximity` 只对齐 1/5，改为「每屏都装得下时才 mandatory」后 5/5。取证上另修两处：同一 URL 重新加载会被 Chrome 还原滚动位置（从而正确地跳过转场），改用带一次性查询参数的干净地址；转场只亮约 560ms，采样改为 60ms 密集轮询 |
| V05 中断 | PASS（含一条 BLOCKED 子项） | 1440×900 | 转场提示出现时按 Escape：状态由 `in` → `out`，立即结束；真实鼠标滚动手势可自由滚动（900 → 0），**滚轮没有被锁**；停止操作后位置稳定不被反复拖回；回顶再下滚不重播。**BLOCKED 子项**：锚点原生平滑定位途中的反向手势，在无头环境未能中断（合成手势与原生平滑滚动的时序问题，同一脚本里合成手势本身可用）。本页没有任何自定义滚动控制器，定位完全交给原生 `scroll-behavior` 与 `scroll-snap`，不存在吞滚轮或重复拖回的代码路径 | `report.json` → `results.V05` | 真机需复核这一条 |
| V06 防误触 | PASS | 1440×900 | 带 hash 的深链接 `#guides`：直接到目标、不播转场、不强制回顶；点击试听：不播转场、滚动位置不动、音频不受换屏影响；已在正文位置继续下滚：不播转场 | `report.json` → `results.V06` | 手机菜单展开时转场本身在手机不生效（桌面才有），另见 V07 |
| V07 手机 / 放大 / 矮屏 | PASS | 360 / 375 / 430×812、1440×620 矮窗口、根字号 32px（约 200% 文字） | 手机与矮屏 `scroll-snap-type: none`（不强制吸附）；首屏按内容自然增高（360: 1112px、375: 1089px、430: 1000px，视口 812），四个信息格**都在正文第一段之前**，不会滚一屏就跳过；200% 文字放大下无横向溢出、Moment 仍在 Hero 全部内容之后开始 | `V07-360x812.jpg`、`V07-375x812.jpg`、`V07-430x812.jpg`、`V07-1440x620.jpg`、`V07-text-200.jpg` | — |
| V08 回退 | PASS | 减少动态效果；拦截所有 `*.js` | 减少动态效果：`scroll-snap-type: none`、转场层 `display: none`、`scroll-behavior: auto`，普通滚动可用。无 JS：`scroll-snap-type: none`、无 `data-reveal`、Moment / Guides / 首屏主卡内容完整、手机菜单（原生 `<details>`）仍在 | `V08-reduced-motion.jpg`、`V08-no-js.jpg` | 没有任何内容依赖脚本才显示 |
| V09 全站对齐 | PASS | 1440×900、1920×1080，逐屏起点截图 | 内容屏（首屏 / Moment / See & Hear / Explore / Guides）标题左边界：1440 全部 72px、1920 全部 96px，**差 0px**；停留在对齐位置时不夹带上下屏；Explore 保留 4:1 原图、无裁点无拉伸 | `V09-1440-*.jpg`、`V09-1920-*.jpg` | Explore 标题原本在插画内 `left-[4%]`（1440 为 124px），已改为舞台左边界。**收尾屏例外**：标题在 CTA 横幅卡片内（1440 为 188px、1920 为 212px），它是横幅而非段落标题，未并入起始线比较 |

## 3. 需要说明的取舍

- **屏内填充比例**。各内容屏已按屏高放大了照片比例、卡片内边距、肖像尺寸与标题字号，内容在屏内垂直居中、上下留白对称，不是「短横带 + 一大片底部空白」。实测内容高度占屏高：1440×900 下 Moment 46%、See & Hear 47%、Explore 36%、Guides 36%、收尾 45%；1920×1080 下 50% / 34% / 40% / 25% / 36%。Explore 按需求「屏高由外层段落承担，不靠把地图纵向拉长来撑满」，比例偏低是预期。其余几屏若要再提高填充率，需要重做栏目构图（例如 Guides 改为纵向大卡），超出本轮范围，列在这里供判断。
- **分屏对齐的开关条件**。`mandatory` 只在「≥1024 宽、≥640 高、未开启减少动态效果，且每一屏的实际高度都不超过视口」时打开，由 `MotionRoot` 在挂载、resize、断点变化和 `ResizeObserver` 时重算。任何一屏被内容撑高（手机、文字放大、矮屏）就整体关闭，回到完整阅读的普通长页。不使用全屏滚动插件，不逐次吞滚轮。
- **转场提示**。近白浅蓝底 + 一行「Discover a deeper layer」+ 静态向下箭头，淡入 180ms、停留约 560ms、淡出 240ms，`pointer-events: none`，不控制滚动、不占一屏，整次加载只播一次。点击任何页内锚点（含导航与 Scroll to explore）直接跳过。
- **首屏署名可读性**。署名压在照片上，桌面给了半透明白底药丸；这是新增的样式，不改文案。

## 4. 结论

V01–V09 全部通过（最终批次 `2026-09-16T09-19-30` 的 `report.json` 九项 `pass` 均为 true），其中 V02 / V03 / V04 为先失败后修正（FIXED）。唯一未证实的是 V05 中「原生平滑定位途中反向手势能否中断」，无头环境无法复现，已说明代码层面不存在锁滚轮或拖回的路径，建议真机复核。
本轮不涉及部署；上线放行仍看 `SITE-V2-RELEASE-SELF-CHECK-20260916.md`。与本轮相关的复测已做：
- 动效全套 S1–S7 在新布局上重跑，批次 `docs/screens/site-v2-motion/2026-09-16T09-11-54/`，**全部 PASS**。
- 上线前 P02（九个视口，含新增的 390/412）、P05、P07、P08、P09 在新布局上重跑，批次 `docs/screens/site-v2-release/2026-09-16T09-15-36/`，无横向溢出、无控制台错误与失败请求、图片全部加载、Plus 仍为可重试的失败态。
