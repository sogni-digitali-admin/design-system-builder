"""Measure what an image really contains, so proposals quote sampled hex values instead of guesses.

    python image_facts.py <image> [<image> ...] [--k 8] [--json]

Per image: format, size, transparency, whether it is vector (SVG) or raster, the dominant colours (hex, share,
light/dark), the colours of a logo (transparent and near-white pixels left out) and a suggested background / ink
pair with its contrast. PNG, JPG, WebP, GIF and SVG. Raster pixels are read with Pillow when it is installed, else
through the headless Edge/Chrome of the skill (scripts/_pixels.mjs); SVG colours are read from the file's text.
--json prints a list of objects that can be pasted into proposals (inputs[].colours).

Colours are the exact pixel values of the most frequent shade of each cluster, from a nearest-neighbour sample of
at most 160 px a side: anti-aliased edges and JPEG noise are averaged away, flat brand colours stay exact.
A raster logo is NOT vector: the animated splash and loader need an SVG logo, and the tool says so ("vector": false).
"""
from __future__ import annotations

import base64
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import tokens as TK  # noqa: E402

RASTER = {".png": "PNG", ".jpg": "JPEG", ".jpeg": "JPEG", ".webp": "WEBP", ".gif": "GIF"}
SAMPLE_SIDE = 160
NEAR_WHITE = 235       # a pixel whose three channels are all >= this is "paper", not logo
MIN_SHARE = 0.005      # clusters under 0.5 % of the pixels are noise
SVG_COLOUR = re.compile(r"(?:fill|stroke|stop-color|flood-color|color)\s*[:=]\s*[\"']?\s*(#[0-9a-fA-F]{3,8})\b")


# --------------------------------------------------------------------------- reading pixels
def pixels_pillow(path: Path, side: int) -> dict | None:
    try:
        from PIL import Image
    except ImportError:
        return None
    with Image.open(path) as im:
        width, height = im.size
        k = min(1.0, side / max(width, height))
        small = im.convert("RGBA").resize((max(1, round(width * k)), max(1, round(height * k))), Image.NEAREST)
        return {"width": width, "height": height, "px": list(small.getdata())}


def run_node(args: list[str]) -> dict:
    node = Path(__file__).with_name("_pixels.mjs")
    try:
        done = subprocess.run(["node", str(node), *args], capture_output=True, text=True, timeout=120, encoding="utf-8")
    except (OSError, subprocess.TimeoutExpired) as e:
        sys.exit("Cannot read the image: Pillow is not installed (pip install pillow) and the headless browser failed (%s)." % e)
    if done.returncode:
        sys.exit("Cannot read the image: Pillow is not installed (pip install pillow) and the headless browser failed:\n%s"
                 % (done.stderr.strip().splitlines() or ["?"])[0])
    return json.loads(done.stdout)


def pixels_browser(path: Path, side: int) -> dict:
    data = run_node([str(path), "--max", str(side)])
    raw = base64.b64decode(data["rgba"])
    px = [tuple(raw[i:i + 4]) for i in range(0, len(raw), 4)]
    return {"width": data["width"], "height": data["height"], "px": px}


def read_raster(path: Path) -> dict:
    return pixels_pillow(path, SAMPLE_SIDE) or pixels_browser(path, SAMPLE_SIDE)


def thumbnail(path: Path, side: int = 320) -> str:
    """A data: URI of the image, at most `side` px a side (SVG: the file itself)."""
    if path.suffix.lower() == ".svg":
        return "data:image/svg+xml;base64," + base64.b64encode(path.read_bytes()).decode("ascii")
    return run_node([str(path), "--thumb", str(side)])["uri"]


# --------------------------------------------------------------------------- colours
def hex_of(c: tuple) -> str:
    return "#%02X%02X%02X" % tuple(c[:3])


def dist2(a: tuple, b: tuple) -> int:
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2


def cluster(counts: dict, k: int) -> list[tuple[tuple, float]]:
    """Weighted k-means on the distinct colours; each cluster is named by its most frequent exact colour."""
    total = sum(counts.values())
    items = sorted(counts.items(), key=lambda kv: -kv[1])
    seeds = [items[0][0]]
    solid = [c for c, n in items if n / total >= MIN_SHARE] or [items[0][0]]
    while len(seeds) < min(k, len(solid)):
        seeds.append(max(solid, key=lambda c: min(dist2(c, s) for s in seeds)))
    groups: list[list] = []
    for _ in range(12):
        groups = [[] for _ in seeds]
        for c, n in items:
            groups[min(range(len(seeds)), key=lambda i: dist2(c, seeds[i]))].append((c, n))
        moved = [tuple(sum(c[j] * n for c, n in g) / sum(n for _, n in g) for j in range(3)) if g else seeds[i]
                 for i, g in enumerate(groups)]
        if moved == seeds:
            break
        seeds = moved
    out = [(max(g, key=lambda cn: cn[1])[0], sum(n for _, n in g) / total) for g in groups if g]
    return sorted((o for o in out if o[1] >= MIN_SHARE), key=lambda o: -o[1])


def describe(clusters: list[tuple[tuple, float]]) -> list[dict]:
    return [{"hex": hex_of(c), "share": round(s * 100, 1), "tone": "light" if TK.luminance(hex_of(c)) > 0.4 else "dark"}
            for c, s in clusters]


def suggest_pair(colours: list[dict]) -> dict | None:
    if len(colours) < 2:
        return None
    bg = colours[0]["hex"]
    ink = max((c["hex"] for c in colours[1:]), key=lambda h: TK.contrast(h, bg))
    ratio = TK.contrast(ink, bg)
    return {"bg": bg, "ink": ink, "contrast": round(ratio, 2), "passes_aa": ratio >= 4.5}


def raster_facts(path: Path, k: int) -> dict:
    data = read_raster(path)
    px = data["px"]
    opaque = [p for p in px if p[3] >= 128]
    counts: dict = {}
    logo_counts: dict = {}
    for p in opaque:
        counts[p[:3]] = counts.get(p[:3], 0) + 1
        if min(p[:3]) < NEAR_WHITE:
            logo_counts[p[:3]] = logo_counts.get(p[:3], 0) + 1
    colours = describe(cluster(counts, k)) if counts else []
    return {"format": RASTER[path.suffix.lower()], "width": data["width"], "height": data["height"],
            "vector": False, "has_alpha": len(opaque) < len(px), "transparent_share": round(100 * (1 - len(opaque) / len(px)), 1),
            "colours": colours, "logo_colours": describe(cluster(logo_counts, k)) if logo_counts else [],
            "suggested": suggest_pair(colours)}


def svg_facts(path: Path, k: int) -> dict:
    text = path.read_text(encoding="utf-8", errors="replace")
    found: dict = {}
    for raw in SVG_COLOUR.findall(text):
        h = raw[1:]
        h = "".join(c * 2 for c in h) if len(h) in (3, 4) else h[:6]
        found[h.upper()] = found.get(h.upper(), 0) + 1
    total = sum(found.values()) or 1
    ranked = sorted(found.items(), key=lambda kv: -kv[1])[:k]
    colours = [{"hex": "#" + h, "share": round(100 * n / total, 1), "tone": "light" if TK.luminance("#" + h) > 0.4 else "dark"}
               for h, n in ranked]
    box = re.search(r'viewBox="[\d.\-]+[ ,]+[\d.\-]+[ ,]+([\d.]+)[ ,]+([\d.]+)"', text)
    width, height = (round(float(box.group(1))), round(float(box.group(2)))) if box else (None, None)
    return {"format": "SVG", "width": width, "height": height, "vector": True, "has_alpha": None, "transparent_share": None,
            "share_basis": "colour declarations in the file (fill, stroke, stop-color)",
            "colours": colours, "logo_colours": [c for c in colours if min(TK.rgb(c["hex"])) < NEAR_WHITE],
            "suggested": suggest_pair(colours)}


def facts(path: Path, k: int = 8) -> dict:
    suffix = path.suffix.lower()
    if suffix == ".svg":
        body = svg_facts(path, k)
    elif suffix in RASTER:
        body = raster_facts(path, k)
    else:
        sys.exit("%s: unsupported type (PNG, JPG, WebP, GIF and SVG; for a PDF read the pages with the Read tool)" % path.name)
    return {"file": path.name, **body}


def show(f: dict) -> None:
    dims = "%sx%s" % (f["width"], f["height"]) if f["width"] else "size unknown"
    alpha = "" if f["has_alpha"] is None else ", transparent %s%%" % f["transparent_share"] if f["has_alpha"] else ", opaque"
    print("\n%s  %s %s%s  %s" % (f["file"], f["format"], dims, alpha, "VECTOR" if f["vector"] else "raster (not vector)"))
    for title, key in (("colours", "colours"), ("logo colours (no transparent / near-white)", "logo_colours")):
        print("  %s:" % title)
        for c in f[key]:
            print("    %s  %5.1f%%  %s" % (c["hex"], c["share"], c["tone"]))
    s = f["suggested"]
    if s:
        print("  suggested pair: ink %s on bg %s = %.2f:1 %s" % (s["ink"], s["bg"], s["contrast"], "(AA)" if s["passes_aa"] else "(below AA)"))
    if not f["vector"]:
        print("  note: raster image. If this is the logo, the splash and loader cannot be made (they need an SVG logo).")


def main(argv: list[str]) -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    k = int(argv[argv.index("--k") + 1]) if "--k" in argv else 8
    files = [a for i, a in enumerate(argv) if not a.startswith("--") and (i == 0 or argv[i - 1] != "--k")]
    if not files:
        sys.exit(__doc__)
    out = []
    for name in files:
        path = Path(name)
        if not path.is_file():
            sys.exit("%s: no such file" % name)
        out.append(facts(path, k))
    if "--json" in argv:
        print(json.dumps(out, ensure_ascii=False, indent=2))
    else:
        for f in out:
            show(f)


if __name__ == "__main__":
    main(sys.argv[1:])
