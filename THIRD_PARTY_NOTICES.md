# Third-party software bundled in vendor/

| Folder | Project | Version | Licence | Source |
|---|---|---|---|---|
| `vendor/hairline/` | @lucasmarkes/hairline — isometric line figures | 0.5.0 (pinned) | MIT — `vendor/hairline/LICENSE` | https://github.com/lucasmarkes/hairline · https://www.npmjs.com/package/@lucasmarkes/hairline |
| `vendor/hairline-create/` | hairline-create — the authoring skill and engine (kernel) of Hairline figures, from the same repository | matches 0.5.0 (kernel sha256 in `kernel.js` header) | MIT — same licence as the repository, see `vendor/hairline/LICENSE` | https://github.com/lucasmarkes/hairline (`npx skills add lucasmarkes/hairline`) |
| `vendor/playwright-core/` | Playwright core (browser automation, no browsers included) | 1.64.0 | Apache-2.0 — `vendor/playwright-core/LICENSE`, `NOTICE` | https://github.com/microsoft/playwright |

Icons are **not** bundled: `scripts/fetch_icons.py` downloads the icons a project uses from the set its team chose
(through the public Iconify API) and records set, original name and licence in the project's `icons/SOURCES.md`.

Copyright of the Hairline figures and engine: © 2026 Lucas Marques. Playwright: © Microsoft Corporation.

## Changes made to the bundled copies
- `vendor/hairline-create/SKILL.md` is renamed `GUIDE.md`, and the three `SKILL.md` files under
  `vendor/playwright-core/lib/tools/skills/` are renamed `SKILL.upstream.md`: Claude Code would otherwise load them
  as separate skills. Their content is unchanged.
- A copy of the repository LICENSE is added to `vendor/hairline-create/`. Nothing else is modified.
