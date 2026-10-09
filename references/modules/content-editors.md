# Screen pack: site editor, blog editor, AI writing

## Site editor
- **Page tree** (drag to reorder, status dot: published / draft / scheduled / to re-translate), page settings
  (slug, SEO, social image, visibility).
- **Block editor**: the page as a stack of blocks; add block (searchable menu with previews), move (drag + keyboard),
  duplicate, hide, delete with undo; a side panel with the block's fields (text, image with alt per language, links,
  variant); rich text restricted to what the design allows (bold, italic, link, lists, headings h2–h3).
- **Preview** desktop / tablet / phone, light/dark if the site has both; shareable preview link with expiry.
- **Publish**: publish now / schedule; version history with diff and restore; who changed what.
- **Translations**: source language first; other languages cloned and marked "to re-translate" when the source
  changes; side-by-side view.
- **Media library**: upload (drag, progress), formats generated (AVIF/WebP/JPEG), alt text per language required,
  usage ("used on 3 pages"), replace keeps links.

## Blog editor
Article list (status, author, category, date, reads), article editor (title, slug, excerpt, cover with focal point,
body, categories/tags, author, reading time computed), SEO panel with search preview, RSS, scheduled publishing,
related articles.

## AI writing (inside both editors)
- Actions on a selection or a block: rewrite (tone: shorter, friendlier, more formal), translate, summarise, generate
  a draft from bullet points, suggest titles/meta descriptions, alt text from image.
- Output is always a **suggestion** shown as a diff (accept / edit / discard) and marked "AI draft — to review"
  until a human edits or approves it; never published directly.
- Show cost/usage if metered, and what data is sent (the block only, not the whole site).

## Rules
Client content inside the editor demo stays in its own language (`data-i18n-skip`): it is content, not interface.
