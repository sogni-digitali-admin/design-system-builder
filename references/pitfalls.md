# Pitfalls (each one happened; each has a fix)

| Symptom | Cause | Fix |
|---|---|---|
| The page stops rendering halfway; a script shows as text | a literal `</script>` inside inlined JS (even in a comment) | the build escapes it in parts; in your own strings write `<\/script>` |
| Build: "unknown markers" | an uppercase `{{…}}` in content (email variables, code samples) | lowercase variables `{{first_name}}`, or entities `&#123;&#123;` in docs |
| Hidden elements show up | a part's CSS sets `display` on an element using `[hidden]` | `base.css` forces `[hidden]{display:none!important}`; do not override it |
| Email previews take the page's button styles | shared class names (`btn`, `card`) inside the email HTML | prefix email classes (`o-btn`), render emails in `<iframe srcdoc>` |
| Tables inside a part get odd padding | the part used bare `th, td` | scope table styles: `.tbl` or your prefix |
| Two backgrounds fight on one screen | constellation + contour lines (or any two textures) together | one texture per screen, never two |
| Sideways scroll on phones only | a nav strip, a wide table or `min-width` content | `min-width: 0` on flex/grid children, tables in `.tbl` (scrolls inside), check with `qa.mjs mobile` |
| Two figures on a page crash ("already declared") | custom Hairline figures share top-level `const` names | the build wraps each figure file in its own scope — keep one figure per file |
| A theme-forced card has unreadable text | `data-theme` on a card resets colours but text inherited the page colour | `base.css` sets `color` on `[data-theme]`; do not override with a fixed colour |
| A translated word looks wrong in one place only | the same source word has two meanings | make the source strings distinct, or one `data-l` sentence per language |
| Translators stop with HTTP 429 | too many agents at once | 2–3 at a time; save output progressively; re-extract only the missing chunk |
| A toast stays in the old language | it was created before the switch | build toast text with `dsT()` at the moment it is shown |
| "Δ" or accents crash a script on Windows | console encoding cp1252 | the scripts reconfigure stdout to UTF-8; do the same in your own |
| Iconify returns 403 | the API refuses requests without a User-Agent | `fetch_icons.py` sends one; with curl use `-A` |
| The splash ends with a missing ring or stroke | the mark's shapes are line art; a generic "trace then fill" would hide their strokes | `splash.py` keeps line-art strokes (`data-k="s"`) and only fills filled shapes |
| Inline SVG `<style>` restyles the whole page | SVG styles are global when the SVG is inlined | show generated SVGs as `<img>` (data URI or file), as the splash part does |
| A Hairline figure looks boxed | `--hairline-plate` differs from the surface it sits on | the plate is mapped to `--card-bg`; on another surface set `--hairline-plate` on that container |
| Bash heredocs or `python -c` mangle `\b`, `\s`, quotes | shell escaping | write patches as files, or edit files directly |
| On a phone the page runs to hundreds of thousands of pixels and the browser stalls or crashes | thirty sections in one scroll | `phone.js` (built in) shows one section at a time below 760 px, with a menu and previous / next; never remove it |
| Icons paint empty on the phone, or in one section only | several SVGs share a mask, gradient or clip id and the first copy sits in a `display: none` section (`url(#id)` then resolves to nothing) | `phone.js` gives every SVG of the open section its own ids; in your own generated SVGs, suffix ids per instance |
| A width, a chart or a canvas measures 0 and stays blank on the phone | the script measured while its section was hidden | measure on `resize` too (`phone.js` fires one when a section opens), or when the section's `ds:section` event names yours |
| `qa.mjs` on the phone passes but one section overflows, or the run hangs | the checks saw only the first displayed section, or waited for a hidden one | `qa.mjs` opens every section by hash (`openSection`); do the same in your own scripts before measuring or shooting |
| Element screenshots come back blank | `content-visibility: auto` (or any deferred rendering) on the section: nothing is painted until it is scrolled into view | shoot the viewport after a real scroll to the element (what `qa.mjs shots` does), never `element.screenshot()` on a deferred section |
| A contact sheet of screens weighs tens of MB | every thumbnail embeds the whole screen (full-size PNG or complete markup) | thumbnails are crops or resized copies (≤ 400 px wide, WebP), one real screen opened on demand |
| An animation replays at every language or theme switch, or nothing animates on a second visit | the resting style was the start of the animation, or the end state only existed in the animation | base styles are the FINAL state; the animation only describes the start (`from`); nothing replays while the screen stays the same |
| A one-line change shows as a whole-file diff | a script rewrote the file with the platform's line endings | write with the file's own ending (`scripts/_text.py` does: CRLF stays CRLF, LF stays LF) |
| A translation disappears after a merge | an output or override file carried `""` for that string | `i18n_merge.py` never lets an empty value replace a translation: it reports it and exits 1 |
