# Screen pack: quotes and invoices

## Screens
1. **Quote list** — number, client, amount, status (draft, sent, viewed, signed, expired, declined), validity,
   owner; filters and a "expiring this week" view.
2. **Quote editor** — client and contact, validity, line items: product combobox (ARIA 1.2: popover list, result
   count, ↑↓ Enter Esc), quantity stepper, unit price with override ("Catalogue: … · Reset"), discount %, VAT,
   line total, stock warning ("Only 3 available"), remove; coupon code (valid / expired / unknown states);
   totals block (subtotal, discounts, code, total excl. VAT, VAT per rate, total incl. VAT) in an `aria-live`
   region, formatted per language; terms and notes; preview as the client sees it.
3. **Sending and signing** — email with link, client view (accept with signature, decline with reason), status
   timeline, reminders.
4. **Invoices** — from a signed quote, numbering rules, payment status (unpaid, partially paid, paid, overdue),
   payment link, credit note.

## Rules
- Totals recompute live and are announced; rounding per line or per total stated in the spec.
- A sent quote is locked; editing creates a new version (v2) and keeps history.
- Legal mentions per country in the footer (company id, VAT number label per language).
- A "lead mode" may exist with fewer columns (quantity, price, amount) when products are attached to a lead.

## Questions to ask
Numbering format · validity default · VAT rates and per-country rules · discounts allowed per role · e-signature ·
payment provider · languages of the client-facing documents.
