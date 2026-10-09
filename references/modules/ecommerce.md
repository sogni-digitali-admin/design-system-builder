# Screen pack: e-commerce

## Screens
1. **Catalogue / category** — grid with filters (facets with counts, price range, availability), sort, active
   filter chips, pagination or "load more", empty and no-result states.
2. **Product page** — gallery (zoom, swipe on phones), title, price (sale price + was-price + saving), variants
   (size/colour swatches with out-of-stock states), quantity, add to cart (loading → added), delivery estimate,
   stock hint, reviews summary, details tabs/accordions, related products. Sticky add-to-cart on phones.
3. **Cart** — mini-cart drawer + cart page: lines with quantity and remove (undo), coupon, shipping estimate,
   free-shipping progress, totals, trust signals, empty cart.
4. **Checkout** — guest or account, steps (contact, delivery, payment) on one page or stepper, address autocomplete,
   delivery options with dates and prices, payment methods, order summary always visible, error states for each
   field and for payment failure, confirmation page.
5. **Account** — orders with status timeline (paid, preparing, shipped with tracking, delivered, returned),
   addresses, returns flow, wishlist.
6. **Back office** (if in scope) — orders list, order detail, refunds, stock (see `products-inventory.md`).

## Rules
Prices with currency and VAT mention per country; never hide fees until the last step; out-of-stock variants
visible but disabled with the reason; cart and checkout keyboard and screen-reader complete; payment errors say
what to do.

## Emails
Order confirmation, shipping (tracking), delivery, refund, abandoned cart (marketing consent), review request.
