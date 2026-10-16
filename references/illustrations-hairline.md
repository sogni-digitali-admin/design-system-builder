# Illustrations with Hairline

Hairline draws isometric line figures in a single stroke that answer the pointer. Two sources, both bundled:
- **The package** `vendor/hairline/` (`@lucasmarkes/hairline` 0.5.0, MIT): 33 ready figures.
- **Custom figures** made with `vendor/hairline-create/` (the package's own engine and its authoring skill, MIT):
  one new figure per situation the package does not cover.
The version is pinned on purpose: the package is young (0.x) — never swap in a newer copy without re-checking
every figure.

## 1. Find the situations (gap analysis)
List every screen that can be **empty** (first use, filtered to nothing), **waiting** (sync, import, first data),
**in error** (disconnected, forbidden, not found, server error, maintenance) or **successful** (published, signed,
paid). A CRM typically has ~30. For each, decide: a figure (first use, error pages, onboarding, big moments),
an icon (no search result, small panels, under 120 px) or nothing (a table that is simply empty after a filter).
Write the table in the illustrations section: situation · where · figure · what the pointer does.

## 2. Use package figures first
| Figure | Reads as | Typical place |
|---|---|---|
| `loupe` | a loupe over a blank sheet | no search result |
| `plot` | flat bars | dashboard / report without data |
| `plug` | plug that stops short of the socket | integration or mailbox disconnected |
| `hub` | tiles linked to a hub | contacts, network, organisation |
| `settle` | crooked tiles settling into a tree | import, onboarding "we organise it" |
| `drawer` | empty drawer with dividers | archives, documents |
| `query` | a question mark that turns to you | help centre, first steps |
| `padlock` | shackle lifting as you near | security, passkeys, 2FA |
| `vault` | dial and bolts | secrets, encryption, backups |
| `lockers` | one locker ajar | client portal, spaces |
| `relay` | path lighting hop by hop | automations, workflows |
| `riffle` | tray of cards (keyboard-walkable) | cards, contacts, templates |
| `stack` | frames lifting | history, activity |
| `branches` | commit graph | versions, publishing history |
| `format` | crooked lines snapping square | editor, formatting |
| `exploded` | app window in layers | page builder, layers |
| `slow` | crates through a gate | queues (email sending, jobs) |
| `phosphor` | dot-matrix loop | long loading |
| `terminal`, `router`, `patch`, `dish`, `cabinet`, `rebuild` | technical | logs, network, webhooks, broadcast, backups, updates |
| `elevator` | four floors | plans / editions |
| `phone`, `laptop`, `keyboard` | devices | mobile app, desktop access, shortcuts |
| `terrain`, `sieve`, `basket`, `turntable`, `rail`, `cabinet` | fields and objects | heat map, filters, cart, 360° product, roles, storage |

Markup: `<div class="hl-stage" data-kind="pkg" data-fig="loupe" aria-label="What it shows, in the source language"></div>`.
The runtime mounts it, follows the theme (`--hairline-*` mapped to the tokens in `base.css`) and writes the
read-out into `[data-read-for="loupe"]` or the `.fig-read` of the card.

## 3. Draw the missing ones (hairline-create)
Read `vendor/hairline-create/GUIDE.md` and follow it exactly (concept → rules.md → kernel index → example →
figure → check). Practical notes for this skill's layout:
- Write the figure as `<project>/hairline/figures/<name>.js` (lowercase name, one idea, `hairline({...})` at the end).
- Build its test page: `node vendor/hairline-create/build.mjs <project>/hairline/figures/<name>.js` (writes
  `hairline-<name>.html` in the current folder; run it from `<project>/hairline/`).
- Validate: `node vendor/hairline-create/validate.mjs hairline-<name>.html`.
- Look: `node scripts/hairline_look.mjs hairline-<name>.html <name>-look.png "" "at=120,150" "at=280,170" "theme=dark&at=200,150"`
  (uses the bundled Playwright with your Edge/Chrome; hairline-create's own look.mjs would try to install a
  browser). Then open the PNG and answer the questions of `vendor/hairline-create/look.md`. Fix, repeat.
- Never edit `kernel.js` or `bench.html`: if something does not work, the figure is wrong.
- In the page: `<div class="hl-stage" data-kind="custom" data-fig="<name>"></div>`; a `[data-tour]` button in the
  same card plays the figure's tour. The build inlines every file of `hairline/figures/` in its own scope.
Good custom figures for business products are physical metaphors: a sorting rack for a pipeline, locks for a
funnel, a mailbox for an inbox, a stamp for a signed quote, a press for publishing, a typewriter for a blog,
bookmarks for translations, a balance for approvals, a chart recorder for an activity log, an empty shelf for a
knowledge base, a ballot box for forms, a balloon for onboarding, a missing file card for 404, a badge reader for
401, a barrier for 403, jammed gears for 500, an hourglass for 503.

## 4. Error pages
One card per code (401, 403, 404, 500, 503): figure, the code large, a title, one sentence that says what happened
and what to do, two links (back, home). Give the developers the template file for their framework in Integration.

## 5. Rules
- Size 160–240 px wide in an empty state; above: title, one sentence, one action. Under 120 px: an icon.
- One figure per situation, never decoration, never two on one screen.
- Always an `aria-label` in the source language (translated like any text); the read-out is decorative.
- Reduced motion: figures still answer the pointer but nothing plays on its own.
- Emails cannot run scripts: export the figure at rest as PNG (screenshot of the stage at 2×) for email use.

## 6. Colour mode (optional)
A brand may want figures that carry its colours. Keep the 1 px line and the isometry; add a colour layer on top.
- **Fills per material**, not per shape: water, sand, sails/flags, sun, vegetation, wood. One class per material
  (`f-sea`, `f-sand`, `f-wood`…) and a stroke class for key edges (`s-sea`, `s-primary`, `s-soft`). Map
  figure → element indices → classes in one table in the JS (`PAINT`), applied after mount; never edit the kernel.
- **Tokens, not hex**: fill = `color-mix(in srgb, var(--material) 28%, var(--hl-ground))`, with a plain
  `opacity` fallback declared first for browsers without `color-mix`. The dark theme uses the dark tokens.
- **The single bright point stays the accent** (`.dot`). The soft shadow is the ground colour tinted toward the
  sea/sand token, never grey-black.
- **3–5 colours per figure at most.** Colour only what reads as a material; leave the rest as hairline.
- **The pointer intensifies colour**: fills go from soft to full opacity on the object the pointer or focus
  reaches (transition ≤ 200 ms; none under reduced motion).
- **Toggle "Colour / Line only"** (a switch above the gallery, persisted, default stated) restores the original
  hairline look; the Line-only state must stay complete and correct on its own.
- **Contrast**: coloured strokes that carry meaning ≥ 3:1 against the ground in both themes (non-text contrast);
  pale decorative fills are exempt.
- **Translate every visible figure description.** The package ships English `means` text: override it per figure
  in the source language (and the `aria-label` with it) so no English reaches the page.
