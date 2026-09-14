# 图片清单 · IMAGE-MANIFEST

原图放 `assets/generated/`（不进网页），网页用的优化版放 `public/images/`。全部是用户手动生成的 AI 品牌氛围图（虚构街景与角色），页脚统一注明；不再使用 Wikimedia Commons 照片（`public/site/` 已清空）。

| 编号 | 用途 / 组件 | 原图 | 网页版本 | 裁切焦点 / 位置 | 替代文本 | 状态 |
|---|---|---|---|---|---|---|
| IMG-01 | 官网首屏右栏 `PHOTOS.hero`（方案 A：左文右图） | `hero-img01-v1.png` 1672×941；竖版 `手机独立版.png` 1122×1402 | `hero-1672.jpg` 227 KB、`hero-1200.jpg` 129 KB（横图，暂未用于首屏）；`hero-portrait.jpg` 900×1125 176 KB（首屏实际使用，桌面与手机同一张） | 4:5 容器，`object-position: 50% 20%`，人物脸在上部；演示面板压在下沿 | A traveler pausing to look up at an architectural detail on a sunlit street. | 已接入 |
| IMG-02 | Mia 头像：官网导游区 150px、应用内 22–44px 圆头像（`PersonaAvatar`） | `IMG-02.png` 1254×1254 | `mia-600.jpg` 36 KB、`mia-300.jpg` 13 KB（应用用）、`mia-96.jpg` 3 KB | 圆形裁切，脸居中 | Mia, an AI guide character | 已接入 |
| IMG-03 | Milo 头像，同上 | `IMG-03.png` 1254×1254 | `milo-600.jpg` 32 KB、`milo-300.jpg` 12 KB、`milo-96.jpg` 2 KB | 同上 | Milo, an AI guide character | 已接入 |
| IMG-04a | Look 大图 `PHOTOS.look` | `IMG-04a.png` 1362×1155 | `look.jpg` 1320 宽 200 KB | 人物与雕花门在中上，底部暗渐变放标题 | A traveler looking up at a carved doorway on a quiet historic street. | 已接入 |
| IMG-04b | Walk `PHOTOS.walk` | `IMG-04b.png` 1448×1086 | `walk.jpg` 1200 宽 193 KB | 人物在中右 | A traveler walking away down a narrow lane… | 已接入 |
| IMG-04c | Listen `PHOTOS.listen` | `IMG-04c.png` 1448×1086 | `listen.jpg` 1200 宽 159 KB | 立面与钟楼在上三分之二 | A carved church facade and bell tower… | 已接入 |
| IMG-05 | 路线区 `PHOTOS.square` | `IMG-05.png` 1448×1086 | `square.jpg` 1200 宽 224 KB | 中部铺地留空，上叠顺序示意虚线与编号（已注明是示意） | A small sunlit square with warm facades… | 已接入 |
| REAL-01 | 首屏演示面板里的真实地点照片 `PHOTOS.demoPlace`（I01） | Wikimedia Commons `File:Tour Saint-Jacques au crépuscule.jpg`，Fabien Barrau，CC BY-SA 4.0 | `tour-saint-jacques-1280.jpg` 223 KB、`-720.jpg` 49 KB | 面板内 80×56 缩略图；页脚署名 | Tour Saint-Jacques in Paris at dusk… | 已接入（真实照片，非生成） |
| IMG-06 | 傍晚场景屏 `PHOTOS.alley` | `IMG-06.png` 2048×768 | `dusk.jpg` 1920 宽 151 KB | 左 60% 暗，文字在左 | A lane at dusk with light from a doorway… | 已接入 |

接入流程：用户把生成的原图按编号放进 `assets/generated/` → Claude 用 sharp 出网页版本（JPEG 80 到 85，需要时裁切）→ 更新 `lib/site/photos.ts` 与本表 → 桌面 1280 宽和手机 390 宽各看一次文字遮挡。
