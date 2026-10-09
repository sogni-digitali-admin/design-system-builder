# Mobile views and PWA

## Show the phone, not a shrunk desktop
In the page, draw phone frames (390 × 844 CSS px, rounded 44 px, notch/status bar, home indicator) side by side,
each holding one real screen of the product in light or dark. Make them scroll inside the frame. Below 760 px the
frames become full-width screens.

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
