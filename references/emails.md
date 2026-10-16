# Emails

Three families, all in every product language:
1. **Transactional emails of the product** (to users): invitation, password / passkey, sign-in alert, export ready,
   payment receipt, plan change, cap reached, weekly digest, approval waiting, error in an integration.
2. **Emails the client sends to their customers** (templates in the product): quote sent, reminder, meeting
   confirmation and reminder, thank you, follow-up, newsletter shell.
3. **Website form emails**: acknowledgement to the visitor, notification to the team, one per form type (contact,
   quote request, booking, newsletter double opt-in, job application, callback).
Plus **signatures** (several layouts: minimal, with photo, with logo and links, compact for replies).

## How email HTML must be built (it is not web HTML)
- Tables for layout, 600 px max width, one column on phones (fluid), inline styles (keep a `<style>` only for the
  media queries and dark mode), web-safe font stack after the brand font, images with `width`, `height`, `alt`,
  hosted on https (never data URIs), a hidden preheader, a plain-text part.
- Buttons: "bulletproof" (table cell with padding + link; VML for Outlook desktop if needed). Min 44 px tall.
- Dark mode: `color-scheme: light dark` meta + `@media (prefers-color-scheme: dark)` overrides; logos with a
  transparent background need a light and a dark version.
- Variables in lowercase with the backend's syntax (`{{first_name}}`, `{% if … %}`) — uppercase `{{…}}` is reserved
  for the build's markers. Every variable has a fallback ("Hello," when the name is missing).
- Legal footer per country (company id, address, why you receive this, unsubscribe for marketing only).
- Prefix every class in the email (`o-btn`, not `btn`): the design page's own CSS would style them otherwise.

## In the design system page
- A viewer: list of templates (family, trigger, language), the email rendered in an `<iframe srcdoc>` (isolated
  CSS) at desktop and 375 px widths, light/dark toggle, the subject and preheader, the variables used.
- A generator script in the part (`.js`) that renders every template × language from one data file, so the
  exported files and the page never drift. Export the HTML files to `dist/emails/<lang>/<name>.html` with a small
  Node script when the team needs them.
- Signatures shown as they appear in Gmail/Outlook (white background), with a copy button for the HTML.
- Test list in Notes: Gmail web/app, Outlook desktop/web, Apple Mail, dark mode, images off.

## Signature generator
A tool section, not just samples. Fields: name, role, phone, messaging app (+ number), email, language, location,
variant, banner on/off. Every field updates a live preview.
- **Preview** inside fake Gmail, Outlook and Apple Mail chrome, each in light and dark rendering (dark: show what
  the client does to logos and links, not only your own dark media query).
- **Variants**: full; compact reply; mobile (single column, links ≥ 44 px); campaign banner (600 × 120 hosted
  image with `alt` and a link); crew / emergency number (large phone, nothing else); partner / B2B (legal line,
  company id).
- **Copy as rich HTML**: `navigator.clipboard.write([new ClipboardItem({"text/html": htmlBlob, "text/plain":
  textBlob})])`; fallback: select the preview node and `document.execCommand("copy")`. A second button, "Copy
  HTML", copies the source. Confirm in a live region.
- **Output**: tables and inline styles, < 10 KB, no scripts. The logo is a hosted https URL, flagged "replace
  with your hosted URL" in the UI and in Notes (clients strip data URIs). Links: `tel:+…` and
  `https://wa.me/<digits>`. A flag or brand stripe is a thin coloured rule (table cell border), never an image.

## Messaging templates (WhatsApp / SMS)
Show approved templates, not free chat.
- **Anatomy**: optional header image, body with numbered variables `{{1}}`, `{{2}}` (sample values shown beside),
  one action button (URL or call), up to three quick replies, a footer line.
- **Rules to state**: the recipient must have opted in; free-form replies are allowed only inside the 24 h
  service window, outside it only an approved template; categories (utility / marketing / authentication) are
  approved in advance; a signature line says who writes; SMS and marketing end with "STOP" to opt out.
- **Never reproduce the WhatsApp logo or its bubble art**: use a generic chat icon plus the label "WhatsApp".
  Phone mock-ups use the product's own colours.
- Translate each template per language; variables keep their order unless grammar forces a rewrite.
