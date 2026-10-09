"""Create a design system project folder with a working starter (builds and passes QA before any brand work).

    python new_project.py <dir> --name "Acme" [--slug acme] [--type crm] [--langs fr,en] [--source fr]

Creates ds.config.json (placeholder neutral palette, the core sections in order), parts/ (the starter sections,
written in English: rewrite their visible text in the source language), i18n/glossary.md, icons/,
hairline/figures/, notes/. Never overwrites an existing project.
"""
from __future__ import annotations

import argparse
import datetime
import json
import re
import shutil
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
STARTER = SKILL / "assets" / "starter"

CORE = [  # id, title (English: translate into the source language), part, icon, motion
    ("overview", "Overview", "overview", "sparkles", "twinkle"),
    ("theme", "Theme", "theme", "palette", "tilt"),
    ("colors", "Colors", "colors", "swatch-book", "pop"),
    ("typography", "Typography", "typography", "type", "draw"),
    ("foundations", "Foundations", "foundations", "layout-grid", "pop"),
    ("icons", "Icons", "icons", "shapes", "pop"),
    ("splash", "Splash", "splash", "rocket", "fly"),
    ("illustrations", "Illustrations", "illustrations", "wand-sparkles", "wiggle"),
    ("components", "Components", "components", "component", "pop"),
    ("integration", "Integration", "integration", "plug", "nudge-u"),
    ("notes", "Notes", "notes", "notebook-pen", "tilt"),
]
STARTER_ICONS = ["sparkles", "palette", "swatch-book", "type", "layout-grid", "shapes", "wand-sparkles", "component",
                 "plug", "notebook-pen", "download", "copy", "check", "x", "info", "triangle-alert", "circle-check",
                 "circle-x", "search", "plus", "arrow-right", "play", "rocket", "rotate-ccw"]

PLACEHOLDER = {
    "primitives": [
        {"name": "brand-950", "hex": "#0F0E24", "source": "placeholder", "note": "night background"},
        {"name": "brand-900", "hex": "#1E1B4B", "source": "placeholder", "note": "darkest"},
        {"name": "brand-700", "hex": "#4338CA", "source": "placeholder", "note": "primary"},
        {"name": "brand-500", "hex": "#6366F1", "source": "placeholder", "note": "bright"},
        {"name": "brand-300", "hex": "#A5B4FC", "source": "placeholder", "note": "soft"},
        {"name": "brand-100", "hex": "#E0E7FF", "source": "placeholder", "note": "lightest"},
        {"name": "brand-50", "hex": "#EEF2FF", "source": "placeholder", "note": "light surface"},
        {"name": "white", "hex": "#FFFFFF", "source": "placeholder", "note": "page white"},
    ],
    "themes": {
        "light": {"bg": "white", "surface": "brand-50", "text": "brand-900", "text-muted": "#4B4F72", "primary": "brand-700",
                  "on-primary": "white", "primary-hover": "brand-900", "accent": "brand-500", "border": "brand-100",
                  "focus": "brand-500", "success": "#166534", "warning": "#92400E", "danger": "#BE123C", "info": "#1D4ED8"},
        "dark": {"bg": "brand-950", "surface": "#1B1A3A", "text": "brand-100", "text-muted": "#A3A8CC", "primary": "brand-300",
                 "on-primary": "brand-950", "primary-hover": "#C7D2FE", "accent": "#818CF8", "border": "#2E2C5C",
                 "focus": "brand-300", "success": "#4ADE80", "warning": "#FBBF24", "danger": "#FB7185", "info": "#93C5FD"},
    },
    "chart": {"light": ["#4338CA", "#0F9D8F", "#C8700F", "#0E7490", "#6E9A1F", "#D6457A"],
              "dark": ["#8B93F8", "#24A594", "#CE7E20", "#38B2D0", "#7DA43A", "#E2648F"]},
    "fonts": {"heading": '"Inter", "Segoe UI", system-ui, sans-serif', "body": '"Inter", "Segoe UI", system-ui, sans-serif', "faces": []},
}


def config(name: str, slug: str, kind: str, langs: list[str], source: str) -> dict:
    return {
        "name": name, "slug": slug, "product_type": kind, "version": "0.1",
        "date": datetime.date.today().isoformat(), "source_lang": source, "langs": langs,
        "summary": "", "default_theme": "both", "logo": {"light": "", "dark": "", "mark": ""},
        **PLACEHOLDER,
        "hairline": {"enabled": True},
        "sections": [{"id": i, "title": t, "part": p, "icon": ic, "motion": m} for i, t, p, ic, m in CORE],
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("dir")
    ap.add_argument("--name", required=True)
    ap.add_argument("--slug")
    ap.add_argument("--type", default="other", help="crm, saas, website, ecommerce, booking, mobile-app, other")
    ap.add_argument("--langs", default="en")
    ap.add_argument("--source")
    a = ap.parse_args()
    project = Path(a.dir).resolve()
    if (project / "ds.config.json").exists():
        sys.exit("%s already holds a project; nothing written" % project)
    langs = [x.strip().lower() for x in a.langs.split(",") if x.strip()]
    source = (a.source or langs[0]).lower()
    slug = a.slug or re.sub(r"[^a-z0-9]+", "-", a.name.lower()).strip("-")
    for sub in ("parts", "icons", "i18n", "hairline/figures", "notes", "assets"):
        (project / sub).mkdir(parents=True, exist_ok=True)
    for f in STARTER.glob("*.*"):
        shutil.copy2(f, project / "parts" / f.name)
    shutil.copy2(SKILL / "assets" / "glossary_template.md", project / "i18n" / "glossary.md")
    cfg = config(a.name, slug, a.type, langs if source in langs else [source] + langs, source)
    (project / "ds.config.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("created %s" % project)
    print("next:\n  python %s/scripts/fetch_icons.py get \"%s\" lucide %s"
          "\n  python %s/scripts/build.py \"%s\"\n  node %s/scripts/qa.mjs \"%s\""
          % (SKILL, project, " ".join(STARTER_ICONS), SKILL, project, SKILL, project))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
