# 交给 ChatGPT 的官网图片任务

日期：2026-09-16；项目 ReAround You。  
用途：把本文与目标图一起交给 ChatGPT，完成素材选择、必要生图和交接。本文是制作任务，不表示已经生成素材。

## 结论与清单

需要调整图片，但不需要整套重新生成。

| 素材 | 是否需要 | 处理方式 |
|---|---|---|
| Hero 主图 | 必须换掉现有高处夕照塔景的主场景用途 | 优先寻找可合法使用、可核实地点的真实街头照片；不能用生成图冒充实名地标 |
| Moment 场景/细节 | 需要与新主图配套 | 优先真实照片或从合适原图裁切；内容须能支持讲解 |
| 地图 | 需要重做呈现，但不生图 | 由 Claude 用真实地理数据、真坐标绘制 |
| 路线旁氛围图 | 可选，布局需要时才生成 | 一张自然日光、行人尺度的虚构城市街景 |
| Mia/Milo 肖像 | 暂不重做 | 保持身份与现有试听一致，先统一裁切 |
| 独立 CityBreak | 本轮不制作 | 最新建议取消独立大图屏，避免无用生图 |
| CTA 插图 | 暂不制作 | 先用简洁背景完成，确有必要再补 |

目标图：assets/reference/site-v4-sample-b-1455.png；与用户上传“Codex 图像 2026年9月15日 14_55_12.png”相同。它是多个参考案例取舍后的综合效果，不是地理事实或功能规格。

## 可直接发送给 ChatGPT 的任务正文

我在制作 ReAround You 的 AI 本地导游官网。请把我附上的 B 样张作为视觉目标：明亮街头、自然日光、轻科技蓝色信息层、真实场景与紧凑产品卡融合。产品体验是“看到附近地点 → 选中或主动拍照识别 → 听故事 → 追问 → 继续探索”。

本轮先处理 Hero 主素材和配套 Moment，不要生成整套网站，也不要把文字、UI、图钉、地图、距离、路线烘焙进图片。这些由前端根据真实信息叠加。

### 第一步：优先找真实 Hero 素材

演示地点目前为巴黎圣雅克塔 Tour Saint-Jacques。请寻找 2–3 张适合官网的真实街头视角候选，并核验来源与使用条件，选出一张推荐。候选不要求下载无法取得使用权的原图。

画面要求：
- 人站在街道或步行公共空间能看到的视角；可以自然仰视高塔，但不采用屋顶、航拍、高处俯视作为“你站在这里”的背景。
- 建筑可辨认，有街道、行人或树木提供尺度；明亮自然，不是橙红夕照、豪华旅游海报或过度调色。
- 能容纳一个产品卡，卡片位置与地标主体不冲突；无需强求照片留白与参考图完全一致，前端可以配合照片调整。
- 桌面原图尽量宽 2000px 以上；优先有足够内容裁成横向约 3:2、手机约 4:5。
- 保留真实建筑、道路与周边关系，不生成、搬移或替换地标建筑来凑构图。

每张候选说明：来源页、摄影者、许可/授权条件、原始尺寸、地标核验依据、是否适合手机裁切，以及拟放主卡的区域。不能把搜索引擎缩略图当成授权来源。

若无法联网或无法核验来源，明确列出缺口，不编造链接、摄影者、许可或“这是某地”的证明。若没有合适素材，先报告限制并给出构图降级方案；不要自动改演示城市。

### 第二步：为推荐素材制定横竖裁切

交付一张原图及桌面、手机裁切方案；能合法取得文件时再交实际图片。地标主体在两个比例下均应清楚。标注主体位置、可叠卡区域和不能遮挡的建筑细节。

本阶段不在照片上放 YOU。只有拍摄位置、地面落点及方向都有证据，才能另行提出位置叠层建议。地标是对的，不等于可以随意放用户位置或标距离。

### 第三步：配套 Moment

优先同地标不同真实视角或能看清细节的裁切，用来说明“选中这个地点之后，知道该看哪里”。不要仅换裁切却重复同一张远景的全部内容。

若讲解提到雕像、门窗、铭文，图上应确实可见；看不清时换图或换用已核验且看得见的内容，不能生成细节填补。

### 第四步：只有布局需要时生成一张氛围图

这张图只能代表虚构城市散步情境，不命名真实地标，也不作为三站路线中的某一站照片。

英文生成提示词：
Create an original photorealistic editorial street photograph for a light, product-focused local walking guide website. Eye-level pedestrian viewpoint in a believable European city street, soft natural daylight, pale stone and restrained warm materials, a few casually dressed walkers at a natural scale, realistic street depth and coherent architecture. Keep the scene bright and calm, with useful space for a separate interface overlay. No identifiable famous landmark, no claim of a specific real location, no text, logos, map, pins, route lines, interface panels, phone mockups, dramatic sunset, cinematic grading, excessive blur or glossy travel-ad styling. Landscape 3:2 composition with a central subject arrangement that also permits a 4:5 crop.

生成后检查：人物、建筑透视、道路连接、阴影方向、可裁切性。明确标为 AI 生成的虚构氛围图，不声称它是真实巴黎街道。

## 交付给 Claude 的素材登记

每项至少填写：
- 文件名与用途；
- real_photo / generated_mood；
- 真实地标名（氛围图填无）；
- 来源、摄影者、许可及署名要求；
- 原始尺寸、横竖裁切；
- 建筑主体和 UI 可用区域；
- 是否可以放地标标记：依据是什么；
- 是否可以放 YOU/空间连线：默认不可以；
- 仍未确认的内容。

文件建议：hero-real-source、hero-desktop、hero-mobile、moment-real-detail、walk-mood-generated，加素材清单 Markdown。后缀根据实际格式填写。

若 ChatGPT 不能直接访问本机，交付可下载文件；用户统一保存到 D:\AI_Projects\tourguide\docs\image-handoff\。Claude 核验后再接入 public/images，记录映射。不可要求 ChatGPT 假装已写入 D 盘。

## 关键边界

示例标签不能让错误的空间关系变正确；AI 生图也不能修复真实地图。主图确认与地图核验应先于叠加 UI，后续更换图片必须重新检查所有标记与裁切。
