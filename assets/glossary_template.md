# Translation glossary (source → targets)

Context for translators: the design system of **<Product>**, made by **<Company>**. Readers: designers, developers
and the client. The source language is the reference. Translate the meaning the way a native product writer would,
not word by word; keep UI labels about the same length as the source.

## Never translate (keep exactly)
Product and company names, character names, people and company names in demo data, edition names,
code identifiers, file names, CSS/JS/HTML names, template variables ({{first_name}}, {% … %}), hex colours, units,
keyboard keys, emojis. A string that is only a name, code or number comes back unchanged.

## Terms
| source | lang 2 | lang 3 |
|---|---|---|
| (one row per product term: lead, quote, booking, order, cart, page, block, draft, publish…) | | |

## Style
- Register, decided with the client at discovery, one line per language with an example sentence
  (e.g. fr "vous" · it "Lei" · de "Sie" · en neutral "you"); interface, e-mails and AI assistant named separately
  if they differ. Exceptions: slogans and taglines keep the brand's own wording; legal text follows the lawyer.
- Punctuation: French puts a space before : ; ? ! — other languages do not. Quotes per language («…», "…", „…“).
- Numbers and money: written in the source format in the page; the runtime re-formats amounts per language,
  so never translate a figure by hand. Dates in words follow the target language (jeudi 9 octobre → Thursday 9 October).
- Fragments: a string can be part of a sentence split by a tag (a bold word, a link). Translate it so it reads
  naturally in its place, keeping its role (a trailing preposition stays a trailing preposition).
