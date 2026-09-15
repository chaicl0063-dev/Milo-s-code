# ReAround You 官网快速上线设计需求 v1

> 用途：供 GPT Work / Claude / Codex 等协作者直接执行  
> 目标：在不扩展产品范围的前提下，快速完成官网视觉重构并上线  
> 原则：产品先讲清楚，再建立旅行氛围；先上线，再通过真实用户反馈继续优化

---

## 1. 本轮目标

这次不是重新设计品牌，也不是追求“最终版官网”。

唯一目标是：

> **让第一次进入网站的人，在 3–5 秒内明白：这是一个站在陌生城市里使用的本地 AI 导游。**

用户应该快速理解三个动作：

1. 看到一个地方
2. 听它的故事
3. 继续探索附近

本轮优先解决两个问题：

| 问题 | 本轮目标 |
|---|---|
| 产品主题不够直接 | 首屏直接展示产品是什么、怎么用 |
| 旅行品牌感强、科技产品感弱 | 改成浅色科技产品骨架，旅行感主要由摄影承担 |

### 本轮不做

- 不新增产品功能
- 不改变产品定位
- 不重写商业模式
- 不增加页面数量
- 不扩展 Plus
- 不开发 Android
- 不为了视觉重构业务逻辑

---

## 2. 产品判断基准

ReAround You 的核心不是“我要去哪”，也不是“我要订什么”。

核心场景是：

> **用户已经站在这里了，抬头看见一个东西，希望马上知道它是什么、有什么故事、接下来附近还能去哪。**

官网首先要卖的是第一层能力：

> **看懂这里**

其次才是：

> **继续探索**

便利工具与记录功能不是首页重点。

---

## 3. 总体视觉方向

### 关键词

**Light Tech / Clear / Urban / Human / Product-first**

整体视觉不是纯旅行品牌，也不是典型 SaaS。

目标是：

> **科技产品的骨架 + 城市旅行的内容**

### 参考案例及用途

#### Semaloop — 60%

用于：

- 浅色科技视觉
- 大字号 Sans Serif
- 细边框
- 白 / 浅灰背景
- 卡片秩序
- 清晰的信息层级
- 页面编号节奏

不要照搬 SaaS 语言。

#### Android Auto — 20%

用于：

- 真实世界场景和产品 UI 同时出现
- “在哪里使用”与“如何使用”同时表达
- 产品状态直接嵌入真实环境

重点学习：

> 环境负责说明场景，产品 UI 负责说明功能。

#### Airmee — 10%

用于：

- 长页面里“现实场景 ↔ 产品界面”的节奏
- 生活场景与技术产品交替出现
- 避免整页都是卡片

#### Atlas Card — 10%

仅用于：

- 大幅旅行摄影
- 城市氛围
- 页面节奏转换

不要借：

- 奢华信用卡风格
- 暗色主视觉
- Concierge 语气
- 高端消费感

---

## 4. 视觉系统

### 4.1 背景

主背景建议：

```css
#F7F8FA
```

或非常接近的冷浅灰。

Surface：

```css
#FFFFFF
```

不要继续让大面积奶油黄承担品牌识别。

旅行的暖度由摄影产生，而不是 UI 本身产生。

---

### 4.2 文字

主文字：

```css
#171717
```

Secondary：

使用冷灰色。

避免纯黑。

---

### 4.3 Accent

只保留一个主科技色。

建议从以下方向选一个：

- Blue
- Cyan
- Teal

例如：

```css
#2563EB
```

或更偏品牌感的青蓝：

```css
#167C80
#168FA0
```

Accent 只用于：

- CTA
- 地图定位点
- 播放状态
- 当前选中状态
- 链接
- 少量交互反馈

不要同时使用多个高饱和主色。

---

### 4.4 Border

大量使用极淡蓝灰色 `1px border`。

科技感主要来自：

- Grid
- Border
- Spacing
- Typography
- Product UI

不是：

- Glow
- Aurora
- Gradient
- Glassmorphism

---

### 4.5 Shadow

只使用极轻阴影。

避免明显漂浮式 SaaS 卡片阴影。

---

### 4.6 圆角

现有大图与卡片 `20px` 可以继续保留。

按钮继续保留 pill。

不要为了科技感把所有组件改成锐角。

---

## 5. 字体

本轮弱化 Instrument Serif。

### 产品部分

首屏、产品演示、功能 Section：

> **全部使用现代 Sans Serif**

可继续使用：

- Manrope

后续如果需要统一也可考虑：

- Geist
- Inter

### Serif 的使用范围

Instrument Serif 只允许保留在：

- 旅行场景标题
- 导游语录
- 少量 Editorial 内容

不要再用它承担产品核心标题。

原则：

> **产品定义先于品牌情绪。**

---

# 6. 首页结构

---

## Screen 01 — Hero

### 目标

> **3 秒知道这是什么。**

### 导航

保持极简。

不要增加复杂导航项。

### 左侧内容

小标签：

```text
AI LOCAL GUIDE
```

主标题优先方案：

```text
Understand the place you're standing in.
```

备选：

```text
See what's around you. Hear the story behind it.
```

副标题：

```text
See what's around you, hear the story behind it,
ask questions, and keep exploring.
```

主 CTA：

```text
Try your local guide
```

次 CTA：

```text
See how it works
```

### 右侧内容

不要再让旅行品牌照片成为主体。

改成：

> **真实 ReAround You 产品 UI / 高保真产品 Mockup**

至少要看到：

- 地图
- 一个地点
- 地点名称
- Hear the story
- Mia 或 Milo
- 一句讲解
- 播放状态 / 声音状态

用户即使不读全部文字，也应该从右侧明白：

> 地图上的地方 → 点一下 → 导游开始讲。

### 禁止

Hero 不使用：

- 抽象 AI 图
- 大片纯旅行摄影作为主体
- 复杂 3D 手机飞入
- 紫蓝 AI 渐变
- Aurora
- WebGL

---

## Screen 02 — The Moment

这里使用现有品牌句：

```text
You're already here. Now let's look around.
```

它不再承担产品定义，而承担品牌观点。

### 视觉

这一屏可以第一次大面积使用城市摄影。

建议：

- 街景
- 行走中的人物
- 眼前建筑
- 城市细节

### 内容目标

表达：

> 你已经在城市里。  
> 你看见一个不知道是什么的地方。  
> ReAround You 从这里开始。

这一屏负责旅行感。

---

## Screen 03 — See

编号：

```text
01 SEE
```

标题：

```text
What's that building?
```

### 展示内容

使用：

- 地图
- 地点卡
- 当前定位
- 附近地点
- 进入讲解的动作

重点展示：

> 用户如何从现实位置进入一个具体地点。

尽量使用真实 App UI。

不要画一个不存在的 marketing illustration。

---

## Screen 04 — Listen

编号：

```text
02 LISTEN
```

标题：

```text
Hear the story behind it.
```

### 展示内容

- Mia / Milo
- Audio state
- 一小段讲解文字
- 提问输入框
- 播放 / 静音状态

这是产品核心能力。

视觉权重必须高于路线规划。

---

## Screen 05 — Keep Exploring

编号：

```text
03 KEEP EXPLORING
```

标题：

```text
An hour to wander?
```

### 展示内容

- 一小时路线 UI
- 编号地点
- 地图
- 路线顺序
- 城市步行摄影

这一屏借 Android Auto 的核心方法：

> **产品行为 + 使用环境同时出现。**

### 不展示

不要在这里展示：

- 未开放的复杂路线编辑
- 未来 Plus 的完整规划能力
- 餐饮能力
- 不确定功能

---

## Screen 06 — Guides

标题：

```text
Choose who's walking with you.
```

### 内容

Mia / Milo 两位导游。

展示：

- 肖像
- 性格差异
- 声音试听
- 选择状态

不要做成：

> 两张普通 Team Member 卡片。

应该更像：

> Voice / Guide selection

---

## Screen 07 — Real-world Break

这一屏用于页面节奏转换。

参考 Atlas 的“大幅摄影”用法。

接近满宽的大城市摄影。

只保留一句简短文案。

例如：

```text
Look up. There's more around you than you think.
```

作用：

- 让长页面喘气
- 强调产品存在于现实世界
- 避免整站都像桌面 SaaS

---

## Screen 08 — Free / Plus

保留，但降低视觉优先级。

不要做成典型 SaaS Pricing Battle。

### Free

作为当前主要产品状态。

### Plus

显示：

```text
Coming soon
```

只简洁说明未来价值。

Plus 核心价值仍然是：

> 可保存、可调整、可持续执行的长路线体验。

不要把普通 AI 问答错误地包装成付费特权。

---

## Screen 09 — Final CTA

回到浅色产品界面。

标题保持直接。

建议：

```text
Start with the street you're on.
```

CTA：

```text
Try your local guide
```

不要再增加新功能说明。

---

# 7. 摄影原则

摄影不再承担“解释产品”的任务。

新的分工：

## Product UI 负责

- 产品是什么
- 怎么操作
- 能做什么

## Photography 负责

- 为什么我会想在现实世界使用它
- 城市是什么感觉
- 探索是什么感觉

### 摄影主要出现位置

- Screen 02
- Screen 05
- Screen 07

不要所有 Section 都塞一张图。

### 摄影方向

继续保持：

- 自然光
- 城市
- 人物
- 街景
- 编辑旅行摄影
- 真实使用情境

不要变成：

- Booking
- Klook
- Airbnb 式目的地大片
- 纯景区宣传照

---

# 8. 产品 UI 展示原则

核心规则：

> **尽量展示真实产品，不重新设计一个不存在的“营销版 App”。**

如果现有 App UI 不够漂亮，可以：

- 裁切
- 隐藏无关控件
- 调整 Mockup 比例
- 改变展示背景
- 优化截图 framing
- 对 marketing 展示做轻微清理

但不要：

- 重画一个产品里不存在的界面
- 为官网做一套假 UI
- 承诺产品当前没有的能力

目标：

> 官网看到的东西，用户进入产品后能找到。

---

# 9. 动效

本轮只做三类。

## Hero

轻微淡入。

## Product UI

允许非常轻的状态变化：

- Map pin 激活
- Audio 开始播放
- 一句 Mia / Milo 文本出现
- 简单选中状态

## Scroll

普通 Section reveal。

### 明确禁止

- 3D 飞手机
- WebGL
- 复杂 Parallax
- Aurora background
- Scroll-jacking
- 大量 floating elements
- 重型动画库只为了视觉效果

原则：

> 动效不能成为上线延期的原因。

---

# 10. 移动端

不要先做桌面，再最后补手机。

每完成一个 Section，同时检查移动端。

### 手机 Hero 顺序

```text
AI LOCAL GUIDE

Headline

Subheadline

CTA

Product UI
```

不要出现：

> 标题 → 巨大摄影 → 再滚两屏才看到产品

手机端应该比桌面端更直接。

---

# 11. 本轮禁止修改

执行 Agent 不得：

- 重新设计产品 IA
- 改变 Around / Guide / Me 三 Tab
- 新增新功能
- 做餐饮
- 开发 Plus
- 开发 Android
- 改变 Mia / Milo 产品定位
- 增加虚假用户评价
- 增加虚假 Logo wall
- 增加虚假数据
- 使用 “AI-powered”
- 使用 “intelligent”
- 使用 “smart”
- 使用 “seamless”
- 使用 SaaS 式三列图标 Feature Grid
- 增加紫蓝渐变 AI 风
- 增加大量新文案
- 重新定义商业模式

这些都不属于本轮。

---

# 12. 验收标准

不要用：

> “看起来更漂亮了”

作为验收依据。

只检查以下内容：

| 项目 | 通过标准 |
|---|---|
| 产品识别 | 首屏 3–5 秒知道这是本地导游 |
| 产品展示 | Hero 首屏直接看到 App UI |
| 视觉方向 | 白 / 浅灰科技产品感明显 |
| 旅行感 | 仍然有真实城市、人物和探索氛围 |
| 核心路径 | See → Listen → Explore 顺序明确 |
| Mobile | 手机上不需要滚动很久才看到产品 |
| 性能 | 不因为设计加入明显重型资源 |
| 功能稳定 | 现有官网入口和 App 链接不被破坏 |
| 工作量控制 | 不新增非必要页面和功能 |
| 承诺边界 | 只展示当前真实可用能力 |

满足这些即可上线。

---

# 13. GPT Work 与 Claude 的分工

继续采用：

> **GPT Work 做决策与验收**
>
> **Claude 做前端执行**

但工作流必须压缩。

---

## 13.1 GPT Work — 角色

定位：

> 产品负责人 / 设计负责人 / QA

负责：

- 读取 PRODUCT-BRIEF
- 读取本设计需求
- 核对现有网站
- 冻结设计方向
- 判断实现是否偏离
- 最终验收
- 只提出 Blocking Issues

GPT Work 不再做：

- 大量继续找风格
- 不断提出新方向
- 随机换参考
- 每轮重新设计 Hero
- 上线前继续扩大范围

---

## 13.2 Claude — 角色

定位：

> 前端执行负责人

Claude 的任务：

> 按已批准的设计需求修改现有官网。

必须遵守：

- 不新增 Section
- 不新增产品功能
- 不改变产品逻辑
- 不重写商业模式
- 不自行探索新设计方向
- 优先复用现有组件
- 优先复用真实 App UI
- 保证 Mobile
- 保证现有功能不被破坏

### 推荐执行指令

```text
按照已批准的 ReAround You 官网快速上线设计需求，
修改现有官网。

不要重新定义产品，不增加功能，不增加 Section，
不增加新的设计方向。

首先完成：
1. Hero
2. Screen 02 – The Moment
3. Screen 03 – See
4. Screen 04 – Listen
5. Screen 05 – Keep Exploring
6. 全站基础 visual tokens

保持现有产品业务逻辑。

完成后提交：
- 桌面截图
- 手机截图
- 修改文件列表
- 视觉 token 说明
- 尚未解决的问题

不要自行继续优化下一轮。
```

---

# 14. 快速上线流程

目标：

> **2–3 个有效工作日完成本轮改版并上线。**

---

## 阶段 A — GPT Work

时间上限：

> 半天以内

任务：

- 读取现有 PRODUCT-BRIEF
- 读取本需求
- 检查现有官网
- 将需求映射到现有 Section / Component
- 输出 implementation spec

完成后：

> **冻结设计方向。**

不再继续搜风格。

---

## 阶段 B — Claude

时间：

> 1–1.5 天

先完成：

- Hero
- See
- Listen
- Keep Exploring
- 全站视觉 Token
- Mobile

优先改外壳，不重构业务。

---

## 阶段 C — GPT Work QA

时间上限：

> 半天以内

只检查：

- 错位
- 移动端
- 信息层级
- 首屏是否一眼看懂
- 是否违反 PRODUCT-BRIEF
- 是否展示了不存在的功能
- 是否引入不必要的性能问题

只列：

> Blocking Issues

不要开启第二轮设计探索。

---

## 阶段 D — Claude 修复

只修 GPT Work 提出的 Blocking Issues。

修完即上线。

---

# 15. 上线后原则

上线后不以“视觉还不够完美”为理由继续延迟。

接下来目标是：

> **让真实用户开始使用。**

重点观察：

1. 用户是否理解产品是什么
2. 是否点击 Try your local guide
3. 是否进入地点讲解
4. 是否真的播放第一句
5. 是否继续追问
6. 是否继续探索下一站

后续设计优化应优先由真实行为触发，而不是继续扩大参考库。

---

# 16. 本轮最终判断原则

任何设计决策，都问一句：

> **它是否让用户更快理解“我已经站在这里，它能告诉我眼前是什么”？**

如果答案不是明显的“是”，本轮就不要做。

---

## Final Principle

> **Product first. City second. Brand third.**
>
> **先讲清楚，再变漂亮。**
>
> **先上线，再优化。**
