# <Product> design system · brief for section agents (read fully before working)

## 1. The product (facts only — do not invent others)
- What it is, for whom, made by whom. Editions/plans and what each includes. Languages (source first).
- The vocabulary: the product's own words for its objects (lead, quote, booking, order…).
- The screens that matter and the rules behind them (limits, approvals, what AI may do).
- Demo data to reuse everywhere (people, companies, amounts, dates) so sections agree with each other.

## 2. Where things are
- Project: `<project_dir>` — `ds.config.json` (read only), `parts/` (yours: see §5), `icons/`, `hairline/figures/`.
- Skill: `<skill_dir>` — read `SKILL.md` (section contract) and the reference named in your task.
- Preview build only: `python <skill_dir>/scripts/build.py <project_dir> --out _preview-<you>.html`.
- Look at your work: `node <skill_dir>/scripts/qa.mjs <project_dir> shots --file _preview-<you>.html --section <id>`,
  then open the PNGs (light, dark, desktop, 390 px). Fix what looks wrong.

## 3. Language contract
Visible text in **<source language>**; JS strings through `dsT({…})` with every language; re-render on `ds:lang`;
names and client content `data-i18n-skip`; amounts written in the source format.

## 4. Quality bar
Real microcopy and demo data, every state (empty, loading, error, success, disabled, focus), light and dark,
no overflow at 390 px, keyboard and focus visible, `prefers-reduced-motion`, contrast AA, status = icon + word.
Functions < 50 lines, files < 800 lines, no network or CDN, no secrets.
Your script starts only when your section comes near the screen or is opened (and below 760 px when the reader
opens it): never measure at start, measure when needed and on `resize`; expose nothing another section needs at start
without telling the integrator (`eager_sections`).

## 5. Ownership
| Agent | Section id | Files you own | Class prefix |
|---|---|---|---|
| | | `parts/<part>.html/.css/.js/.md` | `xx-` |

## 6. At the end
Write `notes/<you>.md`: what you made, files, design.md lines (also in your `.md` part), wiring needed, guessed
values, known limits. Delete your preview file. Final message ≤ 150 words.
