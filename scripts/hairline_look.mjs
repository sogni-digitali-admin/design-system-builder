// Visual check of one custom Hairline figure page (hairline-<name>.html, written by vendor/hairline-create/build.mjs),
// using the bundled playwright-core and the installed Edge/Chrome. A stand-in for hairline-create's look.mjs
// when that one cannot install its own browser.
//   node hairline_look.mjs <hairline-name.html> <sheet.png> [query ...]
// Each query is one picture: "" (rest), "at=200,150" (pointer there), "theme=dark&at=200,150", "w=240" (small).
// Prints per picture: the read-out, the drawing's box against the 400 × 320 viewBox (in/OUT), and still/moving.
import { resolve } from "node:path";
import { launch, fileUrl } from "./_browser.mjs";

const [pageFile, out, ...queries] = process.argv.slice(2);
if (!pageFile || !out) { console.log("usage: node hairline_look.mjs <hairline-name.html> <sheet.png> [query ...]"); process.exit(2); }
const browser = await launch();
const url = fileUrl(resolve(pageFile));
const shots = [];
let bad = 0;
for (const q of queries.length ? queries : ["", "at=120,150", "at=280,170", "theme=dark&at=200,150"]) {
  const p = await browser.newPage({ viewport: { width: 900, height: 780 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(url + (q ? "?" + q : ""));
  await p.waitForTimeout(1500);
  const snap = () => p.evaluate(() => document.querySelector("[data-hairline] svg").innerHTML);
  let still = false;
  for (let k = 0; k < 20 && !still; k++) { const a = await snap(); await p.waitForTimeout(250); still = a === (await snap()); }
  const info = await p.evaluate(() => {
    const svg = document.querySelector("[data-hairline] svg"), b = svg.getBBox(), read = document.getElementById("read");
    return { box: [b.x, b.y, b.x + b.width, b.y + b.height].map(Math.round), read: read ? read.textContent : "?" };
  });
  const inFrame = info.box[0] >= 0 && info.box[1] >= 0 && info.box[2] <= 400 && info.box[3] <= 320;
  bad += !inFrame || errors.length;
  console.log((q || "(rest)").padEnd(30), "read:", JSON.stringify(info.read).padEnd(16), "box:", info.box.join(","), inFrame ? "in" : "OUT", still ? "still" : "moving", errors.length ? "ERRORS " + errors.join(" | ") : "");
  const el = await p.$("[data-hairline], #stage");
  shots.push({ q, img: (await el.screenshot()).toString("base64") });
  await p.close();
}
const sheet = await browser.newPage({ viewport: { width: 1400, height: 400 } });
await sheet.setContent("<body style='margin:0;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;background:#999;font:12px sans-serif'>" +
  shots.map((s) => `<figure style='margin:0;background:#fff'><figcaption style='padding:3px'>${s.q || "(rest)"}</figcaption><img style='width:100%' src='data:image/png;base64,${s.img}'></figure>`).join("") + "</body>");
await sheet.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out, bad ? "· fix the lines marked OUT or ERRORS" : "· now open the sheet and look");
process.exit(bad ? 1 : 0);
