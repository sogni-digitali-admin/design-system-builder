# Visual styles

The style decides surfaces, borders, shadows, depth and radius before colours do. It is always a topic of the plan page
(`kind: "style"`): the person picks a primary style and, optionally, an accent style for named surfaces (for example glass only for
the top bar and sheets). `apply_plan.py` writes `ds.config.json → style` and derives what it can; the rest is an open question.

## How to propose
- Shortlist 2 to 4 styles that fit the positioning and the trade, `recommended` on one, with a `why`; the others `shortlist: false`
  (collapsed). Never recommend a style only because it is fashionable.
- Each card carries the numbers: radius (sm, md, lg), border weight, shadow, blur (glass only), density, and the colours the preview
  needs (`ink`, `surface`, `surface_alpha`, `bg_worst`, `btn_bg`, `btn_fg`). The page renders a live mini card, button and chip, and
  computes text contrast on the **worst background** (the surface composited over `bg_worst`) and for the button: it shows pass or fail.
- Previews honour `prefers-reduced-motion` (no hover movement), `prefers-reduced-transparency` and `prefers-contrast: more` (glass
  turns solid), and the glass preview has a solid fallback when `backdrop-filter` is unsupported.

## The styles
| Style | Looks like | Fits | Tokens to expect |
|---|---|---|---|
| Minimalist | flat, lots of white space, 1 px borders, no shadows | tools, finance, legal, content-heavy products | radius 6 / 8 / 12, shadow none, border 1 px |
| Liquid glass | translucent layered surfaces, backdrop blur, specular edge, soft depth | media-rich consumer apps, travel, wellness; chrome and overlays only | radius 12 / 18 / 28, blur 20 to 30 px, surface alpha 0.55 to 0.7 |
| Glassmorphism-lite | same idea, surfaces 75 to 85 % opaque, light blur | brands that want depth without risk | blur 8 to 14 px, alpha 0.8 |
| Soft / neumorphic-light | soft shadows, large radii, low-contrast fills | calm consumer products | radius 10 / 16 / 28, diffuse shadow, border 0 |
| Editorial | strong type, hairline rules, visible grid, paper tones | publishing, hospitality, culture, premium retail | radius 4 / 6 / 10, border 1 px, no shadow |
| Playful / rounded | pills, saturated fills, hard small shadows, motion | youth, education, games, food | radius 14 / 20 / 32, border 2 px |
| Brutalist | thick borders, flat fills, hard offset shadows | creative studios, statements | radius 0, border 3 px, shadow `6px 6px 0` |
| Corporate classic | symmetrical, medium radii, light shadows | B2B, insurance, public services | radius 4 / 6 / 8, density compact |
| Material-like | tonal surfaces, elevation by level, medium radii | Android-first products, dense apps | radius 8 / 12 / 16, two-layer shadow |
`other` is the page's "Other (write your own)".

## Accessibility rules (every style)
1. Text keeps 4.5:1 (large text 3:1) on the worst background it can meet, in both themes; non-text parts that carry meaning (input
   borders, focus ring, chart marks) keep 3:1. Soft and glass styles fail here first: check before proposing.
2. Never convey state by shadow or depth alone: status keeps icon + word; focus stays a visible 3 px ring, not a shadow tint.
3. Motion respects `prefers-reduced-motion`; hover lift and parallax are optional, never the only feedback.
4. Targets stay 24 px minimum (44 px on touch); a compact density does not shrink hit areas below that.

## Liquid glass and glassmorphism: extra rules
- **Solid fallback is mandatory**: a token `--glass-solid` (the surface composited over the worst background) is used when
  `backdrop-filter` is unsupported, with `prefers-reduced-transparency: reduce`, `prefers-contrast: more`, forced colours and the
  accessibility panel's high-contrast mode.
- **Text never sits on raw blur**: it sits on the surface fill, and the pair (ink on the composited surface over the worst
  background) is checked at 4.5:1. If the page behind can be a photo, the worst background is the most contrasting region of it.
- **Limit it to chrome and overlays** (top bar, tab bar, sheets, popovers, floating panels). Body content, tables and forms stay on
  opaque surfaces. One glass layer at a time; nested blur is expensive and muddy.
- Keep a 1 px light inner edge for the specular highlight, but do not rely on it to separate content.
- Cost: backdrop blur on large areas hurts low-end phones; cap the blurred area and the radius of blur (8 to 24 px).

## What `apply_plan.py` derives (record as "derived from style")
`radius` (sm, md, lg), `density`, `shadow` (light and dark), the border weight, and for glass a block
`style.derived.glass = {blur, surface_alpha, solid_fallback, text_contrast_worst, rules}` with the fallback computed from the card's
own numbers. `style.accent` and `style.surfaces` record the accent style and where it applies. A shape decision (radius, density)
overrides the style's values. Open questions it adds: the elevation levels beyond the card shadow, a dark-theme check of the shadow,
the border weight on inputs, and the surfaces of an accent style when they were not named.

## In the design system
Show the chosen style in Foundations (surface levels, radius, elevation, glass tokens with their fallbacks) and in the Notes section
(what was derived). Components read tokens only (`--radius-*`, `--shadow-card`, `--card-border`); a style change is a token change.

## Checklist before publishing the style topic
- [ ] 2 to 4 shortlisted, one recommended, the reason names the brand or the trade (not taste).
- [ ] Every card has all its numbers; the page's pass or fail lines are green for the recommended one, or the failure is explained.
- [ ] A glass card names its `bg_worst` honestly (the busiest or lightest region the surface can overlap), not a flattering one.
- [ ] If an accent style is likely (glass for the top bar and sheets), the `why` says which surfaces, so the person can name them.
- [ ] Nothing here contradicts the palette topic: the style's `ink` and `btn_bg` are colours the palettes can actually supply.
