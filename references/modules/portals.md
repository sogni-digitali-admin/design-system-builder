# Screen pack: portals around a booking / service business

Read with `booking.md`, `crm.md` and `mobile-app.md`. A service business is not one app: the customer, the team,
the suppliers, the crew on site and the resellers each need a space. Draw each space for its device and show that
they share **one set of data**.

## 1. Customer portal
Sidebar on desktop (≥ 760 px of **component** width), bottom bar on phone. Phone has 5 tabs (Home, Trips/Orders,
Messages, Programme, Profile); invoices, payment methods, reviews and help live under Profile. Use container
queries on the portal frame so the breakpoint follows the frame, not the page.

> **The desktop demo must always show the sidebar.** Never let a narrow page collapse the "desktop" frame into the
> phone layout: design it at 900 px and **scale the frame** (`zoom` / `transform: scale(page width / 900)`, max 1).
> Phone frame: fixed 390 px.

Screens:
1. **Home** — greeting; "next trip" card (photo, countdown, weather at the place, meeting point, ticket button,
   "manage"); tiles: review to leave, points, messages; recommendations.
2. **Trips / bookings** — tabs Upcoming / Past / Cancelled; row = thumbnail, title, date, people, status badge
   (icon + word). Empty states per tab.
3. **Booking detail** — photo, status, date/slot, participants, meeting point + map, host/guide card, documents
   (ticket PDF, invoice, safety terms), payment, points; "Manage" sheet: change date (free until N h before),
   change participants (shows supplement or refund and the new total), add an option, cancel (refund shown before
   confirming, policy text, two-step).
4. **Invoices and receipts** — table (number, activity, amount + status, download), one preview, credit notes for
   refunds, tax shown, retention period stated.
5. **Payment methods** — saved cards (last 4, expiry, "default", "expired: update"), add card form with states,
   remove with confirmation. Never show a full number.
6. **Profile and preferences** — identity, language, notifications matrix (topic × email / push / messaging app),
   consents table (purpose, required or optional, granted date, switch; each change is timestamped and takes effect
   at once), data export, language/theme, linked devices.
7. **Reviews to leave** — only for services actually used; star rating + text; "verified review" label; published
   after moderation (state the delay); list of published reviews.
8. **Referral and loyalty** — see `loyalty.md`.
9. **Help** — FAQ accordion, assistant, human contact; the assistant shows a hand-over notice.
10. **Delete account** — danger box: what is erased, what is kept by law (invoices), a delay before final deletion
    ("can be undone by signing in before <date>"), a typed confirmation, a two-step button.
State toggles in the demo: device, theme, data (normal / loading skeleton / empty / error with Retry).

## 2. Partner / supplier portal (tablet or desktop)
- **Availability calendar** — month grid; tap a day cycles Open (seats left) → Full → Closed; legend with icon + word;
  bulk apply; changes sync to the booking engine at once.
- **Today's manifest** — list of bookings for the departure: name, party size, notes (allergy), status; counters
  ("39 of 45 on board").
- **QR check-in** — scan result screen: *Valid ticket* / *Already checked in* (with time and a warning that a screenshot
  may be shared) / *Not valid today*. One word + icon + colour each; "Simulate a scan" in the demo.
- **Payouts** — received and upcoming transfers in the local currency, commission rule visible, statement download.
- Supplier types (boat captain, dive centre, restaurant) change labels but not structure.

## 3. Crew / staff mobile app (on site, often offline)
Big buttons, strong contrast, today's tickets cached offline. Three screens: **Scan** (valid / already scanned /
wrong date), **Boarding list** (tap a name to tick; missing passengers one tap to call), **Weather and incident**
(keep / delay / cancel decision, incident report; broadcast reaches the back office and the customers). Queue actions
while offline and show "pending". See `references/wearables.md` for the wrist companion.

## 4. B2B: hotels and agencies
- **Commissions** — monthly bar chart (keyboard focusable, data table alternative), next payout date, rate.
- **Book for a client** — customer details, activity, date, price breakdown (public price, partner commission),
  payment on the room bill or by link; the end customer keeps their own points/account.
- **Affiliate links** — per activity, copy button, tracking tag, clicks → bookings.
- Hotel vs agency changes the rate and the payment options, not the screens.

## 5. One source of data
Draw a diagram (SVG) with the entities in the middle — **booking, customer, activity, points, messages** — and the
spaces around them. A solid line = reads **and** writes; a dashed line = read only. Selecting a space highlights its
links; a table says the same in words (accessibility). Then play the example:

> **One check-in, five screens.** The crew member scans ticket `REF-0412` at the pier →
> the partner manifest turns the customer to *Boarded* → the back office schedule shows "39 of 45" → the customer
> portal / messaging app sends "Have a good trip" → on return, status *Completed* credits the pending points.

Rules: a status has one definition (name, icon, colour) reused in every space and in emails; every space shows the
same reference, name and amounts; role decides what is visible (partners never see other partners' customers).

## Questions to ask
Which spaces exist today · who logs in (and how: see `auth.md`) · devices per role · offline needs on site ·
payout and commission rules · cancellation policy · documents the customer must receive · languages · privacy law
and retention periods · does the back office already exist (reuse its navigation).
