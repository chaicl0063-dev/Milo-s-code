---
name: ReAround You · Site
version: 2.0.0
description: Light Tech / Clear / Urban / Human / Product-first design system for the ReAround You marketing site. Frozen 2026-09-15 by GPT Work in docs/REAROUND-YOU-IMPLEMENTATION-SPEC.md (v1.0) from docs/LAUNCH-DESIGN-BRIEF-v1.md. Cold light-grey ground, one teal-blue interaction color, Manrope, 1px hairlines, one very light shadow. Real app screenshots explain the product; photography only supplies the city. Supersedes v1.0.0 (warm editorial site, heavy device bezel, dark closing section), which no longer applies to the site.
colors:
  background: "#F7F8FA"        # page ground, cold light grey
  surface: "#FFFFFF"           # product display boards, forms, selection panels
  surface-2: "#EEF2F6"         # secondary surfaces, light grouping, caption strip
  ink: "#171717"               # headings, body, dark icons (never pure black)
  muted: "#5E6673"             # secondary text (≈5.45:1 on background)
  line: "#DDE3EB"              # 1px hairlines
  accent: "#167C80"            # the ONE interaction color: primary CTA, play, selected, links (white on it ≈4.97:1)
  accent-deep: "#116367"       # hover / active of the same hue, not a second accent
  accent-soft: "#E7F3F3"       # current sentence, selected panel ground
  focus: "#167C80"             # keyboard focus ring, 2px + 3px offset
  on-dark: "#FFFFFF"           # only for small controls that need it; there is no dark section
typography:
  family: "Manrope, 'Segoe UI', system-ui, sans-serif"   # already loaded by the app; no new font
  hero: { desktop: "56px / 1.08", tablet: "44px", mobile: "36px / 1.1", weight: 600, letterSpacing: "-0.025em" }
  h2: { desktop: "40px / 1.12", tablet: "36px", mobile: "30px / 1.15", weight: 600, letterSpacing: "-0.02em" }
  h2-plus: { desktop: "28px / 1.2", mobile: "24px / 1.2", weight: 600 }   # Free / Plus is deliberately quieter
  lead: { desktop: "18px / 1.6", mobile: "16px / 1.6", weight: 400, maxLineLength: "48ch" }
  body: { size: "16px / 1.6", weight: 400 }
  label: { size: "12px / 1.3", weight: 600, letterSpacing: "0.06em", transform: "uppercase" }   # 01 SEE · 02 LISTEN · 03 KEEP EXPLORING
  caption: { size: "13px / 1.5" }
spacing:
  container-max: "1200px"       # Real-world Break may use 1440px
  container-pad: { desktop: "32px", mobile: "20px" }
  hero-pad: { desktop: "48px / 64px", mobile: "24px / 48px" }
  section-pad: { desktop: "64px", mobile: "40px" }          # S02–S07
  plus-pad: { desktop: "40px", mobile: "32px" }
  final-pad: { desktop: "64px", mobile: "48px" }
  two-column-gap: "48px"        # Listen may use 32px
  steps: [8, 12, 16, 24, 32]
rounded:
  container: "20px"
  crop: "12px"                  # screenshot excerpts inside a board
  input: "12px"
  pill: "9999px"
elevation:
  only: "0 2px 8px rgba(23,23,23,0.04)"   # boards and cards; plain content has no shadow
motion:
  hero: "opacity 0 → 1, 360ms ease-out, no translate"
  reveal: "optional, one opacity reveal per section, 300ms, no library"
  state: "color / opacity 160ms"
  reduced-motion: "animations off, content immediately visible"
components:
  button-primary: { bg: "{colors.accent}", fg: "#FFFFFF", height: "48px", padX: "24px", font: "15px / 600", radius: "{rounded.pill}", hover: "{colors.accent-deep}" }
  button-secondary: { bg: "{colors.surface}", fg: "{colors.ink}", border: "1px {colors.line}", height: "48px", radius: "{rounded.pill}" }
  button-compact: { minHeight: "44px" }
  nav: { height: "64px", sticky: true, bg: "{colors.background}", border-bottom: "1px {colors.line}", blur: none }
  board: { bg: "{colors.surface}", border: "1px {colors.line}", radius: "{rounded.container}", pad: "12–16px", shadow: "{elevation.only}" }
  anchors: { scroll-margin-top: "80px" }
---

# ReAround You · Site design system (v2, frozen)

## What the site is for

One job: a first-time visitor understands within a few seconds that this is a local AI guide you use while standing in a city you don't know. Three verbs, in this order: **see** a place, **listen** to its story, **keep exploring** nearby. The page is a light, quiet product site; the travel feeling comes from photographs, never from the UI's own colors.

The nine sections and their frozen copy live in `docs/REAROUND-YOU-IMPLEMENTATION-SPEC.md` §3. Change the spec before changing the page.

## Colors

- `background` is the page. `surface` (white) is for boards, forms and panels. `surface-2` for light grouping and the caption strip under the Real-world Break photo.
- **One accent.** `accent` goes on the primary button, the active pill, the playing state, links and the selected guide panel. `accent-deep` is its hover. Nothing else on the site is saturated.
- **No dark section.** The old dark download block is gone; the final CTA is a white board on the light ground. Photos carry no gradient scrim; a caption sits below the photo in a light strip.
- Real app screenshots keep their native colors (warm ground, terracotta pins, map tiles, portraits). They are the product being shown, not a second palette. Never re-tint, filter or repaint them.
- Colors live in `lib/site/theme.ts` only. `T.gold` / `T.teal` are compatibility aliases equal to `accent`.

## Typography

- Manrope everywhere on the site (already loaded by the app). No serif on the site; Instrument Serif stays inside the app only.
- Headlines weight 600, tight leading, negative tracking, `text-wrap: balance`. Sizes per the table above; 768–1023px uses the tablet sizes in a single column.
- Labels are the numbered section markers (`01 SEE`), 12px, 600, uppercase, 0.06em, in `accent`.
- Lead text ≤ 48ch. Body 16px. Captions 13px in `muted`.

## Layout

- Container 1200px (Real-world Break up to 1440px). Desktop two-column rows only at ≥ 1024px; 768–1023px is a single column with content max 720px.
- **Hero** = text 44 / product board 56. The board is a white 1px-bordered panel holding *excerpts of real screenshots*: map + selected place card on the left, the story screen's top (place name, Mia, sound-off state, first sentence) on the right. No phone bezel, no long shadow.
- Below the hero the sections alternate text and product/photo. Real screenshots always sit inside a bordered board with a caption that says they are sample views. Photographs appear only in The Moment, Keep Exploring and Real-world Break.
- Mobile order: label → h1 → lead → CTAs → small print → product board. The first 375×812 viewport must show map and place name.

## Screenshots (the product UI)

- Source of truth: `scripts/shoot-app.mjs` shoots the real app in headless Chrome and exports WebP; crops are cut from those screenshots, never redrawn. Regions are recorded in `docs/IMAGE-MANIFEST.md`.
- Allowed: crop, choose framing, hide unrelated corners, place two excerpts side by side with a hairline between them. Not allowed: composing a screen the app doesn't have, adding controls, editing text, promising states that don't exist.
- Route imagery comes from a real run of the one-hour flow (Guide → I have an hour → Make the route → Show on map). Captions say "route order, not navigation".

## Motion

- Hero fades in once (opacity only, 360ms). Optional single opacity reveal per section. State changes 160ms.
- Nothing translates, parallaxes, pins or floats. No WebGL, 3D phones, aurora, glass, gradients.
- Playing indicators appear only while audio really plays. `prefers-reduced-motion` turns all animation off.

## Voice

Second person, spoken, no exclamation marks, no emoji. Never: AI-powered, intelligent, smart, seamless, leverage, elevate. Never claim "on your left", food or crowd knowledge, or that a sample location is the visitor's location.
