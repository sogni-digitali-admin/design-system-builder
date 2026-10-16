# Smartwatch: watchOS and Wear OS

Write this section when the product has a watch app, or a ticket, countdown or crew tool that must work from the
wrist. A watch app is an extract of the phone app, never a copy: one fact, one gesture. Draw both platforms side
by side from the same data, in CSS and SVG (no device images).

## 1. Frames and real proportions
| Frame | Logical screen | Safe area | Controls |
|---|---|---|---|
| Apple Watch 45 mm | 198 × 242 px, corner radius ≈ 42 px | 178 × 222 (10 px margin) | digital crown, side button (double press) |
| Apple Watch 41 mm | 184 × 224 px | 164 × 204 | same |
| Wear OS round | 192 px circle | 136 × 136 inscribed square; only rings/borders may use the edge | crown or rotating bezel, 2 buttons |

- Background is pure `#000` here (the only place the rule allows it): unlit OLED pixels save battery and make
  colour pop. Accents come from the dark theme tokens, never from the light theme.
- Draw the case, crown and button; the crown/button highlight when a step says "hold the crown".
- Screens inside a frame use the platform's own title row (small title, clock top right on Apple, none on round).
- Provide a role switch (traveller / crew), a platform switch and a crown/arrow-key scroller so the frames are
  testable by keyboard. Include a dark and, if the brand has one, a variant theme.

## 2. Glanceable rules
- One screen = one or two facts, the main one first and biggest. Read in < 5 s: raise, read, lower.
- Type: ≥ 15-17 px for any read text, 20-22 px for a sentence, 34-46 px for a figure. Tabular numbers for times,
  points and prices. Max 2 lines of body.
- Targets ≥ 44 px high, 6-8 px apart; bottom buttons on round screens are shortened to follow the curve.
- Colour is never alone: alert = icon + word. In sunlight colour contrast vanishes; shape and text must carry it.
- The crown/bezel scrolls lists and changes screens, never a critical setting; one light haptic tick per detent;
  stop at the end of a list, no bounce.
- Reduced motion: waveform becomes a static gauge, spinner stops, rings appear at once. Haptics stay.

## 3. Complications and tiles
- **Apple Watch families**: circular small (ring + ≤ 4 characters, e.g. a countdown), rectangular (two lines:
  time + place), corner (arc gauge + figure), bezel text (curved label around a circle: the voice shortcut).
- **Wear OS tiles** (swipe from the face): countdown (large duration + time + one-tap ticket), points/balance ring,
  local weather/status, round voice button. 4 tiles maximum, dots show position.
- Show a full face mock-up with numbered slots (date, status, time, next event + countdown, shortcut, balance).
  The product only adds its own slots; it does not replace the user's face.
- Complications refresh from the last sync and show the sync time in the spec, never a stale "live" value.

## 4. Notifications with actions
Three patterns only, all with a haptic (table below) and 2-3 actions scrollable by crown:
reminder ("in 30 min": directions, call, I'm late), change alert (schedule/weather: icon + word + short
sentence), and thanks/credit after the event (once). Rules:
- Max 3 per event. No promotions, ever, on the wrist.
- Quiet hours by the venue's local time (e.g. 22:00-06:00): nothing except a safety alert for crew.
- A "sea/activity mode" holds notifications while the user is busy and delivers them after.
- If the phone is unlocked and looked at, notify there, not on the wrist.

## 5. Ticket / QR full screen
White background, maximum brightness, QR + reference + holder name, nothing else. Works with no network and no
phone: copy the ticket on every sync. The QR token is signed and valid until the end of the service, so it can be
verified offline at the gate. Offline variant shows the same QR with a warning icon + "Offline", never hides it.

## 6. Voice assistant on the wrist
Flow (one screen each): **launch → listening (live transcript) → thinking → answer (+ card) → action**.
- **Launch**: complication tap · raise wrist + hold crown/button 1 s · optional wake word, off by default, enabled by
  the user; nothing leaves the watch before it. First open shows "<Assistant> is an AI" and the mic indicator.
- **Listening**: animated waveform, orange dot while the mic is on, words appear one by one under the wave.
  Show the finished transcript before acting: the user can see what was understood.
- **Thinking**: assistant mark + 3 dots. Static dots with reduced motion.
- **Answer**: spoken in full, written in **≤ 12 words** (2 lines) + a compact card for details (time, place, figure).
  Voice expands, screen summarises. Read aloud toggle in settings.
- **One-tap actions** below the answer, one at a time, as a list (directions, ticket, "tell them I'm late").
  Reversible actions get an Undo for a few seconds.
- **Confirm before paying**: amount in large type, then a double press of the side button. Up to a threshold
  (e.g. 50 €) on the watch; above it or when unsure, validate on the phone with code or face. Never read or show
  card data ("saved card" only). The assistant never pays alone, even if the sentence was clear.
- **Quick replies and dictation** when speaking is impossible: 3-4 canned answers, "Dictate" last.
- **Hand-off to the phone**: "Continue on phone" opens the same conversation/screen in the PWA or app.
- **Hand-off to a human**: "I'm passing you to <name>" + expected delay + Call; the human gets the summary.
- **States**: error (one calm sentence + Retry, never the word "error"), offline (say so; ticket stays), mic
  denied (explain, offer quick replies, "allow on the phone"), AI notice.
- Voice follows the language chosen in the app; shown text and speech use the same setting.
- Replayable scenario with 3 exchanges (info, small action, paid action) and a conversation log, keyboard operable.

## 7. Staff / crew screens
Hands are busy: the watch counts, confirms and alerts. Screens:
- **Boarding counter**: ring + number ("12 of 16"). Each check-in made on the tablet/phone buzzes the watch.
- **Check-in confirmed**: holder name + new total.
- **Weather / incident**: list with "hold 1 s" on destructive or broadcast actions (avoids false taps); sends to the
  back office and travellers.
- **Missing passengers**: names, count, one tap to call; departure countdown in the title.
Scanning stays on the tablet or phone; the watch never scans.

## 8. Haptics
| Pattern | Sequence | When |
|---|---|---|
| Success | 2 short taps | check-in valid, payment confirmed, message sent |
| Alert | 3 long taps | schedule change, weather, incident, missing passenger |
| Reminder | 1 medium tap | event in 30 min, assistant reply ready while screen is down |
Three patterns only, distinguishable without looking. Offer a "Try" button (`navigator.vibrate`) in the demo.

## 9. Sync with phone / PWA, offline
- The watch keeps an extract: next event, ticket, balance. Phone = full history, relay, payment.
- Show "Synced at HH:MM" and the state of watch / phone / server in one diagram with an offline toggle.
- Actions made offline queue with a "pending" mark and leave on reconnection. Payments are never queued.
- Every watch screen has a phone/PWA equivalent ("Continue on phone" opens that one).

## Questions to ask
Which platforms (Apple, Wear OS, both) · is there a native app or only PWA + notifications · which roles use a watch ·
payment on the wrist allowed, with what threshold · wake word wanted · quiet hours and time zone · what must work
offline.
