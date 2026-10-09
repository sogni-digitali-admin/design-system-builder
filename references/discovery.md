# Discovery

Goal: know enough to make decisions, and know which decisions are not yours. Read first, ask second, invent never.

## 1. Read what exists
- Brand sheet, logo files (SVG preferred; a PNG means asking for the vector), existing website or app screenshots.
- Product documents: plans, pricing, feature lists, backend plans, user stories. They hold the vocabulary
  (what the product calls a "lead", a "booking", an "order"), the editions, the limits and the screens.
- An existing codebase: its framework (Tailwind? Vue? React?), its icon set, its components — the design system
  should map onto what developers already use (see `references/sections.md`, Integration).
Note what you learn in `notes/discovery.md`: facts with their source, and a separate list of assumptions.

## 2. Ask what you could not find
Ask in one short message, with a recommended default for each, so the person can answer "yes" in one go.

| Question | Why it matters | Default if no answer |
|---|---|---|
| What is the product? (CRM, website, shop, booking, SaaS tool, mobile app, mix) | picks the screen packs in `modules/` | the closest pack + say so |
| Which languages, and which one is the source? | the whole page is written in the source and translated | the person's language as source |
| Editions / plans and what each includes | badges "Pro only", limits shown in screens | none shown |
| Which screens matter most? | the module sections go deep on those | the pack's first three screens |
| Brand assets you may use (logo, fonts, photos) and their licences | the page ships them | logo only, open fonts |
| Default theme (light, dark, both) | splash, PWA colours, screenshots | both, light first |
| Who reads the page? (client, developers, both) | tone of the prose, depth of the specs | both |
| Is there an AI assistant or agents? Email? Mobile/PWA? | adds `ai-ux`, `emails`, `mobile-pwa` sections | ask — they are big |

## 3. Product type → screen packs
| Product | Read | Typical sections after the core |
|---|---|---|
| CRM / sales tool | `modules/crm.md`, `modules/products-inventory.md`, `modules/quotes-invoices.md` | dashboard, pipeline, contacts, products, quotes, activities |
| Website / marketing site | `modules/website.md`, `modules/content-editors.md` | page templates, blocks, blog, forms, SEO, editor |
| E-commerce | `modules/ecommerce.md`, `modules/products-inventory.md` | catalogue, product page, cart, checkout, account, orders |
| Booking / services | `modules/booking.md` | availability, booking flow, calendar, reminders |
| SaaS app / back office | `modules/saas-app.md` | onboarding, settings, team & roles, billing, notifications |
| Mobile app or PWA | `modules/mobile-app.md` + `references/mobile-pwa.md` | phone frames, bottom bar, sheets, offline |
Mixes are common (a CRM with a website editor, a shop with a booking flow): take the packs that apply.
Cross-cutting sections — AI (`ai-ux.md`), emails (`emails.md`), error pages and empty states
(`illustrations-hairline.md`) — come with almost every product.

## 4. Write the plan back
Before building, give the person a short plan: the section list in order, what each will show, the open
questions. A design system is many decisions; showing the list first is cheaper than rebuilding a section.
