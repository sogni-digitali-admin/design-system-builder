// Collects every visible source-language text of the built page (text nodes + aria-label, title, placeholder, alt),
// skips code and [data-i18n-skip], drops what i18n/dict.json already translates into every language,
// and writes i18n/chunks/chunk_NN.json for translators (one agent per chunk; see references/i18n.md).
//   node i18n_extract.mjs <project_dir> [--file NAME.html] [--size 400]
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { launch, openPage, scrollThrough } from "./_browser.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const project = resolve(args[0] || ".");
const cfg = JSON.parse(readFileSync(join(project, "ds.config.json"), "utf8"));
const size = +opt("--size", 400);
const b = await launch();
const { page } = await openPage(b, join(project, "dist", opt("--file", "design.html")), { slug: cfg.slug, lang: cfg.source_lang });
await scrollThrough(page);
await page.waitForTimeout(800);
const strings = await page.evaluate(() => {
  const SKIP = { SCRIPT: 1, STYLE: 1, CODE: 1, PRE: 1, TEXTAREA: 1, TEMPLATE: 1, NOSCRIPT: 1, svg: 1, SVG: 1 };
  const out = new Set(), norm = (s) => s.replace(/\s+/g, " ").trim();
  const keep = (s) => s && /[A-Za-zÀ-ÿ]{2}/.test(s) && !/^[\w.-]+\.(svg|png|js|css|md|json|html)$/.test(s) && !/^#[0-9a-f]{3,8}$/i.test(s) && !/^--[\w-]+$/.test(s) && s.length < 900;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeType === 1 && (SKIP[n.tagName] || n.hasAttribute("data-i18n-skip")) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (n.nodeType === 3) { const s = norm(n.nodeValue); if (keep(s)) out.add(s); }
    else for (const a of ["aria-label", "title", "placeholder", "alt"]) { const v = n.getAttribute(a); if (v && keep(norm(v))) out.add(norm(v)); }
  }
  return [...out];
});
await b.close();
const dictPath = join(project, "i18n", "dict.json");
const known = existsSync(dictPath) ? JSON.parse(readFileSync(dictPath, "utf8")) : {};
const targets = cfg.langs.filter((l) => l !== cfg.source_lang);
const todo = strings.filter((s) => !targets.every((l) => known[l] && s in known[l])).sort();
const dir = join(project, "i18n", "chunks");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
let n = 0;
for (let i = 0; i < todo.length; i += size) {
  writeFileSync(join(dir, `chunk_${String(++n).padStart(2, "0")}.json`), JSON.stringify(todo.slice(i, i + size), null, 1));
}
console.log(`${strings.length} texts on the page, ${todo.length} to translate into ${targets.join(", ")}, ${n} chunk(s) in i18n/chunks/`);
