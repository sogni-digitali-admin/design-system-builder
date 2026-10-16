// Quality checks on a built design system page.
//   node qa.mjs <project_dir> [all|console|requests|mobile|a11y|i18n|shots] [--file NAME.html] [--section ID] [--lang all|xx] [--out DIR]
// all = console + requests + mobile + a11y + i18n (exit code 1 on any FAIL). shots writes PNGs you must then open and look at.
import { readFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { launch, openPage, scrollThrough, fileUrl } from "./_browser.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const project = resolve(args[0] || ".");
const cmd = args[1] && !args[1].startsWith("--") ? args[1] : "all";
const cfg = JSON.parse(readFileSync(join(project, "ds.config.json"), "utf8"));
const file = join(project, "dist", opt("--file", "design.html"));
const base = { slug: cfg.slug, lang: cfg.source_lang };
const THEMES = Object.keys(cfg.themes); // light, dark and any extra theme: each is opened and checked
let failed = false;
const fail = (msg) => { failed = true; console.log("  FAIL " + msg); };

// A theme with no CSS falls back to light without an error: its colours must differ from every other theme's.
async function themeSignature(page) {
  return page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return { attr: document.documentElement.getAttribute("data-theme"), sig: ["bg", "surface", "text", "primary"].map((k) => cs.getPropertyValue("--color-" + k).trim()).join("|") };
  });
}

async function checkConsole(b) {
  console.log("\n# console and page errors (every theme, every language)");
  const seen = {};
  for (const theme of THEMES) {
    const { page, errors } = await openPage(b, file, { ...base, theme });
    const { attr, sig } = await themeSignature(page);
    if (attr !== theme) fail(`${theme}: the page opened with data-theme="${attr}"`);
    if (seen[sig]) {
      const msg = `${theme}: same colours as ${seen[sig]}`;
      if (/^TODO/.test(cfg.themes[theme].note || "")) console.log(`  WARN ${msg} (still the scaffold copy: design it)`);
      else fail(`${msg} (no CSS for this theme?)`);
    }
    seen[sig] = theme;
    await scrollThrough(page);
    await page.click("#theme-toggle, #theme-picker button:last-child").catch(() => {});
    for (const l of cfg.langs) await page.evaluate((x) => window.DSLang && window.DSLang.set(x), l);
    await page.waitForTimeout(500);
    errors.forEach((e) => fail(`${theme}: ${e.slice(0, 240)}`));
    if (!errors.length) console.log(`  ok ${theme}: no error`);
    await page.close();
  }
}

async function checkRequests(b) {
  console.log("\n# failed requests");
  const page = await b.newPage();
  const bad = new Set();
  page.on("response", (r) => { if (r.status() >= 400) bad.add(r.status() + " " + r.url()); });
  page.on("requestfailed", (r) => bad.add("FAILED " + r.url() + " " + (r.failure() || {}).errorText));
  await page.goto(fileUrl(file), { waitUntil: "load" });
  await scrollThrough(page);
  await page.waitForTimeout(800);
  [...bad].forEach((x) => fail(x));
  if (!bad.size) console.log("  ok no failed request");
  await page.close();
}

async function checkMobile(b) {
  console.log("\n# phone width 390 px: no sideways page scroll");
  for (const theme of THEMES) {
    const { page } = await openPage(b, file, { ...base, theme, width: 390, height: 844 });
    await scrollThrough(page);
    const r = await page.evaluate(() => {
      const W = document.documentElement.clientWidth, bad = [];
      const clipped = (e) => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { if (getComputedStyle(p).overflowX !== "visible") return true; } return false; };
      document.querySelectorAll("main *").forEach((e) => {
        const b = e.getBoundingClientRect();
        if (b.width > 0 && b.right > W + 1 && !clipped(e)) bad.push(`${e.tagName.toLowerCase()}${e.id ? "#" + e.id : ""}.${String(e.className).split(" ")[0]} in #${e.closest("section")?.id}`);
      });
      return { scrollW: document.documentElement.scrollWidth, W, bad: [...new Set(bad)].slice(0, 10) };
    });
    if (r.scrollW > r.W) fail(`${theme}: page is ${r.scrollW}px wide for ${r.W}px · ${r.bad.join(", ")}`);
    else console.log(`  ok ${theme}: ${r.scrollW}px`);
    await page.close();
  }
}

const visibleTexts = (page) => page.evaluate(() => {
  const out = {}, w = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const el = n.parentElement;
    if (el.closest("script,style,code,pre,textarea,svg,[data-i18n-skip]") || !el.getClientRects().length) continue;
    const t = n.nodeValue.replace(/\s+/g, " ").trim();
    if (!/[A-Za-zÀ-ÿ]{3}/.test(t)) continue;
    const id = el.closest("section")?.id || "-";
    (out[id] = out[id] || []).push(t);
  }
  return out;
});

async function checkI18n(b) {
  console.log("\n# languages: text left in the source language (names and codes are fine; sentences are not)");
  const src = await openPage(b, file, base);
  await scrollThrough(src.page);
  const ref = await visibleTexts(src.page);
  await src.page.close();
  for (const lang of cfg.langs.filter((l) => l !== cfg.source_lang)) {
    const { page, errors } = await openPage(b, file, { ...base, lang });
    await scrollThrough(page);
    const ms = await page.evaluate((l) => { const t = performance.now(); window.DSLang.set(window.DS.source); window.DSLang.set(l); return Math.round(performance.now() - t); }, lang);
    const now = await visibleTexts(page);
    let total = 0;
    for (const id of Object.keys(now)) {
      const same = [...new Set(now[id].filter((t) => (ref[id] || []).includes(t) && /\s\S+\s/.test(t)))];
      total += same.length;
      if (same.length) console.log(`  ${lang} #${id}: ${same.length} untranslated · ${JSON.stringify(same.slice(0, 12))}`);
    }
    const colon = await page.evaluate(() => [...document.querySelectorAll("main *")].flatMap((e) => [...e.childNodes]).filter((n) => n.nodeType === 3 && /\S [:;?!](\s|$)/.test(n.nodeValue) && !n.parentElement.closest("code,pre,[data-i18n-skip]")).slice(0, 5).map((n) => n.nodeValue.trim().slice(0, 60)));
    if (lang !== "fr" && colon.length) console.log(`  WARN ${lang}: space before punctuation · ${JSON.stringify(colon)}`);
    errors.forEach((e) => fail(`${lang}: ${e}`));
    console.log(`  ${total ? "WARN" : "ok"} ${lang}: ${total} untranslated multi-word texts · switch ${ms} ms`);
    await page.close();
  }
}

async function checkA11y(b) {
  console.log("\n# accessibility panel: 200 % text at 390 px (every theme), Alt+A opens, Esc closes and returns focus");
  for (const theme of THEMES) {
    const { page, errors } = await openPage(b, file, { ...base, theme, width: 390, height: 844 });
    const has = await page.evaluate(() => !!(window.DSA11y && window.DSA11y.element));
    if (!has) { console.log("  skip: no <ds-a11y> on the page"); await page.close(); return; }
    await page.evaluate(() => { const el = window.DSA11y.element; el.prefs = Object.assign({}, el.prefs, { text: 200 }); });
    await scrollThrough(page);
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const W = document.documentElement.clientWidth, bad = [];
      const clipped = (e) => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { if (getComputedStyle(p).overflowX !== "visible") return true; } return false; };
      document.querySelectorAll("main *").forEach((e) => {
        const box = e.getBoundingClientRect();
        if (box.width > 0 && box.right > W + 1 && !clipped(e)) bad.push(`${e.tagName.toLowerCase()}.${String(e.className).split(" ")[0]} in #${e.closest("section")?.id}:${Math.round(box.right)}`);
      });
      return { sw: document.documentElement.scrollWidth, W, bad: [...new Set(bad)].slice(0, 8) };
    });
    if (r.sw > r.W) fail(`${theme} 200 %: page is ${r.sw}px wide for ${r.W}px · ${r.bad.join(", ")}`);
    else console.log(`  ok ${theme} 200 %: ${r.sw}px`);
    await page.keyboard.press("Alt+KeyA");
    await page.waitForTimeout(400);
    const open = await page.evaluate(() => window.DSA11y.element.isOpen === true);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    const closed = await page.evaluate(() => window.DSA11y.element.isOpen === false);
    if (!open || !closed) fail(`${theme}: Alt+A / Esc did not open and close the panel`);
    errors.forEach((e) => fail(`${theme}: ${e}`));
    await page.close();
  }
}

async function shots(b) {
  const out = resolve(opt("--out", join(project, "dist", "shots")));
  mkdirSync(out, { recursive: true });
  const ids = opt("--section") ? [opt("--section")] : cfg.sections.map((s) => s.id);
  const langs = opt("--lang") === "all" ? cfg.langs : [opt("--lang", cfg.source_lang)];
  for (const [w, h] of [[1360, 1000], [390, 844]]) for (const theme of THEMES) for (const lang of langs) {
    const { page } = await openPage(b, file, { ...base, theme, lang, width: w, height: h });
    for (const id of ids) {
      const el = await page.$("#" + id);
      if (!el) { fail("no section #" + id); continue; }
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(out, `${id}-${w}-${theme}-${lang}.png`) });
    }
    await page.close();
  }
  console.log(`\n# screenshots in ${out}: open them and look (the checks cannot see layout or taste)`);
}

const b = await launch();
try {
  if (cmd === "all" || cmd === "console") await checkConsole(b);
  if (cmd === "all" || cmd === "requests") await checkRequests(b);
  if (cmd === "all" || cmd === "mobile") await checkMobile(b);
  if (cmd === "all" || cmd === "a11y") await checkA11y(b);
  if ((cmd === "all" || cmd === "i18n") && cfg.langs.length > 1) await checkI18n(b);
  if (cmd === "shots") await shots(b);
} finally {
  await b.close();
}
console.log(failed ? "\nFAILED" : "\nPASSED");
process.exit(failed ? 1 : 0);
