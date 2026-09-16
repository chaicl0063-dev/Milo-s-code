# ReAround You — Homepage V2 Brief and Addenda

> 状态：**用户于 2026-09-15 给出的官网 V2 实施 Brief，以及同日后续四轮指令的原文**。这是 `/site-v2` 的依据，与 `docs/COLLABORATION.md` 第 28 节（每轮改了什么、用户结论）配套。
> 视觉目标图：`assets/reference/site-v4-sample-b-1455.png`（Phase 1B 起为首要视觉目标，不是灵感）。`site-v4-sample-a-1447.png` 只作对照。
> 事实边界见第 10 节；凡 Brief 与应用真实能力冲突之处，一律以真实能力为准，并在 COLLABORATION 里登记为「偏差」。

---

## Part A · 原始 Brief（2026-09-15，原文）

### 0. Mission

Create a completely new homepage presentation for ReAround You.

This is NOT a visual refresh of the existing `/site`. Treat the existing homepage only as a source of factual product content and working links. The new homepage must feel like a different website.

Primary goal: a first-time visitor should understand within 3–5 seconds that ReAround You is a local guide that helps them understand the place they are currently standing in.

Core product moment: See something → identify/select the place → hear the story → ask a question → keep exploring. The homepage itself should feel like a short demonstration of that experience. Do not redesign the product itself.

### 1. Development Strategy

Create `/site-v2` and `components/site-v2/`. Keep the current `/site` untouched until V2 is approved. Existing business/product components may be reused if useful, but do not inherit the old homepage layout or visual system. Once approved, `/site-v2` can replace `/site`.

### 2. Reference Direction (do not copy literally)

- **Semaloop** — borrow: light technology aesthetic, white / cool-gray space, strong sans-serif hierarchy, fine borders, restrained cards, product-first communication. Not: B2B developer-tool tone, dense SaaS IA.
- **Android Auto** — borrow: real-world environment and digital UI in one composition, overlays connected to real places, product shown in context not in a device mockup. Not: Google branding, Material look.
- **Airmee** — borrow: rhythm between real-world scenes and product interfaces, clean light-tech language. Not: logistics / enterprise tone.
- **Atlas** — borrow only: large-scale lifestyle/city photography as visual breaks. Not: dark luxury, premium-card tone.
- **Cryptonapp** — borrow only: hero immediately showing what the product does, product UI as a major visual object. Not: black/neon, flying phones.

### 3. Overall Visual Concept — CITY LAYER

The website should feel as if ReAround You adds an intelligent information layer on top of the physical city: real street photography + maps + location pins + distance + place labels + audio state + guide conversation. Technology should feel spatial and useful, not futuristic decoration.

No: purple/blue AI gradients, aurora backgrounds, glowing orbs, glassmorphism, 3D floating phones, excessive floating cards, decorative dashboards, generic three-column feature icons.

### 4. Design Tokens

Background `#F7F9FC`-ish cool off-white; surface `#FFFFFF`; text ≈ `#101318`; secondary text cool neutral gray; borders ≈ `#DCE3EB`. **One** dominant technology accent (blue or cyan-teal, e.g. `#1677FF`), functional only: primary CTA, current location, selected pin, route, audio active, active controls. Photography provides most non-UI color. Radius: product panels 12–16px, small panels 8–12px, buttons may stay pill. Shadows minimal: 1px border + very subtle shadow.

### 5. Typography

Modern sans-serif (Manrope if practical). No Instrument Serif as primary headline font. No handwritten fonts. Technology feeling partly from information hierarchy (small location/system metadata such as coordinates, area, distance, "HEAR THE STORY"). Do not overuse coordinates.

### 6. Homepage Structure

One continuous exploration, not a stack of marketing sections.

- **SCREEN 01 — HERE / HERO.** Eyebrow "AI LOCAL GUIDE". Headline "Understand / what's around you." Copy "See what's nearby, hear the story behind it, ask a question, and keep exploring." Primary CTA "Try it where I am"; secondary "See how it works". One integrated composition (not left text + right photo + demo card): real street photograph + location marker + route/location graphics + selected nearby landmark + distance + lightweight audio panel + Mia response. Photography ≈ 30–40% of visual weight; product/location UI dominates. Optional small system metadata (current area, nearby places, guide ready). No marketing stats.
- **SCREEN 02 — NOTICE.** Label "01 / THE MOMENT". Headline "You're already here. / Now let's understand it." One strong real-world city scene; one place introduced visually; minimal location lock / recognition graphic over a building. Not wrapped in a marketing card.
- **SCREEN 03 — SEE & HEAR.** Label "02 / SEE & HEAR". Headline "A place is more / than just a name." Realistic product UI: place image, place name, category / distance, audio play state, waveform, short guide response, question input. Use existing app behavior as factual reference; do not invent capabilities.
- **SCREEN 04 — ASK.** Visually connected to Screen 03. A short realistic conversation (USER question → MIA short answer). Demonstrate follow-up without saying "AI-powered / smart / intelligent / context engine".
- **SCREEN 05 — KEEP EXPLORING.** Label "03 / KEEP EXPLORING". Headline "An hour to wander?" Map-first: large light map as part of the page background; YOU → stop 1 → stop 2 → stop 3; lightweight route info (1 hour, stops, approx distance). Existing one-hour walking-route behavior only; no Plus route editing. One portion may include a real street photograph.
- **SCREEN 06 — GUIDES.** Label "04 / CHOOSE YOUR GUIDE". Headline "A different perspective / for every kind of explorer." Mia (calm / observant / thoughtful) and Milo (lively / curious / straightforward), each with a voice-preview control. Not team-member cards; desktop may use 50/50.
- **SCREEN 07 — CITY BREAK.** One strong full-width city image, minimal or no UI. Copy "Look up. / There's more here than you think."
- **SCREEN 08 — START.** Headline "Start with / the street you're on." Primary CTA "Try it where I am". "Works in your browser. No account needed." Pricing / Plus extremely secondary: "Coming soon · Plus". No large SaaS pricing section.

### 7. Photography Rules

Photography explains where the product is used and the feeling of walking through a city; product UI explains the product. Prefer real street scale, architectural details, people walking, natural daylight, eye-level travel photography. Avoid destination advertising, empty postcards, hotel/OTA imagery, heavy grading. UI cool and restrained; the city provides warmth.

### 8. Motion — V1 Launch Scope (Phase 3 only)

Only motion that represents product state: (A) hero location recognition — subtle current-location pulse, landmark label appears, optional short lock animation; (B) audio — waveform active, progress state, Mia status ready → speaking; (C) route — line draws progressively, stops appear sequentially when in viewport; (D) section reveal — opacity + 12–20px vertical, very restrained. Respect `prefers-reduced-motion`; content immediately accessible; no CTA delay; no performance hit. No WebGL, scroll-jacking, heavy parallax, cinematic intro, 3D, autoplay video.

### 9. Mobile

Validate every section on mobile while implementing. Hero order: eyebrow → headline → subheadline → CTA → product/location experience. No large decorative photo between headline and demo. Desktop must not add product content that mobile lacks.

### 10. Product / Content Boundaries

Do not change: Around / Guide / Me architecture, Mia and Milo identities, capability definitions, route logic, pricing/business strategy, AI/API logic, location logic, login architecture. No new capabilities. Do not advertise restaurant recommendations, avoiding crowds, unavailable capabilities, fake statistics, testimonials, logos, usage numbers. Claims must match implemented capabilities.

### 11. Technical Constraints

Next.js App Router, TypeScript, Tailwind, Vercel; website and app in one repo. Prefer existing dependencies; no large design framework; CSS/Tailwind + existing animation dependency if any. Do not refactor unrelated code, business logic, or break `/site`.

### 12. Execution Order

Phase 1: Hero, The Moment, See & Hear, Keep Exploring (desktop + mobile) → screenshots, file list, deviations, reused components → **STOP**. Review question: "Does this clearly look like a completely new ReAround You website?" Phase 2 (after approval): Ask, Mia/Milo, city-break, final CTA, footer, responsive refinement. Phase 3 (after static approval): the four motion patterns, then launch QA.

### 13. Acceptance Criteria

Product clarity in 3–5 s; clearly not V1 (colors/type/spacing alone insufficient); product-first over photography; still connected to walking a real city; technology from location/maps/state/audio/hierarchy, not decoration; mobile communicates without excessive scrolling; no heavy visual tech; no unrelated product work.

### 14. Working Rules for Claude

Implementation engineer, not product strategist. Do not reopen direction, add sections, or rewrite the proposition. Undefined detail → simplest implementation consistent with the brief, documented. Do not polish indefinitely.

---

## Part B · 后续指令（原文摘录，按时间）

### B1 · PHASE 1B — VISUAL ALIGNMENT（Phase 1 功能通过、视觉不通过）

The generated reference mockup (`site-v4-sample-b`) is now the PRIMARY VISUAL TARGET. Current implementation too editorial, too sparse, too "large copy + large image". Preserve the V2 engineering structure; realign visually:

1. Rebuild the Hero as one integrated city-information system, not left-copy/right-photo.
2. Increase spatial UI presence: location, coordinates, nearby places, pins, route lines, distance, guide state, audio and Mia status.
3. Blue as a consistent system language across the page, not only a CTA accent.
4. Increase desktop information density ≈ 25–35% without new product claims.
5. Same system UI language in Sections 01–03.
6. Route section closer to the reference: stronger route line, numbered stops, place cards, route metadata.
7. Keep typography and light background; reduce empty space.
8. No gradients, glassmorphism, WebGL, decorative AI visuals or unrelated features.

The mockup is the source of truth for density, technology intensity, blue system language, spatial composition, map/route presentation, product-vs-photography balance.

### B2 · Phase 2 approval + three corrections

- Do not ship "60 places" unless it is a real dynamic count; otherwise use a non-numeric nearby-places label.
- The Hero must not imply that fictional/brand photography is verified real-place recognition: use geographically matching imagery or clearly frame it as sample/demo.
- Keep mobile status cards compact; they must not dominate the first viewport.

Then implement: Ask / follow-up, Mia & Milo selection, full-width city photography break, final CTA, footer. Keep light background, blue spatial-system language, typography, density, component language. No pricing tables, feature grids, testimonials, logo walls, new claims. Then screenshots and STOP before motion.

（用户同时说明：**配图将由 GPT 重新生成一套匹配的新图**，现有图是占位。槽位见 COLLABORATION 28.2。）

### B3 · PHASE 2.1 — FINAL STATIC REFINEMENT

1. Remove repetitive use of the same landmark photography; keep the "same place, deeper understanding" narrative with different crops/details or product-first UI.
2. Do not present AI-generated brand photography as verified imagery of a real named landmark.
3. Shorten the Ask conversation ≈ 35–45%.
4. Simplify Mia/Milo cards: portrait, three traits, one short representative line, voice preview, selection CTA.
5. Reduce mobile vertical length (Ask, Guides, secondary CTA info).
6. Do not change Hero composition, typography, blue system, map treatment or section order.

### B4 · SPATIAL ACCURACY PATCH（用户发现首屏与第 5 屏的路径标注与图片不匹配）

**Hero**: remove the multi-place route/path overlay; the photograph identifies only one clearly visible landmark (Tour Saint-Jacques); keep YOU, one restrained spatial connection, the selected label, distance, audio state and Mia; move other nearby-place info out of the photograph into non-spatial UI; do not imply AR navigation or camera-direction positioning.

**Keep Exploring**: the connector must not look like a real walking route; reframe as stop order; numbered stops 1 / 2 / 3 as main hierarchy; dotted line thinner/lighter and secondary; subtle "STOP ORDER" label; no fake road-following route.

**Image truthfulness**: any image labeled Tour Saint-Jacques must be the geographically correct real-place image; AI photography may remain for mood/walking/city-break, not as evidence of a named landmark.

---

## Part C · 当前状态（2026-09-15 收笔时）

- 八屏 + 页脚全部在 `/site-v2`，静态版完成，**Phase 3 动画未开始**，等用户决定。
- 代码：`app/site-v2/page.tsx`、`components/site-v2/*`、`lib/site-v2/theme.ts`（令牌）、`lib/site-v2/content.ts`（全部事实内容与图片槽位）、`scripts/shoot-site-v2.mjs`（评审图）。
- 未提交到 git；`/site`（V1/V3）未动。
- 每轮改动与用户结论：`docs/COLLABORATION.md` 第 28 节（28 / 28.1 / 28.2 / 28.3 / 28.4）。

## Part D · 2026-09-16 之后（GPT 6 梳理后的方向）

Part A/B 保留为历史原文。2026-09-16 起以 `docs/SITE-V2-FINAL-VISUAL-RECOMMENDATION.md` 为最终视觉与结构依据，`docs/SITE-V2-SPATIAL-ROUTE-CHECKS.md` 为真实性门槛：

- 段落改为 Hero → 01 The Moment → 02 See & Hear（含追问）→ 03 Keep exploring → 04 Choose your guide → Start → Footer（独立 Ask 与 City break 取消）。
- Hero 用真实平视街景（Commons，Jorge Láscar，CC BY 2.0），单图钉、一张主卡、无 YOU/连线；主卡播放为真实试听。用户 2026-09-16 通过 Hero。
- Keep exploring 用 OSM 瓦片静态底图 + fixture 真坐标投影，虚线只表示站序。
- Moment 用 Commons 上 Ibex73 的塔顶细部照（CC BY 4.0），按 `docs/REAROUND-YOU-IMAGE-HANDOFF-2026-09-16.md` 接入。
- 2026-09-16 晚：用户要求以 B 样张为唯一验收标准复刻全页；令牌、Inter 字体、2px 图标、胶囊按钮、卡片体系全部按样张量出重建（第 40–41 节）。
- 逐轮记录：`docs/COLLABORATION.md` 第 34 节（Hero）、第 35 节（结构轮）、第 38 节（复核收口）、第 39 节（配图接入）、第 40–41 节（样张复刻）、第 43 节（复刻验收 F01–F04 收口）。截图与对照图：`docs/screens/site-v2-next/compare-*.jpg`。

- 2026-09-16（动效与上线自检）：动效清单 v2 已实现并自检通过（`SITE-V2-MOTION-SELF-CHECK-20260916.md`）；上线前自检 P01–P10 完成、三处断点问题已修（`SITE-V2-RELEASE-SELF-CHECK-20260916.md`），P04/P08/P10 BLOCKED 待 Milo 决定，未发布。见 COLLABORATION §50。
- 2026-09-16（分屏改造）：按 `SITE-V2-HERO-TRANSITION-REQUIREMENTS-20260916.md` v2 做了全站统一容器、六屏分屏、首屏满铺、四格重做、手机菜单与首屏出口转场；自检 `SITE-V2-HERO-TRANSITION-SELF-CHECK-20260916.md` V01–V09 全通过。见 COLLABORATION §51。
