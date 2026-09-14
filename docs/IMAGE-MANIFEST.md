# 图片清单 · IMAGE-MANIFEST

原图放 `assets/generated/`（不进网页），网页用的优化版放 `public/images/`。真实地点照片（Wikimedia Commons）仍在 `public/site/`，署名见 `lib/site/photos.ts`。

| 编号 | 用途 / 组件 | 原图 | 网页版本 | 裁切焦点 | 属性 | 替代文本 | 状态 |
|---|---|---|---|---|---|---|---|
| IMG-01 | 官网首屏背景 `PHOTOS.hero`，`components/site/SiteLanding.tsx` `<section id="top">` | `assets/generated/hero-img01-v1.png` 1672×941 PNG 2.3 MB | `public/images/hero-1672.jpg`（227 KB）、`hero-1200.jpg`（129 KB）；手机竖版 `hero-portrait.jpg` 753×941 裁切（人物居中，左边界 660px）再缩到 900 宽（152 KB） | 人物脸与雕花在 x≈62%、y≈20%；`object-position: 60% 35%`；左下暗墙留给文字 | AI 生成的品牌氛围图（虚构街景），不是真实地点照片，不署摄影来源 | A traveler pausing to look up at an architectural detail on a sunlit street. | 已接入（2026-09-14） |
| IMG-02 | Mia 头像 | 未生成 | 计划 48 / 96 / 300 / 600 px | 圆形安全区 | 虚构 AI 导游角色 | Mia, your guide | 待用户生成 |
| IMG-03 | Milo 头像 | 未生成 | 同上 | 同上 | 同上 | Milo, your guide | 待用户生成 |
| IMG-04a | Look 大图 `PHOTOS.look` | 未生成（现用 Commons：Breda Sint Janstraat） | | 上三分之二 | 品牌氛围图 | | 待用户生成 |
| IMG-04b | Walk `PHOTOS.walk` | 未生成（现用 Commons：Bukchon） | | | | | 待用户生成 |
| IMG-04c | Listen `PHOTOS.listen` | 未生成（现用 Commons：Tour Saint-Jacques） | | | | | 待用户生成 |
| IMG-05 | 路线区 `PHOTOS.square` | 未生成（现用 Commons：Praça de Almeida Garrett） | | 中部留空 | | | 待用户生成；接入时按 IMAGE-PROMPTS-v1 建议把路线放独立地图层 |
| IMG-06 | 傍晚场景屏 `PHOTOS.alley` | 未生成（现用 Commons：Rampe San Marcellino） | | 左 60% 暗 | | | 待用户生成 |

接入流程：用户把生成的原图按编号放进 `assets/generated/` → Claude 用 sharp 出网页版本（JPEG 80 到 82，需要时裁切）→ 更新 `lib/site/photos.ts` 与本表 → 桌面 1280 宽和手机 390 宽各看一次文字遮挡。
