# Icons

## Choosing the set
Use ONE open-source set for the whole product: mixing stroke widths and corner styles looks broken. Choose with
the person, from the brand's character and the product's needs. See the live numbers and licences with
`python scripts/fetch_icons.py sets` (counts below were read on the Iconify API in October 2026).

| Set (prefix) | Icons | Licence | Style | Good for |
|---|---|---|---|---|
| Lucide (`lucide`) | ~1 870 | ISC | 2 px stroke, round caps, 24 grid | the safe default; huge ecosystem (React, Vue, Svelte packages) |
| Tabler (`tabler`) | ~6 200 | MIT | 2 px stroke, round, 24 grid | wide coverage for business apps; outline + filled |
| Phosphor (`ph`) | ~9 000 | MIT | 6 weights (thin → fill, duotone) | brands that want a softer or bolder line; weight as a design token |
| Hugeicons (`hugeicons`) | ~6 000 free | MIT (free set) | 1.5 px stroke, rounded, friendly | modern SaaS look; many business metaphors |
| Iconoir (`iconoir`) | ~1 670 | MIT | 1.5 px stroke, geometric | minimal, editorial brands |
| Heroicons (`heroicons`) | ~1 290 | MIT | outline 24 / solid 20 / mini 16 | Tailwind projects |
| Remix (`ri`) | ~3 200 | Apache-2.0 | line + fill pairs | apps that need filled "active" states |
| MingCute (`mingcute`) | ~3 300 | Apache-2.0 | rounded, line + fill | playful consumer apps |
| Material Symbols (`material-symbols`) | ~15 700 | Apache-2.0 | variable (weight, fill, grade) | Android-like products; widest coverage |
| Fluent UI (`fluent`) | ~19 900 | MIT | Microsoft style, sizes 16–48 | Microsoft-adjacent products |
| Carbon (`carbon`) | ~2 600 | Apache-2.0 | IBM, 16/32 grid | technical, data-dense tools |
| Bootstrap (`bi`) | ~2 080 | MIT | 16 grid | Bootstrap codebases |
| Radix (`radix-icons`) | ~330 | MIT | 15 grid, crisp | small UIs with Radix |
| Solar (`solar`) | ~8 700 | CC BY 4.0 | several styles, rich | attribution required — note it |

Decide with three questions: does the codebase already use one (keep it)? Does the line weight match the
typeface (a light font wants 1.5 px, a bold one 2 px)? Does it cover the product's nouns (search
`fetch_icons.py search <set> "<noun>"` for the ten most specific: invoice, warehouse, signature, pipeline…)?
Licences: MIT, ISC and Apache-2.0 need the licence text kept with the files; CC BY needs visible credit.

## Getting the icons
```bash
python scripts/fetch_icons.py search lucide "receipt invoice"
python scripts/fetch_icons.py get <project_dir> lucide receipt=invoice warehouse mail-open=mail
```
`name=alias` saves under the product's own word, so parts say `{{ICON:invoice}}` and the set can change later
without touching the parts. Only the icons you use are downloaded; `icons/SOURCES.md` records set, original name
and licence. Without network, download the SVGs from the set's site into `icons/` and fill SOURCES.md by hand.

## Using them
- Sizes: 16 dense tables · 20 buttons, menus, inputs · 24 standalone · 28–32 empty states next to a title.
- Colour: `currentColor` (inherits the text); status icons take their status colour and come with a word.
- Icon-only buttons need an `aria-label`; decorative icons are `aria-hidden` (the build does it).
- Motion: `{{ICON:name:motion}}` + class `oi` on the control. Pick the motion from the meaning: `draw` (create,
  edit), `pop` (add, open), `spin`/`turn` (refresh, settings), `ring` (notifications), `mail`/`fly` (send),
  `shake` (error, delete), `nudge-*` (arrows, import/export), `stamp` (approve, sign), `beat` (favourites, AI).
  Set `.is-playing` from code to play it on an event (new message). Only `loader` loops.
- Integration: give developers a mapping table (product word → set icon name → motion) in the Integration section,
  and the package to install for their framework (`lucide-vue-next`, `@tabler/icons-react`, …).
