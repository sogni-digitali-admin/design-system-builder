# Working with several agents

Split when the work is wide (more than ~4 new sections) — each agent builds one section well, in parallel.
Do not split a single section, and do not split before the foundations (tokens, icons, starter build) are done:
agents copy what they see, so the foundations must already be right.

## Roles
- **You (integrator)** own `ds.config.json`, `i18n/`, `notes/` merging, and every full build. You decide section
  order, wire new sections, merge translations and design.md lines, run QA and look at the result.
- **Section agents** own only their files: `parts/<their-part>.html|css|js|md`, their figures in
  `hairline/figures/<name>.js`, their exports under `dist/<their folder>/`. They never edit another part, the
  template, base.css or the config.

## Before launching
1. Add each new section to `ds.config.json` (id, title, part, icon) and create an empty part containing
   `<section id="<id>"><header class="sec-h"><span class="sec-n">{{SEC_N}}</span><h2>…</h2></header></section>`,
   so every preview build works from the start.
2. Fetch the icons they will likely need (they can fetch more themselves: `fetch_icons.py get` only adds files).
3. Fill `assets/brief_template.md` into `notes/BRIEF.md`: product facts (from discovery — the agents must not
   invent), the section contract, the quality bar, the ownership table with a **class prefix per agent**.
4. Beyond ~15 sections, decide the navigation groups now (`"group"` on each entry of `ds.config.json`, consecutive
   sections per group, labels in the source language) so agents see the final order; keep `eager_sections` empty
   unless an agent tells you another section calls its function at start (`references/sections.md`, "Large systems").
   Both keys are yours: agents never edit the config.

## Launching
One agent per section, all in the same turn, each with: the path of BRIEF.md (read it fully first), its section
id and prefix, the module reference to read (`references/modules/…`), what "done" means for its section, and:
"preview with `python scripts/build.py <project> --out _preview-<you>.html`, never a full build; check your
section with `node scripts/qa.mjs <project> shots --file _preview-<you>.html --section <id>` and look at the
PNGs; at the end write `notes/<you>.md` and delete your preview file. Final message ≤ 150 words."
Rate limits: if agents get HTTP 429, relaunch fewer at a time; ask them to save files early and often.

## notes/<agent>.md (their hand-over)
What they made (sub-parts, interactions), files, design.md lines (already in their `parts/<id>.md`), anything
the integrator must wire (an icon, a shared helper, a config change), translations they could not do, known limits,
values they guessed. You wait for every agent before integrating — an agent's work is not done until you have
merged and checked it.

## Integrating
1. Read every note. 2. Apply wiring requests (config, icons). 3. Full build. 4. `qa.mjs all`, fix or send back.
5. Extract and translate the new strings. 6. Screenshots of each new section, both themes, phone width; look.
7. Merge the guessed values into the Notes section and the open questions of your final reply.
