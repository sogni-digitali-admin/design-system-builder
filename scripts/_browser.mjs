// Shared by the QA scripts: launches a headless browser with the playwright-core bundled in vendor/.
// Tries the installed Edge, then Chrome, then a Playwright-downloaded Chromium (npx playwright-core install chromium).
// Set DS_BROWSER=msedge|chrome|chromium to force one.
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const { chromium } = await import(pathToFileURL(join(here, "..", "vendor", "playwright-core", "index.mjs")).href);

export async function launch() {
  // DS_BROWSER_PATH=/path/to/chrome : a browser already on the machine (CI, containers), whatever its version
  if (process.env.DS_BROWSER_PATH) return chromium.launch({ executablePath: process.env.DS_BROWSER_PATH, headless: true });
  const order = process.env.DS_BROWSER ? [process.env.DS_BROWSER] : ["msedge", "chrome", "chromium"];
  const errors = [];
  for (const channel of order) {
    try {
      return await chromium.launch(channel === "chromium" ? { headless: true } : { channel, headless: true });
    } catch (e) {
      errors.push(`${channel}: ${String(e.message).split("\n")[0]}`);
    }
  }
  throw new Error("No browser found. Install Edge or Chrome, or run: node vendor/playwright-core/cli.js install chromium\n" + errors.join("\n"));
}

export const fileUrl = (p) => pathToFileURL(p).href;

// Opens the page with a given theme and language already chosen, then waits for it to settle.
export async function openPage(browser, file, { slug, theme = "light", lang, width = 1360, height = 1000 } = {}) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.setDefaultTimeout(180000); page.setDefaultNavigationTimeout(180000); // a finished page weighs several MB: give it time
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  await page.addInitScript(([s, t, l]) => {
    try { localStorage.setItem(s + "-theme", t); if (l) localStorage.setItem(s + "-lang", l); } catch (e) { /* storage off */ }
  }, [slug, theme, lang]);
  await page.goto(fileUrl(file), { waitUntil: "load" });
  await page.waitForTimeout(1200);
  return { page, errors };
}

// Scrolls the whole page so lazy content and IntersectionObservers fire.
export async function scrollThrough(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 900) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(30); }
  await page.evaluate(() => window.scrollTo(0, 0));
}

// The ids of the page's sections, in page order.
export const sectionIds = (page) => page.evaluate(() => [...document.querySelectorAll("#main > section[id]")].map((s) => s.id));

// Below 760 px the page shows one section at a time (runtime/phone.js): this opens one, as a link to it would.
// Above, it only scrolls there. Either way the section is displayed and laid out when this returns.
export async function openSection(page, id) {
  await page.evaluate((x) => { location.hash = x; }, id);
  await page.waitForTimeout(150);
  await page.evaluate((x) => { const s = document.getElementById(x); if (s) s.scrollIntoView({ block: "start" }); }, id);
  await page.waitForTimeout(100);
}
