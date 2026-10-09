# Tokens and colour

Three layers, so a theme changes in one place:
1. **Primitives** — the raw brand colours (`brand-700: #7E27C9`). Named by hue and step, never by role.
2. **Semantic** — roles per theme (`primary`, `surface`, `text-muted`…), pointing at primitives or at derived hexes.
3. **Component** — `--button-bg`, `--card-radius`… pointing at semantic tokens (generated in `tokens.py`).
Components only use layers 2 and 3. A raw hex in a part is a bug.

## From a brand sheet to `ds.config.json`
1. **Primitives.** Take the sheet's colours exactly (eyedropper on a PNG is a last resort: say so). Give each a
   `source`: `sheet`, `logo`, `derived`, `proposed`. Derived steps (a darker hover, a near-white surface) are
   computed from the brand hue and flagged in Notes.
2. **Light theme.** `bg` white or near-white; `surface` a whisper of the brand (cards); `text` the darkest brand
   step or a near-black tinted with it; `text-muted` ≥ 4.5:1 on both bg and surface; `primary` the brand colour if
   it reaches 4.5:1 on bg (links) and with `on-primary` (buttons) — otherwise darken it and keep the bright one as
   `accent`; `border` a light step; `focus` visible on bg (≥ 3:1).
3. **Dark theme — designed, not inverted.** `bg` a very dark tint of the brand (not pure black); `surface` one step
   lighter so cards read as raised; `text` a light brand tint (not pure white, ~13–16:1); `primary` a lighter step
   (dark text on it: `on-primary` = bg); shadows deeper; optional gradient background (`gradient.dark`) whose every
   stop stays darker than the surface.
4. **Status** (`success`, `warning`, `danger`, `info`): conventional hues, one step dark in light mode
   (#166534-like), one step light in dark mode (#4ADE80-like). Soft backgrounds are generated (12% / 20% mix with
   bg) — override `success-soft` etc. if the check fails. Status colours always ship with an icon and a word.
5. **Run** `python scripts/palette_check.py <project_dir>` and fix every FAIL before building sections on top.

## Chart palette
- 5–8 categorical colours, the brand colour first, assigned in fixed order, never cycled. A 9th series folds into
  "Other" or the chart becomes small multiples. A filter that hides series never repaints the others.
- Light and dark get their own steps of the same hues (same order).
- The check simulates protan, deutan and tritan vision on neighbouring pairs (series are drawn in order): ΔE ≥ 8 is
  the target, 6–8 needs a second cue (direct labels, texture), < 6 or normal-vision ΔE < 15 fails. Re-order before
  re-colouring: the search that fixed the starter palette was only a re-ordering.
- Sequential (magnitude) = one hue light → dark. Diverging = two hues with a grey middle. Status colours are never
  series colours.

## Type, space, shape, motion
- **Type**: at most two families; self-host them (`fonts.faces`, woff2) with their licence; a scale of 7 sizes
  (label 12, small 14, body 16, h3 22, h2 28, h1 36, display 48) — override in `text` if the brand needs.
- **Space**: 4 px grid (`space`), **radius** (`radius`: sm fields, md panels, lg cards, full pills),
  **density**: data-heavy products get a compact mode (rows 40 px instead of 52).
- **Motion**: durations fast 120 / base 200 / slow 320 ms, ease-out to arrive, ease-in-out to move; only loaders loop.

## Showing provenance
The theme section's slots show each value with its contrast chip; the Notes section lists every `derived` and
`proposed` value. When the client validates, change `source` and remove the note.
