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
