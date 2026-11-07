# Mobile views and PWA

## Show the phone, not a shrunk desktop
In the page, draw phone frames (390 × 844 CSS px, rounded 44 px, notch/status bar, home indicator) side by side,
each holding one real screen of the product in light or dark. Make them scroll inside the frame. Below 760 px the
frames become full-width screens.

## The design system page itself on a phone
Below 760 px the built page reads one section at a time (`assets/runtime/phone.js`, shipped by the build): the top
bar shows the section's name and a menu button; the menu is the side navigation as a sheet (languages, theme,
design.md, the open section's sub-parts from its `h3.sub`, every section); previous / next sit under the section.
Anchors keep working (a link to `#products-list` opens Products and scrolls there). What a part must know:
- controls get 44 px targets and fields 16 px text from `base.css`; keep that when you style your own;
- a script that measures its box must listen to `resize` (fired when a section opens) or `ds:section`;
- SVGs you generate with `<mask>`, `<linearGradient>`, `<clipPath>` or `<filter>` get unique ids per instance.

## Navigation
- **Bottom bar**: 4–5 destinations max, the most used first; an optional central action (+) for the product's main
  creation (new lead, new booking). Icon + short label always; the current one filled/coloured with
  `aria-current="page"`; badges for counts.
- **Everything else** goes behind a **"More" tab** that opens a sheet (or a full page) listing the other modules
  with icons, grouped (work, settings, help) — this answers "how do users reach the other tabs".
- The assistant (if any) floats as a bubble above the bar, never as a sixth tab.
- Top bar: title, back, one or two actions; search as its own screen.

## Mobile patterns
Bottom sheets for actions and filters (drag handle, snap points, Esc/back closes), pull to refresh, swipe actions on
list rows (with a visible alternative), sticky primary button above the keyboard, large touch targets (≥ 44 px),
safe areas (`env(safe-area-inset-*)`), offline banner and queued actions, skeletons on every list.

## PWA
- `manifest.webmanifest`: `name`, `short_name`, `start_url`, `display: standalone`, `background_color` = page
  background of the default theme, `theme_color` = top bar colour, icons 192/512 + maskable (20% safe zone) +
  monochrome for notifications, shortcuts to the 3 main creations.
- Launch: the system shows `background_color` + icon, then the app shows the SVG splash on the same colour
  (`dist/splash/splash-<theme>.svg`) — nothing flashes. iOS needs `apple-touch-icon` and status bar meta.
- Install prompt: explain the benefit, after a meaningful action, never on first visit.
- Generate the icons and the manifest in the part's JS or a small script; show them in the section with their sizes.

## Splash family beyond the generated one
The generated SVG splash (`dist/splash/`) is the baseline. Offer these as options when the brand wants more.
- **Keep the original splash.** If the brand already has one, show it unchanged first; every variant below sits
  under it as an option, labelled as a proposal.
- **Desktop splash**: 16:9 in a browser frame (canvas 1440 × 900, scaled to fit), same mark and background as
  the phone one.
- **Layered scene splash**: sky, sun or moon, relief, three waves, foreground as separate groups with a slow drift;
  a day and a night version that follow the theme. Keep the SVG light (~30 KB).
- **Domain-typing splash**: the domain typed letter by letter in the brand colours, with a cursor; 100 ms per
  character, 800 ms hold, fade out 700 ms. `role="status"` on the overlay with the full name in a hidden label
  (`aria-label`) and the typed letters `aria-hidden`, so a screen reader never spells it out.
- **Signature splash**: the animated emblem first, then the typed domain; at the end the cursor turns into a
  wave underline.
- **Loops as loaders**: reuse the animation in three states — normal (loops), slow (after ~8 s: calmer loop plus a
  sentence), failure (stops, shows the error and a retry). Never an endless loop without the second state.
- **Rules for all of them**: image-zero (inline SVG/CSS only, nothing to fetch, works offline and on first paint),
  complete in ≤ 3 s, shown once per session (`sessionStorage` in try/catch), skippable by tap or key, never
  blocks content that is already ready. Reduced motion: a static frame plus a fade, no typing, no drift.
- **Replay button** under each splash in the design page, so reviewers can watch it again without clearing storage.
