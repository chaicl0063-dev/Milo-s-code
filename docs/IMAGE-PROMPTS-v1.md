# ReAround You · 配图提示词 v1

2026-09-14。依据 PRODUCT-BRIEF v3 与 Claude 已登记槽位。**Codex 审核提示词，用户手动生成，Claude 接入。** 本文是可执行初稿，图像仍需实际生成后验收；不保证一次生成即满足构图。

## 先做哪几张

先做 IMG-01、IMG-02、IMG-03，确认人物与质感再扩展。以下每个英文代码块可单独复制。比例在生成工具里另设，不把尺寸当作画面文字。所有图像均不生成 UI、文字、地图或路线。

IMG-01 已有一张 Codex 生成的构图参考，未接入项目；用户随后要求改为手动生成，因此后续不再由 Codex 调用生图。

## IMG-01 · 首屏横图 · 16:9

设计意图：人在街上发现一个细节，直接对应“看懂这里”。避免泛旅游远景。桌面左侧文字、右下演示会遮住图像，因此人物的脸和所看的细节必须在中上部。

```text
Create an original editorial travel photograph-style mood image for ReAround You, a local AI walking guide. Landscape 16:9, at least 1920 by 1080 if supported. Eye-level view along a lived-in historic street with warm plaster and carved architectural details, subtle Southeast Asian character but no identifiable real landmark. One adult traveler in understated cream clothing pauses to look up at a facade detail. A few distant everyday pedestrians make the street feel inhabited. Natural late-afternoon side light, believable skin and stone textures, restrained cream, terracotta, charcoal and foliage colors, subtle film grain. Curious, spontaneous, approachable; not a luxury fashion campaign.
Place the traveler's face and the architectural detail in the upper-middle region, around 58–65 percent across and 25–40 percent down. Keep the lower-left 40 percent quiet and shaded for website text. Keep the lower-right quarter visually simple for a separate interactive panel. Use natural shadow, not a baked-in black gradient. Preserve useful content within the middle half of the frame. No text, readable signs, logos, watermark, UI, phone mockup, maps or routes. This is a fictional brand mood scene, not documentation of a real location.
```

验收：脸不被标题或演示遮挡；画面有“正在观察”的动作。当前横图同时承担文字和手机演示，容易拥挤，建议按设计方案减少叠加内容。

### 手机独立版 · 4:5

横图不能可靠保证竖屏裁切。选定横图后，以它作参考图，再使用：

```text
Using the attached selected hero image as the visual reference, create a separate portrait 4:5 composition of the same traveler, clothing, street materials, lighting and editorial photographic style. Keep the traveler looking up at the same architectural detail, with their face and the detail in the upper two-thirds. Preserve a quiet lower quarter. Recompose naturally for portrait; do not stretch the original or add borders. No text, logos, UI, map or phone mockup. This is a fictional brand mood image.
```

手机建议图片下方排标题与操作，不将全部桌面文字压进竖图。

## IMG-02 · Mia · 1:1

先采用自然照片感。角色是虚构 AI 导游，不暗示她是受雇的真人当地导游。Mia 与 Milo 区别主要靠表情、发型和轮廓，衣服颜色只是辅助。

```text
Create a square editorial portrait of Mia, a fictional female AI guide character for ReAround You. An approachable adult woman around her early thirties, dark brown shoulder-length hair tucked behind one ear, a calm attentive expression and a small natural smile, looking toward the viewer. Close head-and-shoulders crop, face centered, entire hair silhouette inside a circular safe area, face occupying about half the image height. Muted terracotta overshirt over a cream top. Plain warm off-white background, soft daylight from upper left, believable skin texture, subtle photographic grain, understated editorial photography, no glamour retouching. Convey curiosity and warmth, not a corporate headshot or a fashion advertisement. Clear silhouette and simple shapes readable as a tiny 24-pixel avatar. No objects, jewelry clutter, microphone, headset, text, logos, watermark, frame or UI. Original fictional person, not a celebrity or a real local guide.
```

验收：缩到 24px 后仍有人脸与发型辨识；圆形裁切不切下巴/头发；不是大半身照。建议原图至少 1024×1024，由 Claude 输出 48/96/300/600px 版本。

## IMG-03 · Milo · 1:1

生成时附上选定的 Mia 作为**风格参考**，不是换性别或复制其面孔。

```text
Create a square editorial portrait of Milo, a fictional male AI guide character for ReAround You. Use the attached Mia portrait only as a reference for background color, lighting, camera distance, texture and visual finish; create a distinct person. An approachable adult man around his mid-thirties, short slightly wavy dark hair, a relaxed open smile and lively attentive eyes, looking toward the viewer. Close head-and-shoulders crop, face centered, entire hair silhouette inside a circular safe area, face occupying about half the image height. Muted deep-teal overshirt over a cream top. Plain warm off-white background, soft daylight from upper left, believable skin texture, subtle photographic grain. Friendly storytelling energy without exaggerated expression. Clear silhouette readable as a tiny 24-pixel avatar. No objects, microphone, headset, text, logos, watermark, frame or UI. Original fictional person; do not model him on the project owner or a celebrity.
```

如果两张真人感太强，才一起尝试插画版，替换两条提示词中的摄影风格为：`Painterly editorial portrait, subtle gouache texture, restrained simplified facial detail, mature proportions, no cartoon exaggeration or 3D rendering.` 不建议先混用一张照片一张插画。

## IMG-04a · Look · 约 33:28，兼容 4:3

```text
Original editorial travel photograph-style image, near-square landscape 33:28. A candid side view of one casually dressed adult pausing on a lived-in historic street to study a small carved detail above a doorway. Emphasize the relationship between the person's upward gaze and the architectural detail, rather than a wide street panorama. Warm natural morning light, textured cream plaster, muted terracotta, subtle film grain. Keep the head and architectural detail in the upper two-thirds, with a quiet darker lower third for a separate website caption; composition must also tolerate a 4:3 crop. No text, readable signs, logos, watermark, UI or invented identifiable landmark. Fictional brand mood scene, not documentary evidence.
```

备注：当前键名 PHOTOS.eat，建议 Claude 后续改为 look，避免题材与名字错配。

## IMG-04b · Walk · 4:3

```text
Original editorial travel photograph-style image, landscape 4:3. One casually dressed adult walking away through an intimate lived-in lane, with a natural bend suggesting the next discovery. Human scale, worn paving and warm plaster, a few small signs of everyday life but no readable signage. Soft late-afternoon daylight, believable muted colors, subtle grain. Place the traveler above the center; keep the bottom third quiet and shaded for a separate caption. Inviting everyday exploration, not an empty cinematic alley or a tourist-group excursion. No text, logos, watermark, phone UI, map, arrows or route lines. Fictional brand mood scene.
```

## IMG-04c · Listen · 4:3

```text
Original editorial travel photograph-style image, landscape 4:3. An intimate eye-level view of a richly textured historic facade with a modest bell tower catching the last warm light of the day. Nearby everyday street life is visible at a small scale. Focus on one architectural detail a walking guide might explain, not a distant city skyline. Muted cream stone, warm highlights, soft charcoal shadows and subtle photographic grain. Architectural interest in the upper two-thirds, lower third quiet and darker for a separate caption. No text, readable signs, logos, watermark, sound-wave graphics, UI or recognizable real landmark. Fictional brand mood scene; no claim of a particular monument's history.
```

## IMG-05 · 路线区氛围图 · 4:3 · 有条件使用

**先调整表现方式：透视照片上的编号和虚线容易被理解为真实路径。** 路线请放在独立地图层或旁边的地图组件中；照片只作氛围背景。若保留叠图，只可明确标为抽象顺序示意，不能让编号假装对应照片中的可导航位置。真实地点评介应使用可核验实景图，不能用这张替代。

```text
Original editorial travel photograph-style mood image, landscape 4:3. A modest open neighborhood square with warm historic facades, textured paving, a few distant pedestrians and an inviting side street. Eye-level natural perspective, warm gentle afternoon daylight, muted cream and terracotta colors, subtle film grain. Keep the central paving area visually uncluttered, with architectural interest around the upper edges. No text, readable signs, logos, watermark, numbers, lines, maps, route graphics or UI. Fictional square for brand atmosphere only, not a representation of a real route or stop.
```

## IMG-06 · 傍晚场景屏 · 8:3

```text
Original editorial travel photograph-style mood image, wide panoramic 8:3. A human-scale neighborhood lane at dusk, viewed at eye level. Warm light from a doorway or window on the right, a small pedestrian silhouette in the right half, textured plaster and gentle blue-gray evening ambience. Keep the left 60 percent naturally darker and low in visual detail for a separate text overlay. Realistic quiet warmth with signs of life, not ominous, deserted or neon-lit. Subtle grain, restrained warm and charcoal palette. No text, readable signs, logos, watermark, UI or identifiable real landmark. Fictional brand mood scene.
```

手机不强行从横幅裁出同样构图：可仅展示右侧照片，文字置于独立深色区。若本段没有新增内容，可删屏，不必为已生成的图保留长页面。

## 交付与接入核对

- 编号以 Claude 最新槽位表为准：IMG-05 是路线，IMG-06 是傍晚屏，覆盖旧表中 IMG-05 的情绪段含义。
- 用户将选定原图按编号放入 assets/generated/；Claude 优化后放 public/images/，登记尺寸、裁切焦点、用途和生成属性到 IMAGE-MANIFEST.md。
- 人物图只用于角色/品牌展示，不冒充用户评价。生成街景不配具体地名或“真实拍摄”署名；真实地点的照片继续保留其准确来源。
- 网页文字、按钮、声波、图钉、路线均由组件绘制。照片上文字对比度在实际布局验收；不能仅靠 prompt 中的“留暗”保证。
- 验收桌面首屏、390px 手机和 24px 头像；检查手部、人物比例、建筑结构、裁切、过度磨皮和伪文字。首屏人物与地图演示不得重叠挡脸。
- Prompt 状态：已完成人工语义与槽位检查，尚未完成各最终图片的视觉验收。不同生成工具可能需要调整提示词长度和构图。
