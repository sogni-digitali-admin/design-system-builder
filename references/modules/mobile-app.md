# Screen pack: mobile app / PWA

Read `references/mobile-pwa.md` for navigation and PWA rules. This pack lists the screens to draw in phone frames.

## Screens (adapt names to the product)
1. **Home** — greeting, today's items (agenda, tasks), key numbers, quick actions.
2. **Main list** (leads, orders, bookings…) — search, filter sheet, swipe actions, pull to refresh, skeleton, empty.
3. **Detail** — header card, actions row (call, email, navigate), timeline, sticky primary action.
4. **Create** (the central + of the bottom bar) — short form in steps, camera/scan if relevant, save draft offline.
5. **Inbox / messages** — threads, composer above the keyboard, attachments.
6. **Calendar / agenda** — day list, week strip, add.
7. **More** — the other modules grouped, settings, help, sign out.
8. **Notifications** and **offline** states; **onboarding** (3 screens max, skippable) and **permissions** asks
   (explain before the system prompt).

## Rules
Thumb zone for primary actions; one primary action per screen; system back always works; no hover-only
interactions; text ≥ 16 px in inputs (no zoom on iOS); dark mode follows the system unless the user chose.
