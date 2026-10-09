# Screen pack: website / marketing site

The design system of a website shows the **public pages** (what visitors see) and, if the client edits the site,
the **editor** (`content-editors.md`).

## Page templates
Home · About · Services/Product · Pricing · Case study / Portfolio · Blog list + article · Contact · Legal pages ·
404 / 500 · thank-you pages after forms. Show each as a full page in a browser frame, desktop and phone.

## Blocks (the building pieces)
Header (logo, nav, language switch, CTA; sticky; mobile menu), hero (3 variants: text + image, centred, split with
form), logo strip, features grid, alternating image/text, testimonial(s), stats, pricing table (monthly/yearly
toggle), FAQ (accordion, `<details>`), call to action band, gallery, latest articles, team, contact with map, form,
newsletter, footer (columns, legal, socials, language). For each block: content limits (title ≤ 60 chars…), image
ratios, what happens on phones, and the editor fields that fill it.

## Forms
Contact, quote request, booking, newsletter (double opt-in), job application, callback. States: idle, focus, error
per field, sending, sent (thank-you page or inline), server error; anti-spam that does not punish humans
(honeypot, proof-of-work widget, rate limit); consent checkbox unchecked by default linked to the privacy notice.
Each form has its two emails (`references/emails.md`).

## SEO and performance (show as rules)
One h1 per page; titles ≤ 60 chars, descriptions ≤ 155; Open Graph image 1200×630 template; hreflang per language;
`/lang/` prefixes; images AVIF/WebP with width/height; fonts self-hosted with `font-display: swap`; LCP image
eager, others lazy; cookie banner only if non-essential cookies exist.

## Questions to ask
Pages and their order · languages and URL scheme · who edits the site · blog or not · forms and where submissions go
· analytics (privacy-friendly?) · photography style or illustrations.
