# Screen pack: loyalty programme

For products where customers earn points or tiers (bookings, shops, subscriptions). Give the programme a name and
three tier names from the brand's world; keep amounts consistent with the booking/shop section (same prices, same
currency). Numbers below are demo values to replace, and go in Notes.

## Screens
1. **Tiers and benefits** — 3 cards (e.g. 0 / 5 000 / 15 000 points earned), each with icon, threshold and 3-4
   benefits (earn rate bonus, priority, discount on extras, free cancellation window, yearly gift). The member's
   current tier is marked "Your tier" (badge with icon + word). Show how the tier is computed under the cards.
2. **Member card** — tier, balance ("available points"), member number written in clear text, QR for the front desk
   (the number is the source of truth; the QR is a convenience). One card style per tier. Add to phone wallet. The
   card reacts live to redemptions and credits.
3. **Progress meter** — `role="progressbar"` from current tier to next with the tier labels and thresholds on both
   ends, the sentence "420 points missing for <next tier>" and, at the top tier, "Top tier reached".
4. **Pending points** — after a booking: banner "+1 780 points pending, credited when the activity is done" with
   the booking reference, date and amount. A **simulate completion** button credits them and animates the meter;
   crossing a tier threshold shows a celebratory toast.
5. **Rewards catalogue** — cards (icon, title, one-line value, cost in points). First click arms ("Confirm"), second
   click redeems. A reward out of reach stays visible and disabled with "N points missing" written.
6. **History** — ledger rows: date, title, subtitle (booking ref), amount with sign. `+` earned, `-` spent; the sign is
   in the text, colour only reinforces. Show pending, expired and adjusted rows with their own icon + word.
7. **Referral** — code in a copy field (copy button + toast), "Share" via the system share sheet (no external
   service), reward line for both sides ("Give 10 €, earn 500 points"), stats (invited / booked / points received),
   a sentence per state ("Camille lived her first activity: 500 points credited").
8. **Badges** — grid: earned (soft loop animation, "Earned") and locked (static, written progress "0 of 1"), each with
   icon, name, how to get it. Never emoji.
9. **App-bar points widget** — fits 390 px: icon + balance + "+N" mark while points are pending; opens a small popover
   (tier, meter, link to the programme). States: rest, pending, loading skeleton, guest ("Join <programme>" button).
10. **Empty state (new member)** — figure + "Your adventure starts here" + a concrete example of what a first purchase
    earns and what that buys + a primary button to the catalogue.
11. **Programme rules page** — the four rules below as large numbers with one sentence each, plus a small simulator
    (slider of amount spent → points earned, with the tier bonus).

## Rules to show in the specs
- **Earn rate**: N points per currency unit on the amount actually paid (tax included, free transfers excluded);
  higher tiers add +20 % / +50 %.
- **Tier** is computed on points **earned** over a rolling window (e.g. 24 months), never on the balance: spending
  points never lowers the tier.
- **Credit timing**: points are credited when the service is **done**, not at booking; a cancellation removes the
  pending points; a partial refund removes them proportionally.
- **Expiry**: each point expires N months after it was credited; reminder email 60 days before; the history shows the
  expiry date of the next batch.
- **Redemption**: reward code or discount applied to the next booking; codes expire; irreversible redemption needs a
  second confirming click and is logged.
- **Referral**: friend's reward on first purchase, referrer's after the friend has *used* the service.
- Anything with money value shows the currency; points are written with a thin non-breaking space (`1 780`) and
  tabular numbers.
- Welcome bonus at sign-up is shown on the sign-up screen only if it is real.

## Emails and messages
Welcome to the programme · points pending · points credited · tier reached (and tier at risk if applicable) · points
expiring in 60 days · reward redeemed (with code) · referral: friend joined / friend's first service done · birthday
offer if any.

## Data to model in demos
One member near a tier threshold (so the celebratory moment can be played), 6-8 ledger rows with each type
(earned, spent, referral, pending, expired), 4 rewards at increasing prices, 6 badges (3 earned), a referral code of
the form `FIRSTNAME-BRAND26`. Reuse the customer and booking from the booking and portal sections.

## Questions to ask
Does a programme exist and what is it called · tiers, thresholds, window · earn rate and exclusions · expiry · rewards
available and who fulfils them · referral amounts · where points show (app bar, checkout, emails) · is a physical or
wallet card needed · legal constraints on promotions and data.
