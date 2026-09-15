---
name: ReAround You · Site
version: 1.0.0
description: Light, cinematic, product-first design system for the ReAround You marketing site. Adapted from "Apple Premium Cinematic" (section rhythm, product-as-hero, pill CTAs, restrained motion) and "Interactive Product Demo" (embedded real product, designed-for-the-paused-state) on designmd.app, moved to a neutral light ground; the terracotta accent stays because the app screens in the hero are terracotta. 2026-09-15, user decision: light base, tech feel from whitespace, real product frames and precise motion, not from dark mode or neon.
colors:
  background: "#F7F7F5"        # neutral near-white, the page ground. Never pure white, never blue-tinted.
  surface: "#EFEFEC"           # slightly deeper neutral for alternating sections and cards
  surface-raised: "#FFFFFF"    # inside cards/inputs that sit on surface; never as a section ground
  ink: "#17181A"               # text and the single dark section
  muted: "#66696E"             # secondary text, cool grey
  line: "#E3E3DF"              # hairlines, 1px borders
  accent: "#D9633A"            # terracotta, the ONE accent: primary buttons, active states
  accent-deep: "#A84427"       # small links, selected labels, text on light that needs the accent
  on-dark: "#F7F7F5"           # text on ink sections
  on-dark-muted: "rgba(251,246,238,0.7)"
  guide-mia: "#B85C38"         # persona colors, only next to the persona
  guide-milo: "#2F5D62"
typography:
  family-display: "Inter, -apple-system, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif"
  family-body: "Inter, -apple-system, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
  family-mono: "'JetBrains Mono', ui-monospace, monospace"   # only for tiny status labels (durations, versions)
  hero: { size: "clamp(2.75rem, 6vw, 4.75rem)", weight: 600, lineHeight: 1.05, letterSpacing: "-0.025em" }
  h2: { size: "clamp(2rem, 3.6vw, 3rem)", weight: 600, lineHeight: 1.08, letterSpacing: "-0.02em" }
  h3: { size: "1.375rem", weight: 600, lineHeight: 1.2, letterSpacing: "-0.01em" }
  lead: { size: "1.125rem", weight: 400, lineHeight: 1.6 }
  body: { size: "1rem", weight: 400, lineHeight: 1.6, maxLineLength: "68ch" }
  label: { size: "0.75rem", weight: 600, lineHeight: 1.2, letterSpacing: "0.04em" }
spacing:
  unit: "0.5rem"
  section-gap: "clamp(4rem, 8vw, 7.5rem)"
  container-max: "1200px"
  container-pad: "clamp(1.25rem, 3vw, 2rem)"
rounded:
  container: "20px"
  card: "20px"
  device: "44px"
  pill: "9999px"
  input: "12px"
elevation:
  card: "0 2px 12px rgba(31,29,26,0.06)"
  device: "0 30px 60px -30px rgba(31,29,26,0.35)"
  nav: "0 1px 0 rgba(31,29,26,0.06)"
motion:
  enter: { distance: "16px", duration: "540ms", easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
  stagger: "120ms"
  hover: { duration: "200ms", lift: "-2px" }
  reduced-motion: "respect prefers-reduced-motion: no translate, opacity only"
components:
  button-primary: { bg: "{colors.accent}", fg: "#FFFFFF", height: "48px", radius: "{rounded.pill}", weight: 600, hover: "darken 8%" }
  button-secondary: { bg: "{colors.surface-raised}", fg: "{colors.ink}", border: "1px {colors.line}", height: "48px", radius: "{rounded.pill}" }
  nav: { bg: "rgba(247,247,245,0.82)", blur: "saturate(180%) blur(20px)", height: "64px", sticky: true }
  device-frame: { bezel: "10px", bezelColor: "{colors.ink}", radius: "{rounded.device}", screenRatio: "390 / 844", shadow: "{elevation.device}" }
---

# ReAround You · Site design system

## Overview

The site sells one moment: you are standing on a street, you point at something, a guide starts talking. Everything on the page exists to show that the product does this, not to describe it. The look is **light, cinematic, product-first**: generous whitespace, one warm ground color, real screens of the app in a device frame, a single accent color, and precise, quiet motion. The "tech" feeling comes from precision and restraint, not from dark backgrounds, neon, gradients or glass.

Voice stays as defined in PRODUCT-BRIEF §2: second person, spoken, no exclamation marks, no emoji, none of the banned words (AI-powered, seamless, smart, leverage, elevate, intelligent).

## Colors

- `background` is the page. `surface` alternates with it to create section rhythm. Never use pure white as a section ground; white appears only inside cards, inputs and the device screen.
- Exactly **one dark section per page** (`ink` ground, `on-dark` text): the closing download / call-to-action block. A second dark block is allowed only for the dusk photo scene. Never start the page dark.
- `accent` is the only saturated color. It goes on the primary button, the active tab, the playing state. It is never a background for text blocks larger than a pill.
- Persona colors appear only beside the persona's name or portrait.
- No gradients except a photographic scrim (transparent → ink, ≤ 60% opacity) under text on photos.

## Typography

- Display and body are one sans family (Inter, falling back to the system stack). The former serif headline is retired for the site; the serif may remain inside the app.
- Headlines are tight: weight 600, line-height 1.05–1.08, negative tracking, `text-wrap: balance`. Hero headline at most three lines on desktop, three on a phone.
- Body 17–18px lead, 16px body, 68ch max line length. Labels 12px, weight 600, slight positive tracking, sentence case (no ALL CAPS except the two-letter status chips like "Beta").
- Numbers and durations may use the mono family at label size.

## Layout

- Container 1200px, padding clamp(20px, 3vw, 32px). Section gap clamp(64px, 8vw, 120px).
- **Hero = split screen**: text left (about 52%), product right (about 48%). The product is a real app screen inside a device frame, never an illustration or a stylised mock.
- Below the hero, rows **zig-zag**: text on one side, screen or photo on the other, alternating. **No three equal columns** anywhere. Feature lists use a bento grid (2 + 1 or 1 + 2 spans), each cell carrying a real screen crop.
- Mobile (< 768px): single column, device frame centered at 260–300px wide, text above it. No horizontal overflow at 375px.

## Elevation & depth

- Cards: 1px `line` border + `elevation.card`. Shadows never exceed 12px blur except the device frame's long soft shadow.
- Nav is translucent with backdrop blur and a hairline bottom shadow. Content scrolls under it.
- No glassmorphism panels, no inner glows, no neumorphism.

## Shapes

- Containers and cards 20px. Buttons and chips are pills. Inputs 12px. Device frame 44px outer radius with a 10px ink bezel.

## Components

- **Device frame**: 390/844 screen ratio, ink bezel, real screenshot at 2× as the default (the paused state). A "Try it live" control swaps the screenshot for a same-origin iframe of the real app. Design for the paused state first: the screenshot alone must already tell the story.
- **Screen switcher**: 3–4 pills naming what the screen shows (Around you · Place · Listen · Guide). Active pill uses `accent`.
- **Primary button**: accent pill, white text, 48px. **Secondary**: white pill with hairline. Never more than one primary per viewport.
- **Nav**: brand mark + name + Beta chip left; three anchors + "Open the app" right; collapses to brand + "Open" on mobile.
- **Section label**: 12px label in `accent-deep` above an h2; optional.
- **Footer**: sources credit, photo credit, Privacy / Terms / Send feedback / email, © operator.

## Motion

- Entry: opacity 0 → 1 and translateY 16px → 0, 540ms, ease-out curve above; siblings stagger 120ms. Only `transform` and `opacity` animate.
- Hover: lift 2px + shadow, 200ms. Primary button darkens 8%.
- Scroll: no parallax, no pinning. Reveal-on-scroll is allowed once per section.
- Audio playback states use the existing sentence highlight; no waveform animation that implies audio when nothing plays.
- Respect `prefers-reduced-motion`: drop translate, keep opacity.

## Do's and Don'ts

Do
- Show the real product: real screenshots, real live frame, real place (Tour Saint-Jacques) with credited photo.
- Keep one accent, one dark section, one headline idea per section.
- Say what a button does (Open the app, Hear the story, Download Android beta).
- Mark unfinished things "Coming soon" and make them non-clickable.

Don't
- Pure white grounds, dark hero, gradients, glass, neon, glows, 3-column icon rows, stock illustrations of phones.
- Emoji, exclamation marks, ALL-CAPS headlines, banned marketing words.
- Motion that moves anything other than transform/opacity, or that autoplays audio.
- Invent facts about a place, claim orientation ("on your left"), or promise food/crowd knowledge.
