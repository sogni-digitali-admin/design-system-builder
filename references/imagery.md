# Imagery: photos, credits, avatars

Photos make a product feel real and are the most common source of legal and honesty mistakes. Rule one: **never ship
lorem, stock-looking or random placeholders silently.** Either a verified photo with its credit, or a placeholder that
says it is one.

## 1. One image registry
Every photo is referenced by a **key**, never by a file path, from a single registry (JSON file + a tiny runtime).
Fields per key:

| Field | Meaning |
|---|---|
| `file` | local file, already compressed |
| `subject` | what is truly in the picture and where, in plain words |
| `author`, `author_url` | creator |
| `source_url` | the page of the photo at its source |
| `license`, `license_url` | exact licence and its text |
| `via` | where it was found (dataset, search page) and how the licence was read |
| `original_title`, `size_kb`, `date_checked` | traceability |
| `query` | the search that should find a replacement |

Runtime: `img(key, alt)` returns the photo if `IMAGES[key]` exists, else the **placeholder renderer**; `credit(key)`
returns the visible credit; a `images-ready` event lets photos arrive after load. The calling code never changes when
photos are added. Page text has no hard-coded credits.

## 2. Placeholder renderer
A neutral gradient from the brand tokens, a subject icon (library icon, not emoji) and the **intended query** in
small type ("catamaran turquoise lagoon"), `role="img"` with the real alt text. It must look intentionally unfinished,
so nobody mistakes it for the final art. The build prints a warning with the list of keys that are still
placeholders; the Notes section repeats it.

## 3. Which licences you may use
| Licence | Allowed | Condition |
|---|---|---|
| CC0 / public domain | yes | none (credit anyway if easy) |
| Unsplash licence | yes | no resale as a standalone image; credit is polite and shown |
| Pexels / Pixabay licence | yes | check the page; list as such |
| CC BY (2.0, 3.0, 4.0) | yes | **visible author + licence name + licence link + source link**; note "cropped / resized" |
| CC BY-SA | only with the person's OK | share-alike spreads to derivatives |
| CC BY-NC, ND, "all rights reserved", stock-site previews | **no** | |
| Random web image, social media, AI-generated look-alikes | **no** | |
- **Verify the licence from the source's own metadata** (the photo page, the dataset's licence column), not from a
  search engine badge or someone's summary. Write how you checked in `via`.
- If you cannot open the source, say so in Notes and don't use the photo.

## 4. Honesty
- A photo must show what the caption says. **Flag photos not taken at the real place** (e.g. "a lagoon, location not
  stated by the author") in `subject` and in Notes; use a neutral caption, never the place name the product sells.
  If the registry key names a place the photo is not from, rename the key or replace the photo.
- **AI-generated images**: never present one of a real place, person or business as a photograph. If used (mood art,
  textures), label them "AI-generated illustration" next to the image and in the credits table, and keep them out of
  product pages where the image is a promise (rooms, boats, food).
- No photos of identifiable people unless a release exists. No faces of children from the web.
- Images with text baked in are rejected (they can't be translated).

## 5. Avatars
Initials in a circle (people) or squircle (organisations) on a colour from the **chart palette**, chosen from a hash
of the name, with sufficient contrast for the initials. Use licensed portraits only with a release or an open
licence recorded in the registry. Assistants and bots use their character, not a portrait. Always an `alt` or
`aria-label` with the full name.

## 6. Compression and format
| Use | Size | Notes |
|---|---|---|
| Hero / card / wide | **16:10, 1200 px** wide | crop for the subject, not the centre |
| Square thumbnail, avatar | **1:1, 400-640 px** | |
| Format | **JPEG quality ≈ 72, progressive** | strip EXIF and GPS |
| Weight | **< 160 KB** each | resize before raising the quality |
Check `size_kb` in the registry; make your image step fail above the budget. Use `loading="lazy"` and explicit
`width`/`height` (or `aspect-ratio`) to avoid layout shift; add a dominant-colour background while loading.

## 7. How the build embeds them
For an offline single-file page: the build reads the registry, converts each file to a `data:image/jpeg;base64` URI,
and writes two objects (`IMAGES`, `CREDITS`) into the page script. For a site: copy the files to `dist/images/` and
reference them by hash. In both cases the credit comes from the same registry entry, so a photo can't appear without
its credit. Count the extra weight against the page's size limit.

## 8. Credits table in Notes
Add a **Credits and licences** table to the `notes` section: *Element · Source · Licence*, one row per photo (author
and link in the Source column), plus fonts, icons, maps and illustrations. Under each photo in the UI, a small caption:
"Photo: <author> / <source> · <licence>" with links, `translate="no"` on names.

## Questions to ask
Does the person own photos (and are they cleared) · where the real places are · which pictures are promises (rooms,
food, boats) and need authentic images · people on photos · preferred sources · should AI-generated art be allowed
at all · who updates the registry later.
