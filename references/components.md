# Components and charts

## Inventory (pick what the product uses; show every state of what you pick)
| Group | Components | States to show |
|---|---|---|
| Actions | button (primary, secondary, ghost, danger, icon-only), split button, link | default, hover, focus, active, disabled, loading (spinner + label kept) |
| Inputs | text, textarea, select, combobox (search + list), date, number with stepper, checkbox, radio, switch, file drop | empty, filled, focus, error (after blur or submit), disabled, read-only, help text |
| Feedback | toast, inline alert, banner, progress, skeleton, empty state | success, info, warning, danger; with action; dismissible |
| Navigation | tabs, segmented, breadcrumb, pagination, sidebar, top bar, command palette | current, hover, focus; overflow on small screens |
| Data | table (sort, select, bulk bar, row actions, sticky header), list, card, kanban card, badge, tag, avatar, stat tile | loading, empty, filtered-empty, error, selected, dense |
| Overlays | dialog, drawer/sheet, popover, menu, tooltip | open/close, focus trap, focus return, Esc |

## Rules that make components trustworthy
- **Keyboard first.** Tab order follows reading order; arrows inside composite widgets (tabs, menus, listbox,
  segmented); Esc closes the top overlay and returns focus to its opener; Enter/Space activate.
- **ARIA patterns** (WAI-ARIA APG): tabs (`role=tablist/tab/tabpanel`, `aria-selected`), combobox 1.2
  (`aria-expanded`, `aria-activedescendant`, a live result count), dialog (`<dialog>` + `showModal()`), switch
  (`role=switch`, `aria-checked`), toggle buttons (`aria-pressed`).
- **Errors** say what is wrong and how to fix it, next to the field (`aria-describedby`), plus a summary at the top
  for long forms whose links focus the field. Never only red.
- **Touch targets** ≥ 44 px on phones; spacing between destructive and safe actions.
- **Loading**: under 300 ms show nothing; then a skeleton shaped like the content; over 8 s explain.
- **Motion**: the base styles ARE the final state; an animation only describes where the element starts (`from`),
  so a reader with reduced motion, a print, a screenshot or a second visit sees the finished screen. Nothing
  replays while the screen stays the same (not on a language or theme switch, not on re-render); only a loader
  loops. Every movement stops under `prefers-reduced-motion` and `html[data-a11y-motion="reduce"]`.
- **Copy**: buttons are verbs ("Send the quote"), titles say the object, empty states say what will appear and give
  the one action that makes it appear.

## Charts (dataviz rules)
1. **Pick the form from the job.** Magnitude across categories → bars (horizontal when labels are long).
   Change over time → line (area only for one series). Part of whole → stacked bar (pie only for 2–3 parts).
   A single headline number → a stat tile with its delta, not a chart. Distribution → histogram.
2. **Colour by job**: categorical (identity, fixed order `--chart-1…`), sequential (one hue light → dark), diverging
   (two hues + grey middle), status (reserved). Text never wears the series colour.
3. **One y-axis.** Two measures of different scales = two charts (or indexed to 100), never a dual axis.
4. **Marks**: thin bars with 4 px rounded data-ends on the baseline, 2 px lines, ≥ 8 px markers, 2 px surface gap
   between stacked segments, recessive grid, selective direct labels (the last point, the max) — never a number on
   every point.
5. **Interaction by default**: crosshair + tooltip on lines, per-mark tooltip on bars; hit targets larger than marks;
   filters (date range, dimension) in one row above.
6. **Accessible**: a legend for ≥ 2 series (and direct labels for ≤ 4), a table view, `role="img"` + a summary
   sentence; dark mode uses the dark palette (not a filter); texture available for print / forced colours.
7. Run `palette_check.py`; then look at the chart in both themes.
Charts in the page are hand-written SVG (no CDN): keep a small helper in the charts part (`bars`, `line`, `donut`)
that other parts can call, and document its API in the part's `.md`.

## Context switcher
A control that sets the context of the whole page (destination, island, branch, workspace).
- `role="radiogroup"` with a label; options `role="radio"` + `aria-checked`; roving `tabindex` (only the checked
  one is 0); arrows move and select, Home/End jump, Space selects.
- **Compact bar** variant (top of page or app bar): label + options as chips, each with a mini outline (24 px
  icon or silhouette). **Large card** variant (first visit, settings): one card per option with picture, name and
  one sentence.
- States: default, hover, focus, checked, disabled (with the reason), loading (spinner, options kept in place).
- **One shared value**: a single store and an event on change (`ctx:change`, detail = value); every section
  listens and re-renders. Persist it (`localStorage` in try/catch) and state the default value in the section.

## Spacing audit
Run it on every section before hand-over; fix with tokens, never with ad-hoc pixels.
- Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72.
- Section: h2 → lead 12; lead → first block 24; h3 40 above, 12 below; blocks of one sub-part 16–24 apart.
- Card padding 16 on mobile, 24 on desktop; card title → text 6–8; content never touches an edge.
- Grid gaps: 16 between cards, 12 between chips and buttons, 8 icon → label. Cards in one row have equal height
  and footers aligned at the bottom (`align-items: stretch`, footer `margin-top: auto`).
- Forms: label → field 6–8, field → help 6, between fields 16, between groups 24. Buttons ≥ 44 tall.
- Check at 390, 768, 1024, 1280 and 1440 px, light and dark, with screenshots you actually open.
- List defects (file, selector, before → after), fix, rebuild, re-shoot; two passes at most.
- Never change a text while fixing spacing (translations are keyed on it) and never change a colour.

## Accent script face
- One use per screen, ≥ 24 px, taglines and short flourishes only; never body text, labels or buttons.
- Self-host an OFL font and record the licence in Notes.
- If the brand's own script has an unclear licence, substitute an OFL one (Kaushan Script was the replacement
  chosen on one project) and flag the substitution to the brand owner.
- Fallback stack ends in `cursive`; check legibility at the smallest size used.
