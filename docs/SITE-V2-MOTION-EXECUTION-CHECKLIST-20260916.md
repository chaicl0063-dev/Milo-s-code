# 官网 V2 动效执行清单

日期：2026-09-16（v2，已完成GPT文档一致性复核，已合入 `SITE-V2-MOTION-CHECKLIST-REVIEW-20260916.md` 的 R1–R5 与验收修订；该复核文件保留为记录，不再作为并行指令）  
状态：**待 Milo 批准**。这是唯一的动效执行文件；批准前不动代码。  
> 2026-09-16 实施授权：用户在对话中明确指示「按照执行清单开工吧，做完后根据验收清单自检」，据此开工；自检结果见 `SITE-V2-MOTION-SELF-CHECK-20260916.md`。本行只记录授权来源，不改写上面的状态字样。  
依赖的静态版本：COLLABORATION §46 之后的 `/site-v2`（Inter / 海军蓝令牌、六段结构、F01–F04、路线插画已接入）。地图区域静态，与地图相关决定互不阻塞；地图已通过的接入结论见地图验收文档，本清单不重审地图。动效验收不自动代表整站上线验收。  
覆盖关系：原 `SITE-V2-BRIEF.md` §8 的 A/B/C/D 四类保留为历史；`SITE-V2-MOTION-PROPOSAL-20260916.md` 为方向稿。本清单只执行下表所列，未列入的元素一律静态。已取消：A（图钉扩散 / 识别框收拢）、C（路线画线 / 卡片依次出现）、首屏主卡显现（原 M-D1，见 R1）、全段文字位移、按句进度条。

## 0. 统一约定

- **三种生命周期分开**：显现只在本次挂载期间对符合条件的组做一次；按钮反馈每次真实操作都响应；波形起伏只在音频实际 `playing` 期间循环。
- **允许的属性**：`opacity`（显现）、`transform: scale()`（按钮内部视觉容器）、`transform: scaleY()`（波形柱）、颜色 `color / background-color / border-color` 过渡、`scroll-behavior`。不做位移入场、不画线、不做位置动画。
- **曲线**：显现与按钮统一 `cubic-bezier(0.2, 0, 0, 1)`；波形柱 `ease-in-out` 往复。
- **减少动态效果**（`prefers-reduced-motion: reduce`）：关闭显现、按压缩放、波形起伏、平滑定位；保留即时颜色/焦点反馈与文字播放状态；音频行为不变。
- **无脚本 / 观察器不可用**：内容首帧完整可见，任何时候不把正文置为透明。
- **装饰动态与页面可见性**：`document.hidden` 或组件离开视口时波形进入视觉 paused（见 §1 M-B），重新可见时按当前真实播放状态恢复；不因此暂停或恢复音频。

## 1. 清单

| 编号 | 元素 | 触发条件 | 起止状态 | 时长 / 曲线 | 重播规则 | 手机差异 | 减少动态效果差异 | 验证步骤 | 通过条件 |
|---|---|---|---|---|---|---|---|---|---|
| M-B1 | Hero 主卡波形（`Hero.tsx` PlaceCard 桌面版，`Waveform`） | 视觉模式由 `useScriptedSpeech` 状态映射：`playing`且组件/页面可见 → running；`paused` → paused；页面不可见 / 组件离开视口且原为 running → paused；`loading / idle / done / error / 被其它实例停止` → static | static：原始柱高、无动画；running：各柱 `scaleY` 在 0.7–1 间往复；paused：保留同一 animation 声明，只改 `animation-play-state: paused`，冻结当前帧 | 第 i 柱单程 `1100 + (i mod 5) × 100 ms`，相位延迟 `−(i mod 7) × 100 ms`，`alternate`，`ease-in-out`，`transform-origin: center` | running 期间循环；恢复播放从冻结帧继续 | 手机版卡无波形，只有按钮与状态文字 | 始终 static | 点击 → 等真实 `playing` 事件 → 暂停 → 恢复 → 切到 See & Hear 播放 | loading 期间 static；`playing` 事件后 300 ms 内 running；paused 立即冻结且不回原位；被切换后 200 ms 内 static |
| M-B2 | See & Hear 播放条波形（`SeeHear.tsx`，key `see-hear`） | 同 M-B1 | 同 | 同 | 同 | 手机也有此波形，同规则 | static | **独立验证**：点击 → 真实发声 → 暂停 → 恢复 → 切到 Hero 播放 | 同 M-B1 |
| M-B3 | Guides 两张卡的波形图标（`Guides.tsx` `Icon.Wave` 五根柱） | 两张卡共用一个 hook：`state.key === id && status` 决定；key 切换时旧卡立即 static | 同 M-B1（五柱） | 同 M-B1 | 同 | 同规则 | static | Hear Mia → 暂停 → 恢复 → Hear Milo（Mia 卡立即 static） | 只有正在播的那张卡 running |
| M-B4 | 三处播放控件的图标与状态文字（沿用现有 UI，不新增状态行） | 状态变化 | Hero：状态行文字 Ready / Preparing / Speaking / Paused / Voice unavailable + 图标 Play↔Pause；See & Hear：按钮 aria-label / title Hear the story / Preparing / Pause / Resume / Retry；Guides：按钮文字 Hear X's voice / Preparing… / Pause / Resume / Retry | 颜色 150 ms；文字与图标即时切换 | 每次状态变化 | 同 | 无过渡，即时切换 | 四个入口各做一次暂停恢复 + 跨区域切换 | 文字与图标不早于真实状态变化；loading 期间按钮 disabled 不可重复触发；done 可重播；error 可重试 |
| M-D2 | Moment 照片卡 + 右面板（桌面 ≥1024，作为一组） | 挂载时该组**完全在视口下方**才标 `pending`；此后首次可见 ≥30% | opacity 0.8 → 1，然后标 `done` | 300 ms | 本次挂载期间不重播；重新完整加载允许重新判定 | 手机不做（组直接 1） | 直接 1 | 首次加载 → 滚到 → 滚走 → 滚回；锚点跳过该组；键盘 Tab 到组内元素 | 挂载时已可见或已滚过的组直接 done、保持 1；快速滚动/锚点跨过或组内元素获焦 → 直接 done、不补播；断点变手机、减少动态效果、观察器不可用 → 1；已 done 的组切回桌面不重新 pending；标题与正文从首帧 100%；无先暗后亮 |
| M-D3 | See & Hear 地点卡 + 对话卡（一组） | 同 M-D2 | 同 | 300 ms | 同 | 同 | 同 | 同 | 同 |
| M-D4 | Guides 两张卡（一组） | 同 M-D2 | 同 | 300 ms | 同 | 同 | 同 | 同 | 同 |
| M-U1 | 真实按钮与胶囊链接：Nav Open the app、Hero 两个按钮、卡上图标按钮 Open / Hear、Plan an hour in the app、Try it where I am、Notify me、胶囊入口 Ask your own question | 真实 hover（仅 `(hover: hover) and (pointer: fine)`）/ 按压 / 焦点 | 图标与文字放在同一个**内部视觉容器**，按压时容器 `scale(0.98)`，松开恢复；hover 颜色过渡；焦点即时 outline | 颜色与 transform 均 150 ms | 每次操作 | 无 hover，只有按压与焦点 | 无缩放、无过渡；保留即时颜色与焦点 | 桌面 hover / mousedown / 键盘 Space、Enter（原生语义）；手机 touch | 外部命中区域与焦点框不变；点击即时生效不等动画；信息卡无假 hover |
| M-U2 | 普通文字链接：页脚链接、Start with X、Open this place in the app、Try this place in the app 等非胶囊链接 | 真实 hover（仅精细指针且支持hover）/ 焦点 | 颜色 / 下划线 / 焦点反馈 | 颜色 150 ms | 每次 | 只有焦点与按压颜色 | 无过渡 | hover / Tab | 不缩放；不改变链接行为 |
| M-N1 | 页内锚点（How it works / Walks / Guides / See how it works / Then keep walking） | 点击锚点 | 原生 `scroll-behavior: smooth` 定位到目标段 | 浏览器原生 | 每次点击 | 同 | 即时定位（`auto`） | 点击后滚轮可中断；确认实际滚动元素 | 只在 `/site-v2` 挂载期间给 `documentElement` 加专属标记（如 `data-rr2-smooth`），CSS 对该标记设 smooth，卸载移除；实测滚动容器若不是文档视口则记录实测对象；不接管滚动、不新增嵌套滚动容器、不覆盖其他页面规则 |

## 2. 不在清单内（保持静态）

“静态”指容器和装饰没有独立动画，不取消已列入的内部音频/按钮反馈；Moment照片、识别框和地点小卡随M-D2整体透明度变化，不单独收拢或移动。`SiteV2Landing`可继续作为服务端组件，通过独立客户端小组件承载effect，不为挂载逻辑把整页改成客户端。

首屏主卡（不做显现）、图钉、地点小标签、示例角标、坐标小字；Moment 识别框、地点小卡、坐标；路线插画及其角标；CTA 横幅、页脚、Plus 行的非按钮部分。

## 3. 实现方式

- **显现（M-D2–D4）**：独立客户端小组件 `Reveal`。无属性/服务端默认opacity=1。初始化先检查桌面、非减少动态、观察器可用，再测位置；完全在视口下方才pending（0.8），否则done（1）。状态为pending / revealing / done：只有首次可见比例≥0.3走revealing（300ms到1），完成后done；所有“直接显示”路径直接done并取消transition。CSS过渡只绑定revealing，不能给done统一配置300ms。观察阈值至少含0与0.3；pending被快速滚过至视口上方时直接done，防止永远留在0.8。hashchange仅处理实际跳过或到达的组，不将所有下方组一并完成；focusin、变手机、开启减少动态、观察器失败均立即done。结束后不重播，清理事件监听；初始化或清理不使已可见内容变暗。
- **波形（M-B1–B3）**：`Waveform` 增加 `mode: "static" | "running" | "paused"`；running/paused 时每柱 `animation: v2-wave var(--dur) ease-in-out infinite alternate; animation-delay: var(--delay); transform-origin: center` 并用 `animation-play-state` 区分；static 时移除 animation。`--dur / --delay` 按 §1 公式由索引给出。页面可见性用 `document.visibilityState`，组件可见性使用独立、持续工作的 IntersectionObserver（阈值0，用isIntersecting判断），不要复用显现完成后会断开的观察关系。`motion-reduce:` 下强制 static。
- **按钮（M-U1）**：`btnPrimary / btnGhost / btnSmall` 内容包进一个 `span.inline-flex.items-center.gap-*` 视觉容器；按钮类加 `transition-[color,background-color,border-color] duration-150 active:[&>span]:scale-[0.98] [&>span]:transition-transform [&>span]:duration-150`；hover 类包在 `@media (hover:hover) and (pointer:fine)`（显式检查编译结果同时包含这两个条件，不以框架默认行为代替验证）；`motion-reduce:` 关闭缩放与过渡。
- **锚点（M-N1）**：在 `SiteV2Landing` 中挂载独立客户端辅助组件，由它使用 effect：挂载 `document.documentElement.dataset.rr2Smooth = ""`，卸载删除；全局样式 `html[data-rr2-smooth]{scroll-behavior:smooth}` + `@media (prefers-reduced-motion: reduce){html[data-rr2-smooth]{scroll-behavior:auto}}`。执行时先用 `document.scrollingElement` 确认滚动容器并记录。
- 不新增依赖。

## 4. 验收证据（执行轮交付）

- **实时录屏**：CDP `Page.startScreencast` 逐帧接收 `screencastFrame`（及时 `screencastFrameAck`），保存每帧的 `metadata.timestamp`，按真实时间戳编码为可播放视频（输出 25 fps 可以，但不等间隔拼帧伪造时间）。浏览器帧不含声音：「实际发声」以媒体 `playing` 事件日志（时间戳）证明，不声称听到音频；如需声音证据另用含系统声音的录屏。场景录到完成，不固定时长：① 首次进入 → 滚到底 → 滚回顶（M-D 不重播）；② Hero 播放 → `playing` → 暂停 → 恢复 → See & Hear 播放 → 暂停 → 恢复 → Hear Mia → 暂停 → 恢复 → Hear Milo → 暂停 → 恢复（互斥、波形只在 running 起伏、旧卡即时 static）；③ 受控失败：**新会话**（无内存音频缓存）拦截 `/api/tts` 返回 500 → Retry 状态，证明请求确实被拦截；④ 375 宽手机按压反馈；⑤ 减少动态效果下同一组操作；⑥ 禁用 JS 的整页静态截图（内容完整）。
- **基线**：同一代码、同一素材，用一个开关（如 `?motion=0` 或环境变量）关闭本轮动效 vs 开启，不再拿旧批次截图当基线。
- **静态比对**：锁定视口 / DPR、加载完成、音频 idle、动效结束；比较关键元素的位置、尺寸、换行与可见性（DOM rect 差异为主），像素差只作辅助，允许字形栅格化细差；不能以「动效元素允许差异」放过永久变形。
- **性能**：同一生产构建（`next build` + `next start`）预热后，先做一对开启/关闭 Performance trace（首屏 5 s + 一次滚动 + 一次播放）；出现新增长任务、布局或明显掉帧再重复定位。录屏不当性能采样。只对新增开销负责，不宣称全页无长任务。
- **工程**：`tsc`、eslint、七宽 `data-check`、整页无横向溢出。

## 5. 估算

B（M-B1–B4）0.5 天；D（M-D2–D4）0.25 天；按钮、文字链接与锚点 0.25 天；录屏、失败测试、基线与性能对比、文档 0.5 天。合计约 1.5 天（估算，非承诺），不为已取消项预留。

## 6. 与其它事项的关系

- 地图 / 路线插画：本清单不含地图动效；沿用已通过的地图接入结论，不重做。
- 06:15 定时任务：与动效无关，另行核对与决定。

## 7. 与上线验收的单向交接

本文件独立负责动效实现、参数、自检与证据。`SITE-V2-RELEASE-ACCEPTANCE-20260916.md`只负责发布放行、部署与线上复核，不覆盖本文件参数，不增加另一套M类测试。

动效自检结果写入 `SITE-V2-MOTION-SELF-CHECK-20260916.md`，包含：候选版本/相关文件版本、每个M编号的状态与证据路径、未解决问题、已采用的静态降级、总结。证据可独立放在 `docs/screens/site-v2-motion/<批次>/`。

交给上线阶段的是上述结果文件与版本标识。版本和相关实现未变，发布前只核对结果，不重跑动效全套。只有相关实现改变或换环境出现异常才针对性复测；生产抽查用于发现环境差异，不重审动效方向。动效自检不能代替正式发布授权。
