# In-app notification system

Write this section when the product shows more than a toast now and then. A notification system is one language
(shape, motion, words, rules), one queue and one API; the generic `dsToast` of the components section becomes a thin
wrapper over it. Page-wide toasts, push mock-ups, update and offline banners all restyle through it.

## 1. A signature derived from the brand
Choose one natural gesture from the brand and make every notification perform it, so the system is recognisable
without a logo. Derive it from the identity (sea, mountain, post, light, clockwork…). Document: the metaphor in one
sentence, entry, exit, the "time remaining" device, and the reduced-motion version.
Example (a sea-based brand): **"the swell"** — a drop falls at the top of the screen, stretches into a wave to carry
the message, then recedes; the remaining time is a **crest** that drains right to left. Entry 420 ms, exit 320 ms,
dedicated easing token.
- Tokens: `--nf-dur-in`, `--nf-dur-out`, `--nf-ease`; surface and border from the existing tokens; radius large.
- Never rely on the metaphor to carry meaning: every intent also has an icon and a written word.

## 2. Intents (icon + word + colour)
| Intent | Word | Duration | Priority | Announce |
|---|---|---|---|---|
| Critical alert (weather, safety) | Alert | until closed | 1 | assertive |
| Error | Error | until closed | 2 | assertive |
| Message from a person | the person's role | 8 s | 3 | polite |
| Success | Success | 4 s (8 s with Undo) | 4 | polite |
| Assistant | the assistant's name | 7 s | 5 | polite |
| Information | Information | 5 s | 6 | polite |
| Loyalty / reward | programme name | 6 s | 7 | polite |
| Promotion | Offer | 6 s | 8 | polite |
- Add 35 ms per character beyond 70 so long text can be read. Any notification with an action lasts ≥ 8 s.
- Each intent has its own **animated icon** (check draws, ring ripples once, buoy floats…) inside a 44 px circle.
- Error always offers a recovery action. Promotion is discreet (dashed border, no timer crest) and shows **only** when
  nothing else is shown or queued, never during a booking or payment.
- Colours: success/info/warning/danger tokens for badge, word and crest; text on the neutral surface so AA holds in
  both themes.

## 3. Anatomy (annotate it in the page)
Badge (44 px) · intent word · title (one line: the fact) · body (≤ 2 lines: date, place, amount) · actions (the first
always visible, the others on expand, "Undo" always visible while the crest is not empty) · close (44 px target) ·
crest (time left). Expanded card adds a `detail` paragraph.

## 4. Live activity (persistent pill)
A long event (countdown → boarding → in progress → back) does not fit a toast. One pill at a time, persistent, tap
to expand. States: **waiting** (countdown), **boarding** (progress), **in progress** (moving marker on a line),
**done**. Show the four states side by side and a "fast time" replay (1 s = 2 min). It uses the primary colour, never
an intent colour.

## 5. Stack / pile
- Max **3 visible**; further ones wait in a **priority queue** (table above); same `key` updates the existing card
  instead of adding another.
- A high-priority item (alert, error) takes the place of the oldest lower-priority card.
- Collapsed: only the top card is read and touchable. Tap the pile or swipe down to spread, swipe up to fold;
  "Clear all" empties it. Closing a card removes it from the pile.
- Unread items stay in a **notification centre** (bell with count); the pile is not the history.

## 6. Interaction
- Swipe sideways to dismiss (card leaves sideways); tap to expand; **pause** the crest on hover, keyboard focus,
  expanded state and hidden tab.
- `Esc` closes the focused card. A global shortcut (e.g. `Alt+N`) moves focus to the latest notification. Tab order:
  card → its actions → close.
- Placement: desktop top-right, ~392 px wide, never over the primary button or navigation; phone top, under the
  notch, full width, never over the tab bar or the field being typed in.
- **Quiet hours** (e.g. 22:00-07:00 venue time): only alerts, errors and results of the user's own actions appear;
  the rest wait for the morning and sit in the centre. Offer a "simulate night" switch in the demo.
- One notification per event; never for something already visible on screen.

## 7. Accessibility
- Container `role="region"` + `aria-label`; polite items in a `role="status"`, assertive ones in `role="alert"`.
- Never steal focus except through the shortcut. Actions are real buttons with full labels.
- Duration is a minimum, not a deadline: pause on focus; offer "keep notifications until closed" in the
  accessibility panel.
- **Reduced motion**: plain 160 ms fade, no drop/bubbles/splash; the crest still drains, without ripple.

## 8. One JavaScript API
```js
Notify.show({
  kind: 'weather',            // success | info | weather | error | assistant | loyalty | message | promo
  title: 'Wind 28 km/h at 10:00',
  body: 'Departure moved to 8:00.',
  detail: 'Shown when the card is opened.',
  actions: [{ label: 'Confirm 8:00', onClick: n => {} }, { label: 'Undo', always: true }],
  duration: 0,                // 0 = until closed; otherwise ms (default from the intent)
  key: 'weather-24-oct'       // same key updates the card
});
const live = Notify.live({ title: 'Boat trip', place: 'Pier 3', wait: 42, board: 10, sea: 140 });
live.next(); live.end();
```
- One module, one container, no dependencies. `dsToast(text)` calls `show({kind:'info'})`.
- **Restyle every existing toast** of the page through it: the old toast, push mock-ups, update banner and offline
  banner keep their classes but take the same badge, word, crest and placement. Show before/after.

## 9. Page contents
Playground (button per intent, "with Undo", "burst of six", "clear all", "simulate night", desktop/phone frames) ·
live pill · stack demo · intents table with the 8 icons animated · annotated anatomy · rules list · motion spec ·
tokens table · existing components restyled · API block with copy button.

## Questions to ask
Which events notify (and which only change a badge) · intents the product really needs · push / web push / email
mirror · quiet hours and time zone · is there a long-running activity · who may send promotions · notification centre
retention · language and plural rules.
