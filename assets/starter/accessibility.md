## Accessibility panel
component: <ds-a11y> (assets/runtime/a11y.js, no dependency, no network, no cookie) · a preferences panel, never an "overlay": the product meets WCAG 2.2 AA without it
button: fixed bottom corner, position left (default) | right, 48 px, shows a count of active settings · Alt+A from anywhere · also [data-a11y-open] in the user menu and skip links
panel: non-modal side sheet (≤ 28rem) on desktop, full-screen modal on phones · focus to the title on open · Esc closes and returns focus · Tab out closes
profiles: low vision · dyslexia · motion sensitivity · focus (ADHD) · mobility/keyboard · colour blindness — each combines options and stays editable
options: text 100–200 % (rem) · line spacing · letter/word spacing · readable font (Atkinson Hyperlegible, OFL) · left align · 70ch measure · theme · high contrast (computed from the tokens) · colour-vision palettes rg | by (charts + statuses, checked protan/deutan/tritan) · reduced saturation · underlined links · reduce motion · pause media · no autoplay · strong focus · reading guide | mask · large cursor · mark headings/links · 44 px targets · read aloud (speechSynthesis) · language
effects: data-a11y-* on <html>; pages opt in by using rem for text and the colour tokens; [data-motion-host] elements get motion="reduce"
system-first: prefers-reduced-motion, prefers-contrast, prefers-color-scheme and forced-colors apply until an explicit choice
storage: local (localStorage "<slug>-a11y") on public sites · none + el.prefs in apps (user profile) · Reset + 12 s undo
events: ds-a11y:change {prefs, changed} · :open · :close · :lang · API DSA11y.open/close/toggle/reset/set/prefs/reducedMotion()
