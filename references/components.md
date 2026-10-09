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
