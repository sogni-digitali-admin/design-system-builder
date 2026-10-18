"""Render proposals.json as ONE self-contained, interactive HTML page (the plan page).

    python plan_page.py <proposals.json> [--out plan/plan.html] [--embed-inputs [--inputs-dir DIR]]

Validates the file against assets/plan/proposals.schema.json first (no dependency). The page has inline CSS and JS, no CDN,
works offline and inside a claude.ai Artifact, follows the system light/dark setting and is readable at 390 px. The person
picks, edits and comments; "Export my answers" gives ds.plan.json (download, clipboard, or a read-only text box that is always
there). Give that file to apply_plan.py. --embed-inputs adds <= 320 px thumbnails of the files the person gave (needs Pillow or
Edge/Chrome; an SVG is embedded as is). A raster logo with no SVG locks the splash topic (the splash needs an SVG logo).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import plan_schema as PS  # noqa: E402
import plan_strings as STR  # noqa: E402

PLAN = Path(__file__).resolve().parent.parent / "assets" / "plan"
JS_PARTS = ("page_core.js", "page_render.js", "page_main.js")
MAX_BYTES = 2 * 1024 * 1024
MAX_SVG_PREVIEW = 150 * 1024


def splash_lock(data: dict) -> str | None:
    """The format of the logo when every logo given is raster (no SVG anywhere), else None."""
    logos = [i for i in data.get("inputs", []) if i["kind"] == "logo"]
    if not logos or any(i.get("vector") is True or i["file"].lower().endswith(".svg") for i in logos):
        return None
    pick = logos[0]
    return (pick.get("format") or Path(pick["file"]).suffix.lstrip(".") or "raster").upper()


def find_file(name: str, roots: list[Path]) -> Path | None:
    for root in roots:
        candidate = (root / name)
        if candidate.is_file():
            return candidate
    return None


def embed_previews(data: dict, roots: list[Path]) -> dict:
    """A copy of the data with a thumbnail on each input whose file can be found (never modifies the file on disk)."""
    import image_facts as IF
    out = json.loads(json.dumps(data))
    for item in out.get("inputs", []):
        path = find_file(item["file"], roots)
        if not path:
            print("  no preview: %s not found (looked in %s)" % (item["file"], ", ".join(str(r) for r in roots)), file=sys.stderr)
            continue
        if path.suffix.lower() == ".svg" and path.stat().st_size > MAX_SVG_PREVIEW:
            print("  no preview: %s is a large SVG" % path.name, file=sys.stderr)
            continue
        try:
            item["preview"] = IF.thumbnail(path, 320)
        except (OSError, SystemExit, ValueError) as e:
            print("  no preview for %s: %s" % (path.name, e), file=sys.stderr)
    return out


def script_json(obj: dict) -> str:
    """JSON safe to place inside <script type=application/json>."""
    text = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    return text.replace("</", "<\\/").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


def render(data: dict, digest: str) -> str:
    lang = data["lang"]
    payload = {"proposals": data, "ui": STR.chrome(lang), "hash": digest, "splashLock": splash_lock(data)}
    css = (PLAN / "page.css").read_text(encoding="utf-8")
    js = "\n".join((PLAN / p).read_text(encoding="utf-8") for p in JS_PARTS)
    ui = payload["ui"]
    return ('<!doctype html>\n<html lang="%s">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            '<meta name="color-scheme" content="light dark">\n<title>%s</title>\n<style>\n%s</style>\n</head>\n<body>\n'
            '<a class="sr" href="#main">%s</a>\n<div id="app" class="shell"></div>\n<noscript>JavaScript is required to choose and export your answers.</noscript>\n'
            '<script type="application/json" id="plan-data">%s</script>\n<script>\n(function () {\n%s\n})();\n</script>\n</body>\n</html>\n'
            % (lang, data["project"]["name"] + " | " + ui["toc"], css, ui["jump"], script_json(payload), js))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("proposals")
    ap.add_argument("--out")
    ap.add_argument("--embed-inputs", action="store_true")
    ap.add_argument("--inputs-dir", action="append", default=[])
    a = ap.parse_args()
    src = Path(a.proposals).resolve()
    data = json.loads(src.read_text(encoding="utf-8"))
    errors = PS.validate(data)
    if errors:
        sys.exit("%s is not valid:\n  %s" % (src.name, "\n  ".join(errors[:25])))
    digest = PS.proposals_hash(data)
    shown = embed_previews(data, [Path(d) for d in a.inputs_dir] + [src.parent, src.parent.parent, Path.cwd()]) if a.embed_inputs else data
    out = Path(a.out) if a.out else src.with_name("plan.html")
    out.parent.mkdir(parents=True, exist_ok=True)
    page = render(shown, digest)
    out.write_text(page, encoding="utf-8")
    size = len(page.encode("utf-8"))
    print("wrote %s (%d KB, %d topics, %s)" % (out, size // 1024, len(data["topics"]), digest))
    if splash_lock(data):
        print("splash locked: the logo is only provided as %s (an SVG logo is needed for the splash)" % splash_lock(data))
    if size > MAX_BYTES:
        print("warning: the page is over 2 MB: embed fewer or smaller previews", file=sys.stderr)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
