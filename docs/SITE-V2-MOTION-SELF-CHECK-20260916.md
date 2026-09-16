# 官网 V2 动效自检结果（2026-09-16）

依据：`SITE-V2-MOTION-EXECUTION-CHECKLIST-20260916.md` v2（唯一动效执行文件）。实施授权：用户 2026-09-16 在对话中指示「按照执行清单开工吧，做完后根据验收清单自检」。
本文件只记录动效实现的自检与证据；上线放行见 `SITE-V2-RELEASE-SELF-CHECK-20260916.md`。

## 0. 候选版本与环境

- 仓库 `D:\AI_Projects\tourguide`，分支 `company`，HEAD `836fceb`，**全部改动未提交**（用户指示 company 分支往后推）。相关文件：`components/site-v2/{motion.tsx,ui.tsx,Hero.tsx,SeeHear.tsx,Guides.tsx,Nav.tsx,Start.tsx,PlusNotify.tsx,Explore.tsx,SiteV2Landing.tsx}`、`components/site/useScriptedSpeech.ts`（跨实例互斥）、`app/globals.css`（`fine` 自定义变体）、证据脚本 `scripts/motion-evidence.mjs`、`scripts/motion-perf.mjs`。
- 动效证据用开发服务器 `http://localhost:3000/site-v2`（Next.js 16.3.4 dev）；性能对比用生产构建（`pnpm build` + `next start -p 3001`）。Windows 11 Pro 10.0.26200，本机 Chrome 稳定版无头模式（`C:/Program Files/Google/Chrome/Application/chrome.exe`，CDP），Node v24.15.0，pnpm 10.33.0，ffmpeg 8.1.1。
- **环境说明**：本机无头 Chrome 默认报告 `prefers-reduced-motion: reduce`（`report.json` 的 `environmentPrefersReducedMotion: true`），所以正常场景显式模拟 `no-preference`，S5 再显式模拟 `reduce`。
- 证据目录：`docs/screens/site-v2-motion/2026-09-16T06-25-41/`（S1–S7 完整一批 + `perf/` + `css-evidence.txt` + S2 目录内 `replay-log.json`、`visibility-log.json`）。上线自检期间为修断点问题改了 `Guides.tsx` / `SeeHear.tsx` / `Hero.tsx` 的布局类，针对性复测批次：`2026-09-16T06-41-12/`（S2、S4、S7）与 `2026-09-16T06-45-34/`（S1、S2、S4、S7），均 PASS；动效逻辑文件（`motion.tsx`、`ui.tsx` 的 Waveform/WaveBars/按钮类、`useScriptedSpeech.ts`）在两次复测之间未改。

## 1. 场景结果（清单 §4）

| 场景 | 内容 | 结果 | 证据 |
|---|---|---|---|
| S1 | 1440×900 首次进入 → 滚到底 → 滚回顶 | PASS：挂载时 Moment 组已在视口内直接 done，See & Hear / Guides 两组 pending → 滚动后 done，滚回后仍 done（不重播）；`scrollingElement=HTML`，`html[data-rr2-smooth]` 存在 | `S1-first-enter-scroll/S1.mp4`（49 帧 / 4.25 s，真实时间戳编码）、`log.json`、`00-first-viewport.jpg` |
| S2 | Hero 播放 → playing → 暂停 → 恢复 → See & Hear 播放 → 暂停 → 恢复 → Hear Mia → 暂停 → 恢复 → Hear Milo → 暂停 → 恢复 | PASS：`playingEvents: 8`（真实 `playing` 事件）；四处互斥（切换后旧实例立即 static）；running 使用 `v2-wave` 关键帧；paused 冻结（`animation-play-state: paused`，声明不变） | `S2-audio-exclusive/S2.mp4`（276 帧 / 9.3 s）、`01–05 *.jpg`、`log.json` |
| S3 | 新会话拦截 `/api/tts` → 500 | PASS：4 次请求被拦截；Hero 与 Mia 卡按钮变 `Retry`；波形全部 static。受控测试，不是生产故障 | `S3-tts-failure/` |
| S4 | 375×812 手机按压反馈 | PASS（见 §3 说明）：按下时 `.v2-btn` 计算样式 `scale: 0.98`，外层命中矩形 `20, 182.34, 235.81×56` 前后一致；松开后 `scale: none` | `S4-mobile-press/`、`report.json` |
| S5 | 减少动态效果下同一组操作 | PASS：`playingEvents: 8`、互斥与状态文字正常；所有波形柱 `animation-name: none`（`noAnimationUnderReducedMotion: true`），无显现变暗 | `S5-reduced-motion/S5.mp4`、`log.json` |
| S6 | 拦截所有 `*.js` 的整页截图 | PASS：无 `data-reveal` 属性（内容首帧 100%）、Hero 卡与 Guides 卡都在、波形静态、页高 2574 | `S6-no-js/nojs-*.jpg` |
| S7 | `?motion=0` 与默认的 DOM 矩形比对 | PASS：12 个关键元素位置/尺寸 0 差异 | `S7-static-compare/` |

## 2. 逐项状态（清单 §1）

| 编号 | 状态 | 实际结果 | 证据 |
|---|---|---|---|
| M-B1 Hero 主卡波形 | PASS | loading 期间 static；`playing` 后 running（`v2-wave`，各柱时长 1100+(i mod 5)×100 ms、延迟 −(i mod 7)×100 ms、alternate、ease-in-out、origin center）；暂停冻结不回原位；切到 See & Hear 后立即 static。页面不可见 → paused、可见后恢复 running、音频不受影响（`visibilitychange` 为脚本模拟，无头环境无真实后台切换） | S2；`S2-audio-exclusive/visibility-log.json`；`css-evidence.txt` |
| M-B2 See & Hear 波形 | PASS | 独立验证同 M-B1，切回 Hero 时立即 static | S2 步骤 see-play / see-pause / see-resume；`03-see-playing.jpg` |
| M-B3 Guides 两卡五柱 | PASS | 只有正在播的卡 running；Hear Milo 时 Mia 卡即时 static | S2 `04-mia-playing.jpg`、`05-milo-playing.jpg` |
| M-B4 图标与状态文字 | PASS | Hero：Hear the story / Preparing（按钮 disabled）/ Pause / Resume / Retry；播完显示 `3 / 3` 且可重播（再次点击 → Pause、`1 / 3`）；See & Hear / Guides 文案按现有 UI 切换；错误态 Retry（S3） | S2、S3；`S2-audio-exclusive/replay-log.json`、`06-hero-done.jpg` |
| M-D2 Moment 组 | PASS | 1440×900 挂载时组顶部已在视口内 → 直接 done，无先暗后亮；`?motion=0`、减少动态、无 JS 均为 1 | S1 `log.json`（loaded: `["done","pending","pending"]`）、S5、S6 |
| M-D3 See & Hear 组 | PASS | 挂载时完全在视口下方 → pending(0.8) → 首次可见 ≥30% 走 revealing 300 ms → done；滚回不重播 | S1 |
| M-D4 Guides 组 | PASS | 同 M-D3 | S1 |
| M-U1 真实按钮与胶囊链接 | PASS | 内部视觉容器 `.v2-btn` 按压 `scale(0.98)`、150 ms、`cubic-bezier(0.2,0,0,1)`；外部命中区不变（S4）；hover 只在 `@media (hover:hover) and (pointer:fine)` 内（生产 CSS 摘录）；`motion-reduce` 下缩放回 100%、无过渡；`touch-action: manipulation` | S4；`css-evidence.txt` |
| M-U2 文字链接 | PASS | 仅颜色 150 ms 过渡与焦点样式，`fine:hover` 变色，无缩放；行为不变 | `css-evidence.txt`；S7（位置无差） |
| M-N1 页内锚点 | PASS | 挂载期间 `html[data-rr2-smooth]{scroll-behavior:smooth}`，减少动态下 `auto`；实测滚动容器 `document.scrollingElement = HTML`（S1/S2 日志 `scrollingElement`、`smooth: true`）；`?motion=0` 不加标记 | S1 `log.json`；生产 HTML 内联样式摘录 |

无 FAIL / BLOCKED 项。已取消项（A、C、原 M-D1、全段位移、按句进度条）未实现，保持静态。

## 3. 需要说明的地方

- **S4 取证方式**：无头 Chrome 的合成 `Input.dispatchTouchEvent touchStart` 不会让元素进入 `:active`（手势识别不完整），先后两次 FAIL 均为此；脚本改为触摸未激活时回退到手机仿真下的 `Input.dispatchMouseEvent mousePressed`（同一 375×812 `mobile:true` 视口），`:active` 为 true，读到 `scale: 0.98`。另一个早期 FAIL 是脚本读了 `transform`，而 Tailwind 4 的 `scale-[0.98]` 编译为独立 CSS `scale` 属性。真机触摸未测（见上线报告 P04）。
- **性能对比**（清单 §4，生产构建预热后，`?motion=0` 关 vs 默认 开，各 3 轮交替取中位数，1440×900；原始 trace 见 `perf/trace-off.json`、`perf/trace-on.json`，可拖入 DevTools Performance 复看）：

  | 阶段 | 指标 | 关 | 开 | 开 − 关 |
  |---|---|---|---|---|
  | 首屏 5 s | TaskDuration / 长任务(≥50 ms) / CLS | 99.2 ms / 0 / 0 | 83.8 ms / 0 / 0 | −15.4 ms（噪声内） |
  | 一次滚动（到底回顶） | TaskDuration / Layout 次数 / 样式重算 | 22.1 ms / 0 / 0 | 32.8 ms / 2 / 22 | +10.7 ms / +2 / +22（显现组 opacity 过渡） |
  | 一次播放（playing 后 3 s） | TaskDuration / Layout 次数 / 样式重算 | 22.8 ms / 2 / 2 | 88.7 ms / 2 / 121 | +65.9 ms / 0 / +119（波形 `scaleY` 动画每帧样式更新） |

  两种模式在三阶段均无长任务（页面 PerformanceObserver 与 trace `RunTask ≥ 50 ms` 双口径均为 0），CLS 为 0，开启动效不增加布局次数（滚动阶段 +2 次布局来自显现组过渡触发的合成更新）。新增开销主要是运行中的波形动画每秒约 40 次样式重算、约 2% 单核，播放停止后归零。只对上述新增开销负责，不宣称全页无长任务。
- **工程**：`pnpm exec tsc --noEmit` 0 错误；`pnpm lint` 0 错误、6 条既有 `@next/next/no-img-element` 警告（V2 的 `<img>`，之前已登记）；`pnpm build` 通过；七宽 `data-check` 与整页无横向溢出见上线报告 P02。
- **静态降级**：无。未关闭任何已列入的动效。

## 3.1 分屏改造后的复测（2026-09-16 晚些时候）

`SITE-V2-HERO-TRANSITION-REQUIREMENTS-20260916.md` v2 落地后，页面从 2574px 的长页变成六屏 5400px、统一容器改为 90vw/1800px、首屏满铺、新增首屏出口转场与手机菜单。动效逻辑文件（`Waveform`/`WaveBars`、按钮类、`useScriptedSpeech`、`Reveal`）未改，`MotionRoot` 增加了分屏开关与锚点焦点两件事。
动效全套 S1–S7 已在新布局的开发服务器上重跑：批次 `docs/screens/site-v2-motion/2026-09-16T09-11-54/`，**七项全部 PASS**。其中两处是取证方式随页面变高而修正，不是实现回退：
- S1 原先固定滚到 3000px，新页面 5400px 够不到 Guides，显现组停在 pending；改为滚到真实页底。
- S7 原先用平滑滚动回顶后立刻量矩形，没走完就采样；改为 instant 滚动并忽略 `display:none` 的零尺寸元素（它们的 y 只反映当时的 scrollY）。

## 4. 结论

清单 v2 列出的 M-B1–B4、M-D2–D4、M-U1、M-U2、M-N1 全部 PASS，证据齐全；动效阶段完成。分屏改造后已整套复测通过（§3.1）。移交上线阶段的版本标识：提交 `85b07bd` + 分屏改造的工作区改动（见 `SITE-V2-HERO-TRANSITION-SELF-CHECK-20260916.md` §1）。
