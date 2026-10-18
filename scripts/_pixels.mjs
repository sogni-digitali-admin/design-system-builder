// Decodes a raster image in the headless browser (no Pillow needed) for image_facts.py and plan_page.py.
//   node _pixels.mjs <file> [--max 160]      -> JSON {width, height, sample_width, sample_height, rgba: base64}   (nearest-neighbour sample)
//   node _pixels.mjs <file> --thumb 320      -> JSON {width, height, uri: "data:image/...;base64,..."}           (downscaled copy)
import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { launch } from "./_browser.mjs";

const args = process.argv.slice(2);
const file = args[0];
const opt = (k) => (args.includes(k) ? Number(args[args.indexOf(k) + 1]) : 0);
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };
if (!file || !MIME[extname(file).toLowerCase()]) {
  console.error("usage: node _pixels.mjs <png|jpg|webp|gif> [--max N | --thumb N]");
  process.exit(2);
}
const b64 = readFileSync(file).toString("base64");
const browser = await launch();
try {
  const page = await browser.newPage();
  const out = await page.evaluate(async ({ b64, mime, max, thumb }) => {
    const img = new Image();
    img.src = `data:${mime};base64,${b64}`;
    await img.decode();
    const w = img.naturalWidth, h = img.naturalHeight;
    const side = thumb || max || 160;
    const k = Math.min(1, side / Math.max(w, h));
    const sw = Math.max(1, Math.round(w * k)), sh = Math.max(1, Math.round(h * k));
    const c = document.createElement("canvas");
    c.width = sw; c.height = sh;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = !!thumb;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, sw, sh);
    if (thumb) {
      const alpha = ctx.getImageData(0, 0, sw, sh).data.some((v, i) => i % 4 === 3 && v < 250);
      return { width: w, height: h, uri: c.toDataURL(alpha ? "image/png" : "image/jpeg", 0.82) };
    }
    const px = ctx.getImageData(0, 0, sw, sh).data;
    let s = "";
    for (let i = 0; i < px.length; i += 0x8000) s += String.fromCharCode.apply(null, px.subarray(i, i + 0x8000));
    return { width: w, height: h, sample_width: sw, sample_height: sh, rgba: btoa(s) };
  }, { b64, mime: MIME[extname(file).toLowerCase()], max: opt("--max"), thumb: opt("--thumb") });
  console.log(JSON.stringify(out));
} finally {
  await browser.close();
}
