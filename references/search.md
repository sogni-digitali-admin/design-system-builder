# Search: classic and AI free text

Write this section when the product has a search over a catalogue (activities, rooms, products, listings). The AI
mode **adds to** structured search, it never replaces it: two modes at the same level, the query survives a switch.
Read `references/ai-ux.md` for the assistant itself; this file is the search bar and its results.

## 0. Research first, record it
Before designing, look at 6-10 real references (travel and marketplace leaders, AI search entries, command bars).
Write `docs/INSPIRATION.md` or a Notes entry with: date and method (and what could not be opened), a table
*product / what was observed / link*, then three lists — **borrowed (adapted)**, **original to this brand**,
**retained principles / avoided**. Unverifiable observations are marked "to re-check before quoting". Don't copy
another product's assets or wording; name the pattern, not the look.

## 1. Classic mode: segmented pill
- Hero: one large pill of 3-4 segments, each = short label + value (Where / When / Who, adapted to the product:
  island / activity / date / travellers). Each segment opens **its own panel**:
  - *Destination*: thumbnails with name and one-line hint, plus a "Anywhere" choice.
  - *Date*: month calendar, arrow-key navigation, past days disabled, shortcuts (Today, Tomorrow, This weekend),
    "flexible" switch. Day buttons have full labels ("Saturday 17 October").
  - *Guests*: counters per age band with the age rule written (Adults 13+, Children 2-12, Infants < 2), min/max, `-`
    disabled at the minimum.
- Active segment is raised on a darkened pill; panels close on `Esc`, outside click, or when a choice finishes.
- **Round search button** in the action colour at the right; when a segment is open it widens and shows the word
  "Search".
- **Fill-in-the-blank sentence** under the pill: "I'm looking for a catamaran trip, on the east coast, on Saturday 17
  October, for 2 travellers." Each chunk is a button that reopens its panel; unset chunks look empty. It is also the
  screen-reader summary.
- **Compact variant** (top bar, app): one 52 px row — mode switch (icons), two-line summary, round button; tapping the
  summary opens a sheet with the segments as an accordion. On scroll the hero pill collapses into this bar.

## 2. Mode switch
A two-option `radiogroup` ("Classic" / "<Assistant name>") with arrow keys, sliding thumb and a distinctive brand
gesture (e.g. a tide rising). Rules: the typed text and the chosen filters are kept; the switch is never hidden in a
menu; compact variant uses icons with `aria-label`. An optional shortcut (Tab / ⌘K) may send the same text to AI, with
a discreet hint that teaches it.

## 3. AI mode field
- One free-text field that **grows** from 1 to 5 lines; a character counter (warning at ~240, hard stop at 280).
  Controls inside the bar: **at most three** — counter, microphone, send. `Enter` sends, `Shift+Enter` new line.
- **Rotating example placeholders**, concrete (budget, place, time): "A sunset for two…", "A cheap family outing…",
  changing every ~4 s, typed letter by letter; static with reduced motion; never "Ask anything".
- A small brand emblem at the left (not a robot, a spark or an emoji); the field's outline switches to the AI
  treatment on switch only, then calms down.
- **Suggestion chips** under the field, 4-6, each with a library icon + short label that fills the field with a full,
  specific sentence: "Sunset" → "A romantic sunset for two on Saturday, under 80 € per person". Never emoji.
- **Voice input**: mic button states — idle, listening (action colour, bars follow the voice, "Stop" button, status
  announced), transcribing (text appears in the field), done ("Review your request, then send"), denied (explain +
  keyboard still works), unsupported (hide the mic). The transcript is editable before sending; nothing is sent
  automatically.

## 4. States of the AI field
| State | Behaviour |
|---|---|
| idle | placeholder rotates, chips visible, motion calm |
| focus | 2 px ring offset 2 px, placeholder stays visible |
| typing | grows, counter, send enabled |
| listening | mic active, bars, stop button |
| searching | input locked but visible, send shows "Searching…", motion speeds up |
| error | message + icon in error colour, the query kept; "Retry" and "Use classic search" |
| offline | AI mode greyed (dashed outline, flat), says why, switches the user to classic, which stays available |
Every state has an icon or a word, never colour only. Show hero and compact versions of all seven side by side.

## 5. AI results
- Header: "Results for: «<query>»" + source badge ("Assistant" or "Classic search") + count.
- A one-sentence **why these results** ("I favoured late-afternoon trips under 80 € per person").
- **Understood criteria** as removable chips with icons (2 travellers, Sunset, Budget < 80 €, Saturday 17 Oct); the ×
  button has the label "Remove criterion: …"; removing one recomputes the list; "Restore criteria" appears after.
- **Refinement chips** (filters) beside them.
- Each card: the usual card + **"why this"** line + a thin **relevance meter** (0-1, decorative, with text value for
  assistive tech). Prices and seats come from the availability tool with a "checked at HH:MM" stamp, never from
  generated text.
- **No result**: icon, "Nothing matches", which criteria are too tight, buttons "Widen the search" and "Talk to an
  advisor".
- **Degraded mode**: if the AI is down or times out, fall back to classic results with a banner ("The assistant is
  unavailable, here is the classic search") and `fallback_reason`; never an empty screen.
- Loading skeleton cards; error with Retry.

## 6. Contract with the back end (agree before building)
`POST /search {query, locale, criteria?}` → `{source: "ai"|"sql", explanation, criteria[], activities[{id, score, why,
availability}], total, fallback_reason}`; a streamed variant sends `thinking`, `tool_call`, `token`, `cards`, `done`,
`error` events. The client reads display fields (name, price, picture) from the catalogue by id, never from generated
text, and never learns the model vendor's name. The classic keyword search stays untouched: it serves the classic mode
and the fallback.

## Accessibility
`role="search"`; labels visible or `sr` text; segments are buttons with `aria-expanded`; calendar and counters
keyboard operable; result count announced politely; chips are toggle buttons with `aria-pressed`; all motion stops
with `prefers-reduced-motion`.

## Questions to ask
Which dimensions people search by · what the catalogue can filter · is there an AI backend (and fallback) · voice
wanted · languages of the query · where the bar lives (home, header, app) · name and voice of the assistant · what
the AI may never claim (prices, availability without a tool call).
