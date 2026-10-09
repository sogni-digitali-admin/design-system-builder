# Screen pack: products and inventory

Applies to CRMs with a catalogue (e.g. Krayin: product = name, sku, description, quantity, price; inventories per
warehouse and location with in_stock and allocated), shops and booking products.

## Screens
1. **Catalogue** — table or grid (grid by default on phones); search on name (every language), SKU and tags with
   highlighted matches (`/` focuses search); filters type / status / edition; display currency switch (reference
   currency + converted prices marked "≈", hand-set prices marked "fixed"); thumbnail per type; stock badge with
   available count; "used in N leads / N quotes"; selection with a bulk bar (archive, tag, CSV export; delete
   blocked for products used in quotes → archive instead); low-stock alert bar; pagination; states: loading
   skeleton, empty catalogue (figure + "Add your first product"), filtered-empty, error + retry.
2. **Product page** — header (image, type, name, SKU, status, stock badge, Edit / Duplicate / Archive), price
   boxes per currency; tabs (arrow keys, Home/End): Overview (description + translation rows: source / translated /
   to re-translate), Inventory (in stock / allocated / available, per warehouse and location), Attributes, Activity,
   Sales (monthly revenue chart, where it was sold).
3. **Stock adjustment** — native `<dialog>`: add / remove / recount, quantity stepper, **reason required** (delivery,
   stock count, breakage/loss, return, transfer, other), note, live "before → after", refuses going under the
   allocated quantity, writes an activity entry, focus returns to the opener.
4. **Product form** — name/description per language (source required, dots on missing translations), SKU (uppercase,
   format check, live uniqueness with a suggestion), type (service → no stock tracking), price + currency with
   conversion hint, VAT, unit, linked edition/plan, stock tracking + locations repeater (warehouse → location,
   opening quantity, alert threshold, duplicate check), active switch; errors after blur or on save + summary.
5. **Warehouses** — cards (locations, units, alerts), detail with contacts and a location × product table, low-stock
   banner with "Adjust" and "Create a restock task".

## Rules
- available = in stock − allocated; low = at or below the location's threshold; out = nothing available.
- Stock badge: in stock (success), low (warning, triangle), out (danger), not tracked (dashed, muted) — icon + word.
- Product types get fixed chart colours (pack, add-on, service, physical), never status colours.
- AI may *suggest* related products ("often sold with…") but never adds a line without a click.

## Questions to ask
Product types · currencies and who sets converted prices · VAT rates · units · do services track stock · warehouses
and locations · who may adjust stock · edition availability of multi-currency and AI suggestions.
