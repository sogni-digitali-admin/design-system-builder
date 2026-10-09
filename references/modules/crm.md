# Screen pack: CRM / sales tool

## Screens
1. **Dashboard** — stat tiles (open pipeline value, won this month, conversion, overdue activities) with deltas;
   pipeline by stage (bars); activity due today; first-use state (figure + "Import your contacts").
2. **Pipeline (kanban)** — one column per stage with count and total; cards (company, value, owner avatar, next
   activity chip, "stale" badge after N days without activity); drag and drop **and** keyboard move
   (Space to lift, ←/→ to move, Space to drop, Esc to cancel, live announcement); won/lost drop zones.
3. **Leads / deals list** — table with saved views, filters (stage, owner, source, value, date), bulk actions
   (assign, change stage, tag, export), density toggle.
4. **Lead / deal page** — header (title, value, stage stepper, owner, actions), tabs: activity timeline (notes,
   emails, calls, meetings, files), contact & organisation, products/quote, history; a composer for notes/emails.
5. **Contacts and organisations** — list + card with avatar (people) or squircle (organisations), relations,
   duplicates warning and merge.
6. **Activities / calendar** — list by due date, calendar week view, quick add, reminders.
7. **Inbox** (if mail is in the product) — threads linked to contacts, unknown-sender → "create lead".
8. **Settings** — pipelines and stages, custom fields, tags, users and roles, import/export.

## Rules to show in the specs
- Stage changes are logged in the timeline; "lost" asks for a reason (list + free text).
- Every lead has a next activity, or a visible "no next step" warning.
- Amounts show the deal currency; totals in the account currency with "≈" when converted.
- Activity types share one icon vocabulary (call, email, meeting, task, note) across list, timeline and calendar.

## Data to model in demos
People (5–6, with roles), organisations (4–5, mixed sizes), deals with realistic values and stages, one won deal
with its quote, overdue and today activities. Reuse the same names in every section.

## Questions to ask
Stages and their names · lead sources · roles and what each may see · currencies · is there a quote/invoice module
(see `quotes-invoices.md`), products (see `products-inventory.md`), email sync, AI assistant?

## Illustrations (custom figure ideas)
Sorting rack (pipeline empty), canal locks (funnel), mailbox (inbox), stamp (quote signed), stacks of coins
(revenue), telephone (calls), diary (calendar empty).
