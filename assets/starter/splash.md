## Splash
when: cold start of the app / PWA only, never between pages (a page change shows the next screen's skeleton)
sequence: draw mark strokes in primary 0–700ms (40ms stagger) · fill brand colours 550–950ms · name rises 8px 800–1200ms · hand-over fade 1300–1600ms
reduced-motion: finished mark + name fade in 200ms, no tracing
pwa: manifest background_color = default theme bg · theme_color = top bar · maskable icon, 20% safe area · splash starts on that colour
loader: mark breathes (scale .94↔1, 1.6s) — the only loop · role=status with a sentence · over 8s explain and offer a way out
