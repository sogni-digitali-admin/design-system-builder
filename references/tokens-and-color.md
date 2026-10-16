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

## More than two themes
`ds.config.json → themes` takes any number of themes after `light` and `dark`. Add one when the brand really has
a third mode: a national or event identity (a flag's colours on a navy ground), a campaign or season, a partner's
co-branding, a sub-brand. Do not add one for taste: every theme is a full set to design, check and maintain.

```json
"themes": {
  "light": {…}, "dark": {…},
  "mauritian": { "base": "dark", "bg": "navy-950", "surface": "navy-900", "text": "brand-50", "primary": "ochre", … }
},
"theme_names": { "mauritian": { "fr": "Mauricien", "en": "Mauritian" } },
"chart": { "light": […], "dark": […], "mauritian": […] }
```
- **`base`** (`"light"` or `"dark"`, optional: inferred from the `bg` luminance) is what the theme is built on:
  `color-scheme`, shadows, the strength of the pale status backgrounds, which logo shows (`logo.dark` for a dark base),
  and which way the accessibility panel's high-contrast and colour-vision variants push. `note` is free text, ignored.
- **Generated for every theme**: its `[data-theme="id"]` block (same properties as light and dark), the contrast
  tables and slot cards (`{{THEME_CARDS}}`, `{{CONTRAST_TABLES}}`, or per theme `{{SLOTS_<ID>}}` / `{{CONTRAST_<ID>}}`),
  the design.md tokens, the accessibility variants, and `palette_check.py` (a theme that fails text 4.5:1 or focus
  3:1 fails the whole check). `new_project.py --themes light,dark,brand[:light]` scaffolds the block, copied from dark
  (or light) with a TODO note.
- **Picker.** With three themes or more the top bar shows a segmented control, Auto + one button per theme, instead
  of the sun/moon toggle. Auto follows the system (light or dark) and is the default; the choice is remembered. On a
  phone only the current theme shows and a tap moves to the next. Labels come from `theme_names` (a string, or one
  string per language) and fall back to the UI strings for light and dark.
- **Rules.**
  1. Designed, not inverted: pick the ground, then the text, then the colours that carry the brand on it.
  2. Every pair is re-checked, not assumed: text on bg and surface, muted text, primary as a link and as a button,
     focus ring, borders that matter, charts on the surface. A flag's pure red or green rarely passes as text on navy:
     keep it for fills and shapes and use a lighter step for text.
  3. Status colours are re-checked on the new ground (and keep icon + word); a brand colour never doubles as a status
     colour unless it passes there too.
  4. Roles stay stable: `primary` is always the action colour, `accent` the highlight, `danger` the destructive one.
     Components never branch on the theme name; if a component needs a different look, a token is missing.
  5. Show it in context: preview the theme on the whole page (a card with `data-theme="id"` forces it anywhere).

## Proposing a new dark palette
When the dark theme is missing, weak or was inverted, do not swap the brand's palette on your own taste. Put the
choice in front of the person:
1. **Two or three named alternatives**, side by side (for example "Night ink", "Warm slate", "Brand deep"): a
   one-line intent each, the full token values (every `themes.dark` key and the chart ramp), not just a swatch.
2. **The same checks on each**: run `palette_check.py` on a copy of the config per alternative and show the ratios
   (text, muted, primary, button, focus, status on their soft backgrounds, chart pairs), failures included.
3. **An "apply to the whole page" preview** per alternative: build each as a preview (`build.py --out
   _preview-night-ink.html`, config copy or a temporary extra theme) and let the person open them next to the current
   one; a swatch row hides what a muddy surface does to a real screen.
4. **A recommendation with reasons**: which one and why (contrast headroom, keeps the brand hue recognisable, calmer
   on long reads, works with the logo), and what it costs (a derived value to confirm, a logo variant to supply).
5. **Keep the old palette** in the config (as an extra theme such as `dark-previous`, or in Notes) until the person
   picks, so the two can be compared on the same page. Remove it only when they say so.
6. **Never replace the brand's palette without the person choosing.** Mark proposed values `source: "proposed"`;
   change to `sheet` only when the client confirms.

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
