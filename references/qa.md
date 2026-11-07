# Quality checks

## Automatic (must pass)
```bash
python scripts/palette_check.py <project>      # text contrast + colour-blind safety of the chart palettes
node scripts/qa.mjs <project>                  # console/page errors (every theme, every language), failed requests,
                                               # 390 px: every section opened, no sideways scroll, menu, previous/next,
                                               # 200 % text, untranslated sentences per section
```
`qa.mjs` exits 1 on any FAIL. "WARN untranslated" lists sentences still in the source language per section: names
and codes are fine, sentences are not — extract and translate them (`references/i18n.md`). "WARN controls under
44 px" lists the phone targets smaller than a fingertip: fix the ones a reader taps (buttons, fields, chips), leave
decorative ones.

### The phone is read one section at a time
Below 760 px the page shows one section (`runtime/phone.js`): a menu button in the top bar opens the side navigation
as a sheet (languages, theme, design.md, the section's sub-parts, every section), and previous / next sit under the
section. The checks therefore open every section by hash before measuring; anything you script yourself
(screenshots, measures, extraction at phone width) must do the same (`openSection` in `_browser.mjs`), or it sees the
first section only, or waits forever for a hidden one.

### Section scripts start late
Every section script after the first two is wrapped by the build (`runtime/defer.js`) and starts when its section comes
near the screen, when an anchor opens it or when the phone shows it. The console check therefore scrolls the whole
page and reports how many deferred scripts started; one still pending after the scroll is a FAIL (the wrapper or the
section id is broken). With navigation groups, the check also opens the last section and verifies that its link is
marked `aria-current`, that its group is open and that the filter field narrows the list and says when nothing matches.
Your own scripts (extraction, screenshots) start every section the same way: scroll through, or open it by hash.

## Looking (must do — the checks cannot see design)
```bash
node scripts/qa.mjs <project> shots                       # every section × light/dark × 1360/390 px
node scripts/qa.mjs <project> shots --section <id> --lang all
```
The shots are the viewport after a real scroll to the section (an element capture is blank when the section's
rendering is deferred). Open the PNGs and check, section by section:
- Hierarchy reads at a glance; spacing follows the scale; nothing clipped, overlapping or orphaned.
- Dark theme looks designed: surfaces separate from the background, no muddy greys, figures and charts visible.
- Phone width: the top bar shows the section's name and the menu button; cards stack, tables scroll inside their
  frame, buttons are 44 px tall, fields do not zoom when focused (16 px text), no tiny text.
- A contact sheet of the shots, if you make one for review, holds resized copies (≤ 400 px wide), never the full
  PNGs: a sheet that embeds every screen weighs tens of MB and nobody opens it.
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
