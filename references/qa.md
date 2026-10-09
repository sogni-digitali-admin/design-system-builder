# Quality checks

## Automatic (must pass)
```bash
python scripts/palette_check.py <project>      # text contrast + colour-blind safety of the chart palettes
node scripts/qa.mjs <project>                  # console/page errors (both themes, every language), failed requests,
                                               # 390 px sideways scroll, untranslated sentences per section
```
`qa.mjs` exits 1 on any FAIL. "WARN untranslated" lists sentences still in the source language per section: names
and codes are fine, sentences are not — extract and translate them (`references/i18n.md`).

## Looking (must do — the checks cannot see design)
```bash
node scripts/qa.mjs <project> shots                       # every section × light/dark × 1360/390 px
node scripts/qa.mjs <project> shots --section <id> --lang all
```
Open the PNGs and check, section by section:
- Hierarchy reads at a glance; spacing follows the scale; nothing clipped, overlapping or orphaned.
- Dark theme looks designed: surfaces separate from the background, no muddy greys, figures and charts visible.
- Phone width: cards stack, tables scroll inside their frame, buttons stay reachable, no tiny text.
- Every state is shown where it matters; demo data is consistent across sections.
- Translations fit (labels not wrapping badly), numbers formatted for each language.
- Splash: check frames (`dist/splash/*.svg` opened at ~150, 450, 800, 1700 ms) — the mark ends complete.
- Hairline figures sit on the card colour (no boxes around them) and answer the pointer.

## Keyboard pass (5 minutes, by hand or with the browser)
Tab through one section of each kind: focus is visible everywhere, order follows reading, Esc closes overlays and
focus returns, arrows work inside tabs/menus/segmented controls.

## Before hand-over
- Full build (not a preview), QA PASSED, screenshots looked at after the last change.
- Notes section lists guessed values and open questions; licences recorded (icons, fonts, Hairline, photos).
- No preview files left in `dist/`, no secrets or private paths in parts.
