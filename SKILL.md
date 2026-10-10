---
name: design-system-builder
description: Build a complete, multilingual brand design system as one interactive page (design.html) plus a machine-readable design.md for coding agents — tokens and light/dark themes, colour and contrast checks, typography, animated icons, Hairline illustrations that answer the pointer, an animated SVG splash and loader, components with every state, an accessibility button and preferences panel, and the product's own screens (CRM, website, e-commerce, booking, SaaS, mobile/PWA, emails, AI assistant and agents). Use this skill whenever someone asks for a design system, a style guide, a brand kit or UI kit, design tokens, a "design.html" or "design.md", a theme for an app, or wants to add a section (products, emails, mobile views, splash, illustrations, AI chat…) to an existing design system — even if they only say "make the brand guidelines for X" or "document our UI".
---

# Design system builder

You turn a brand (a logo, a few colours, product documents) into a design system people can use: one page that
shows every decision with live, copyable values, and a short text file that coding agents read before they build
a screen. The page is assembled from small section files by a build script, translated by a runtime dictionary,
and checked in a real browser. Everything the scripts need ships in this folder (`vendor/`): you install nothing
except Python 3.10+, Node 18+ and an Edge or Chrome browser.

What "done" looks like: `dist/design.html` opens offline, both themes look intentional, every language reads as
if written in it, a phone at 390 px never scrolls sideways, `qa.mjs` passes, you have looked at the screenshots,
and the Notes section lists honestly what was guessed.

## The workflow

Work through these phases in order. Each names the reference to read when you get there — read it then, not before.

### 1. Discovery — before any file
Read `references/discovery.md`. Read what the person gave you (brand sheet, product plan, existing app), then ask
only what you cannot find: product type, languages, editions/plans, the screens that matter, the brand assets
you are allowed to use. The product type picks the screen packs (`references/modules/`): a CRM gets pipeline and
contact screens, a website gets page templates and an editor, a shop gets catalogue and checkout. Never invent
business facts (prices, plan limits, legal text): use clearly-marked demo values and list them in Notes.

### 2. Scaffold
```bash
python scripts/new_project.py <project_dir> --name "Acme" --type crm --langs fr,it,en --source fr
```
This creates `ds.config.json`, starter sections in `parts/`, and folders for icons, translations, Hairline
figures and notes. It builds and passes QA immediately, with placeholder colours — keep it that way at every step.
The starter sections are written in English: rewrite their visible text in the **source language** when you adopt
them (the source language is the one the page is written in; the others are translated from it).

### 3. Foundations
- **Colours and themes** — `references/tokens-and-color.md`. Put the brand's primitives and the two themes in
  `ds.config.json`. Dark is designed, not inverted. Then run `python scripts/palette_check.py <project_dir>` and
  fix every FAIL (text contrast, and chart colours that colour-blind readers cannot tell apart).
- **Logo** — set `logo.light`, `logo.dark` and `logo.mark` (square symbol) to SVG files in `assets/`. The splash
  and loader are generated from the mark as animated SVG images.
- **Fonts** — self-host (`fonts.faces`), check the licence (OFL is fine), note it.
- **Icons** — `references/icons.md`. Pick ONE open-source set with the person, then
  `python scripts/fetch_icons.py get <project_dir> <set> name[=alias] …`. Licences are logged in `icons/SOURCES.md`.

### 4. Sections
Read `references/sections.md` (core sections and their acceptance criteria) and the module files for the product
type. Each section is `parts/<id>.html` (+ optional `.css`, `.js`, `.md`) and one entry in `ds.config.json →
sections`; **the order of that list is the order, numbering and navigation of the page** — never number by hand.
Write sections to the contract below. For illustrations read `references/illustrations-hairline.md`; for AI
assistants, chat and agents `references/ai-ux.md`; for emails `references/emails.md`; for phones and PWA
`references/mobile-pwa.md`; for components and charts `references/components.md`; for the accessibility panel
`references/accessibility.md`.

### 5. Build and preview
```bash
python scripts/build.py <project_dir>                    # dist/design.html, design.md, splash/, icons/, logos, fonts
python scripts/build.py <project_dir> --out _preview-me.html   # writes only that file: use this while others work too
```
The build refuses unknown markers, missing parts and duplicate ids — read its message, it says what to fix.

### 6. Parallel work (big systems)
More than four new sections, or a deadline: split the work across agents, one section each. Read
`references/orchestration.md` first — it has the brief template, the ownership and prefix rules, and how to merge
their notes. You stay the integrator: you own `ds.config.json`, `i18n/` and the final build.

### 7. Languages
`references/i18n.md`. Build, extract (`node scripts/i18n_extract.mjs <project_dir>`), translate the chunks
with the glossary (in parallel when large), merge (`python scripts/i18n_merge.py <project_dir>`), rebuild.

### 8. Quality
`references/qa.md`. `node scripts/qa.mjs <project_dir>` must print PASSED (console errors, failed requests,
390 px overflow, untranslated sentences). Then `node scripts/qa.mjs <project_dir> shots` and **open the
screenshots and look** — the checks cannot see a clipped label, a muddy dark theme or a figure on the wrong
colour. Fix, rebuild, look again. Check `references/pitfalls.md` when something behaves strangely.

### 9. Hand-over
Tell the person, briefly: where the files are, what each section contains, what you verified (and how), and the
open questions (guessed values, decisions to confirm). Publish or share the page if your environment allows.

## Section contract

Every section file follows this shape, so the build can number it and the runtime can theme and translate it:

```html
<section id="products">
  <header class="sec-h">
    <span class="sec-n">{{SEC_N}}</span>
    <h2>Produits</h2>
    <p>One or two sentences: what this section decides and for whom.</p>
  </header>
  <h3 class="sub">Catalogue</h3>
  …
</section>
```

- **Prefix** every class and id you create with a short section prefix (`pr-`, `em-`, `ck-`); reuse the shared
  classes of `assets/base.css` (`card`, `grid-2`, `grid-3`, `btn btn-primary|secondary|ghost`, `tag`, `chip`,
  `badge`, `seg`, `field`/`input`, `tbl`, `notes`, `codewrap`, `label`, `muted`, `feat`/`feat-ic`, `row`).
- **Colours only through tokens**: `var(--color-primary)`, `var(--color-surface)`, `var(--color-success-soft)`,
  `var(--chart-1)`… A card with `data-theme="dark"` shows the dark theme anywhere on the page.
- **Icons**: `{{ICON:name}}` or `{{ICON:name:motion}}` (motions: `assets/icon-motion.css`); give the control
  the class `oi` so the motion plays on hover and focus. In JS, clone a `<template>` that holds the icon.
- **Markers** you can use in a part: `{{SEC_N}} {{NAME}} {{VERSION}} {{DATE}} {{SWATCHES}} {{SLOTS_LIGHT}}
  {{SLOTS_DARK}} {{CONTRAST_LIGHT}} {{CONTRAST_DARK}} {{CHART_SWATCHES}} {{ICON_GRID}} {{TOKENS_PRE}}
  {{DESIGN_MD_PRE}} {{SPLASH_LIGHT_URI}} {{SPLASH_DARK_URI}} {{LOADER_LIGHT_URI}} {{LOADER_DARK_URI}}`.
  Template variables shown as content (emails) use lowercase `{{first_name}}` — uppercase is reserved for markers.
- **Text**: write visible text in the source language, whole sentences in one text node where you can. Strings
  built in JS go through `dsT({fr: "…", it: "…", en: "…"})`; re-render on `document.addEventListener("ds:lang", …)`.
  Names, code and client content get `data-i18n-skip`. When word order differs, give one full sentence per language:
  `<span data-i18n-skip><span data-l="fr">…</span><span data-l="en">…</span></span>`.
- **JS**: one IIFE per part, no globals except what other parts must call, no network, no CDN. Functions under 50
  lines, files under 800 (split the part if needed). `window.dsToast(text)` shows a toast.
- **design.md lines**: `parts/<id>.md` holds the section's rules in the terse `key: value` form
  (see `assets/starter/components.md`). The build appends them in section order.

## The quality bar

A design system people trust is specific, complete and honest:

- **Real content.** Real microcopy in the product's voice, real-looking demo data (names, amounts, dates) — never
  lorem ipsum. Amounts are written in the source format; the runtime re-formats them per language.
- **Every state.** Default, hover, focus, active, disabled, loading, empty, error, success — and for screens, the
  first-use empty state (with an illustration) and the no-result state (with an icon).
- **Both themes, deliberately.** Check the dark theme as carefully as the light one; status colours keep AA on
  their pale backgrounds in both.
- **Accessible.** Keyboard reachable, visible focus, labels on icon buttons, status never colour alone (icon +
  word), contrast AA, `prefers-reduced-motion` respected (only a loader loops), text in `rem` so the page reflows
  at 200 % text. The accessibility panel (`<ds-a11y>`, core section) adapts the page on top of that; it never
  stands in for it.
- **Restraint.** One illustration per situation, one background texture per screen (never two), one icon set,
  one primary button per view. A screen should have a point of view, not every component at once.
- **Honest.** Provenance on derived values ("derived", "proposed"), guessed values listed in Notes, licences of
  every third-party asset recorded.

## Files

```
scripts/   new_project.py · build.py (+ tokens.py, splash.py) · palette_check.py · cvd_palettes.py · fetch_icons.py
           i18n_extract.mjs · i18n_merge.py · qa.mjs · hairline_look.mjs · _browser.mjs
assets/    template.html · base.css · icon-motion.css · runtime/ (head, doc, i18n, hairline-mount, a11y) · fonts/ (Atkinson Hyperlegible)
           starter/ (the core sections) · glossary_template.md · brief_template.md
references/ discovery · sections · tokens-and-color · icons · illustrations-hairline · components · accessibility · ai-ux
           emails · mobile-pwa · i18n · orchestration · qa · pitfalls · modules/ (screen packs per product type)
vendor/    hairline 0.5.0 (MIT) · hairline-create (MIT, figure engine and skill) · playwright-core 1.64 (Apache-2.0)
```
