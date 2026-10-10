"""Assemble a design system page (design.html) and its machine file (design.md) from a project folder.

Usage:
    python build.py <project_dir>                  full build: dist/design.html, dist/design.md, logos, fonts, icons
    python build.py <project_dir> --out NAME.html  preview: writes dist/NAME.html only (safe for parallel agents)

The project folder (create it with new_project.py) holds:
    ds.config.json        brand, languages, tokens, the ordered list of sections
    parts/<part>.html     one section each; optional <part>.css, <part>.js, <part>.md (its design.md lines)
    icons/*.svg           icons, written in parts as {{ICON:name}} or {{ICON:name:motion}}
    hairline/figures/*.js custom Hairline figures (optional)
    i18n/dict.json        translations keyed by the source-language text (i18n_merge.py writes it)

Section numbers, the sidebar and the top navigation follow the order in ds.config.json: never number by hand.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import sys
from pathlib import Path

import splash as SP
import tokens as TK

SKILL = Path(__file__).resolve().parent.parent
ASSETS = SKILL / "assets"
VENDOR = SKILL / "vendor"
SVG_CHILD = re.compile(r"<(path|line|circle|rect|polyline|polygon|ellipse)\b(?![^>]*pathLength)")
MARKER = re.compile(r"\{\{([A-Z_]+)(?::[A-Za-z0-9_:-]*)?\}\}")


# --------------------------------------------------------------------------- helpers
def read(path: Path) -> str:
    return Path(path).read_text(encoding="utf-8")


def script_safe(text: str) -> str:
    """Text placed inside <script>: a literal </script would end the element early."""
    return text.replace("</script", r"<\/script")


def ui(cfg: dict, key: str) -> str:
    return TK.ui_text(cfg["source_lang"], key)


def load_config(project: Path) -> dict:
    cfg = json.loads(read(project / "ds.config.json"))
    for key in ("name", "slug", "source_lang", "langs", "themes", "sections"):
        if key not in cfg:
            sys.exit("ds.config.json: missing '%s'" % key)
    if cfg["source_lang"] not in cfg["langs"]:
        sys.exit("ds.config.json: source_lang must be one of langs")
    ids = [s["id"] for s in cfg["sections"]]
    if len(ids) != len(set(ids)):
        sys.exit("ds.config.json: two sections share an id")
    cfg["_project"] = str(project)
    return cfg


# --------------------------------------------------------------------------- icons
def icon_svg(project: Path, name: str, motion: str | None = None, cls: str = "ic") -> str:
    path = project / "icons" / (name + ".svg")
    if not path.exists():
        print("  warning: missing icon icons/%s.svg (fetch it with fetch_icons.py)" % name, file=sys.stderr)
        return '<svg class="%s" viewBox="0 0 24 24" aria-hidden="true"></svg>' % cls
    svg = re.sub(r"<\?xml.*?\?>|<!--.*?-->", "", read(path), flags=re.S).strip()
    head_end = svg.index(">")
    head = re.sub(r'\s(width|height|class)="[^"]*"', "", svg[:head_end])
    attrs = ' class="%s" aria-hidden="true" focusable="false"' % cls
    if motion:
        attrs += ' data-oi="%s"' % motion
    body = SVG_CHILD.sub(lambda m: m.group(0) + ' pathLength="1"', svg[head_end:]) if motion else svg[head_end:]
    return head.replace("<svg", "<svg" + attrs, 1) + body


def resolve_icons(text: str, project: Path) -> str:
    pattern = r"\{\{ICON:([A-Za-z0-9_-]+)(?::([a-z-]+))?\}\}"
    return re.sub(pattern, lambda m: icon_svg(project, m.group(1), m.group(2)), text)


def icon_grid(project: Path) -> str:
    names = sorted(p.stem for p in (project / "icons").glob("*.svg"))
    return "\n".join('<li class="oi"><span class="ic-box">%s</span><code>%s</code></li>'
                     % (icon_svg(project, n, "pop"), html.escape(n)) for n in names)


# --------------------------------------------------------------------------- sections
def sections(cfg: dict, project: Path) -> list[tuple]:
    """[(number, section, html, css, js, md)] in config order; a missing part stops the build."""
    out = []
    for i, sec in enumerate(cfg["sections"], 1):
        part = project / "parts" / sec.get("part", sec["id"])
        page = part.with_suffix(".html")
        if not page.exists():
            sys.exit("missing part %s (section '%s')" % (page, sec["id"]))
        text = read(page).replace("{{SEC_N}}", "%02d" % i)
        if 'id="%s"' % sec["id"] not in text:
            sys.exit('parts/%s must contain <section id="%s">' % (page.name, sec["id"]))
        extra = [read(part.with_suffix(s)) if part.with_suffix(s).exists() else "" for s in (".css", ".js", ".md")]
        out.append((i, sec, text, *extra))
    return out


def navs(project: Path, secs: list[tuple]) -> tuple[str, str]:
    top = "".join('<a href="#%s">%s</a>' % (s["id"], html.escape(s["title"])) for _n, s, *_ in secs)
    side = []
    for n, s, *_ in secs:
        ic = icon_svg(project, s["icon"], s.get("motion", "pop")) if s.get("icon") else ""
        side.append('<a class="oi" href="#%s"><span class="side-n">%02d</span>%s<span>%s</span></a>'
                    % (s["id"], n, ic, html.escape(s["title"])))
    return top, "".join(side)


def lang_switch(cfg: dict) -> str:
    if len(cfg["langs"]) < 2:
        return ""
    buttons = "".join('<button type="button" data-lang-set="%s" aria-pressed="false">%s</button>'
                      % (lang, lang.upper()) for lang in cfg["langs"])
    return '<div class="lang-sw" role="group" aria-label="%s" data-i18n-skip>%s</div>' % (ui(cfg, "language"), buttons)


# --------------------------------------------------------------------------- hairline
def hairline_package() -> str:
    """The pinned @lucasmarkes/hairline ESM build, ending by setting window.Hairline instead of exporting."""
    pkg = re.sub(r"//# sourceMappingURL=.*$", "", read(VENDOR / "hairline" / "dist" / "index.js"), flags=re.M)
    m = re.search(r"export\s*\{([^}]*)\};?\s*$", pkg)
    if not m:
        sys.exit("vendor/hairline: unexpected build (no export block)")
    names = []
    for item in filter(None, (i.strip() for i in m.group(1).split(","))):
        local, _, public = item.partition(" as ")
        names.append("%s: %s" % ((public or local).strip(), local.strip()))
    return pkg[:m.start()] + "window.Hairline = { %s };\nwindow.dispatchEvent(new Event('hairline-ready'));" % ", ".join(names)


def hairline_scripts(project: Path, cfg: dict) -> str:
    if not cfg.get("hairline", {}).get("enabled", True):
        return ""
    folder = project / "hairline" / "figures"
    figs = sorted(folder.glob("*.js")) if folder.exists() else []
    # each figure in its own scope: their top-level consts would collide otherwise
    wrapped = "\n".join("/* figure: %s */\n(() => {\n%s\n})();" % (f.stem, read(f)) for f in figs)
    return ("<script>%s</script>\n"
            "<script>window.hairline = function (f) { (window.__hlFigs = window.__hlFigs || {})[f.name] = f; };</script>\n"
            "<script>%s</script>\n<script type=\"module\">%s</script>"
            % (script_safe(read(VENDOR / "hairline-create" / "kernel.js")), script_safe(wrapped), script_safe(hairline_package())))


# --------------------------------------------------------------------------- page pieces
def font_faces(cfg: dict) -> str:
    return "\n".join(
        '@font-face { font-family: "%s"; font-style: %s; font-weight: %s; font-display: swap; src: url(fonts/%s) format("woff2"); }'
        % (f["family"], f.get("style", "normal"), f.get("weight", "400"), Path(f["src"]).name)
        for f in cfg.get("fonts", {}).get("faces", []))


def logo(project: Path, cfg: dict, key: str) -> str:
    src = cfg.get("logo", {}).get(key)
    if not src or not (project / src).exists():
        return '<span class="brand-name logo-%s" data-i18n-skip>%s</span>' % (key, html.escape(cfg["name"]))
    svg = re.sub(r"<\?xml.*?\?>|<!--.*?-->", "", read(project / src), flags=re.S).strip()
    return svg.replace("<svg", '<svg class="brand-logo logo-%s" aria-hidden="true" focusable="false"' % key, 1)


def runtime_js(cfg: dict, project: Path) -> str:
    conf = {"slug": cfg["slug"], "source": cfg["source_lang"], "langs": cfg["langs"],
            "labels": {"light": ui(cfg, "light"), "dark": ui(cfg, "dark"), "copied": ui(cfg, "copied")},
            "a11yCss": TK.a11y_css(cfg)}
    dict_path = project / "i18n" / "dict.json"
    data = json.loads(read(dict_path)) if dict_path.exists() else {}
    js = "window.DS = %s;\nwindow.DSI18n = %s;\n" % (json.dumps(conf, ensure_ascii=False),
                                                   json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    for name in ("doc.js", "hairline-mount.js", "a11y.js", "i18n.js"):
        js += "\n" + read(ASSETS / "runtime" / name)
    return script_safe(js)


def head_js(cfg: dict) -> str:
    return script_safe(read(ASSETS / "runtime" / "head.js").replace("__SLUG__", cfg["slug"])
                       .replace("__SOURCE__", cfg["source_lang"]).replace("__LANGS__", json.dumps(cfg["langs"])))


# --------------------------------------------------------------------------- design.md
def design_md(cfg: dict, secs: list[tuple]) -> str:
    front = ["---", "name: %s" % cfg["name"], "product_type: %s" % cfg.get("product_type", "other"),
             "languages: [%s]" % ", ".join(cfg["langs"]), "source_language: %s" % cfg["source_lang"],
             "theme: %s" % cfg.get("default_theme", "both"), "version: %s" % cfg.get("version", "1.0"),
             "updated: %s" % cfg.get("date", ""), "---", "", "# %s — design.md" % cfg["name"], ""]
    if cfg.get("summary"):
        front += [cfg["summary"], ""]
    body = [TK.design_md_tokens(cfg)]
    body += [md.strip() + "\n" for *_rest, md in secs if md.strip()]
    return "\n".join(front) + "\n".join(body)


# --------------------------------------------------------------------------- assembly
def page_markers(cfg: dict, project: Path, secs: list[tuple], md: str) -> dict[str, str]:
    top, side = navs(project, secs)
    css = TK.tokens_css(cfg)
    return {
        "LANG": cfg["source_lang"], "NAME": html.escape(cfg["name"]), "VERSION": html.escape(str(cfg.get("version", "1.0"))),
        "DATE": html.escape(cfg.get("date", "")), "DESCRIPTION": html.escape(cfg.get("summary", "")),
        "HEAD_JS": head_js(cfg), "FONT_FACES": font_faces(cfg), "TOKENS_CSS": css,
        "BASE_CSS": read(ASSETS / "base.css"), "ICON_MOTION_CSS": read(ASSETS / "icon-motion.css"),
        "PARTS_CSS": "\n".join(s[3] for s in secs), "PARTS_JS": script_safe("\n;\n".join(s[4] for s in secs if s[4].strip())),
        "LOGO_LIGHT": logo(project, cfg, "light"), "LOGO_DARK": logo(project, cfg, "dark"),
        "TOPNAV": top, "SIDENAV": side, "LANG_SWITCH": lang_switch(cfg),
        "UI_CONTENTS": ui(cfg, "contents"), "UI_TOGGLE": ui(cfg, "toggle"), "UI_LIGHT": ui(cfg, "light"),
        "UI_DOWNLOAD": ui(cfg, "download"), "UI_TOP": ui(cfg, "top"),
        "HAIRLINE": hairline_scripts(project, cfg), "RUNTIME_JS": runtime_js(cfg, project),
        "TOKENS_PRE": html.escape(css), "DESIGN_MD_PRE": html.escape(md),
        "SWATCHES": TK.swatches(cfg), "SLOTS_LIGHT": TK.slots(cfg, "light"), "SLOTS_DARK": TK.slots(cfg, "dark"),
        "CONTRAST_LIGHT": TK.contrast_rows(cfg, "light"), "CONTRAST_DARK": TK.contrast_rows(cfg, "dark"),
        "CHART_SWATCHES": TK.chart_swatches(cfg), "ICON_GRID": icon_grid(project),
        **{k.upper().replace("-", "_") + "_URI": SP.data_uri(v) for k, v in SP.all_svgs(project, cfg).items()},
    }


def assemble(cfg: dict, project: Path) -> tuple[str, str]:
    secs = sections(cfg, project)
    md = design_md(cfg, secs)
    page = read(ASSETS / "template.html").replace("{{SECTIONS}}", "\n".join(s[2] for s in secs))
    markers = page_markers(cfg, project, secs, md)
    unknown = sorted({m for m in MARKER.findall(page) if m not in markers and m != "ICON"})
    if unknown:
        sys.exit("unknown markers: %s" % ", ".join(unknown))
    page = resolve_icons(page, project)
    # one pass, so a value containing "{{…}}" (an email variable, a code sample) is never read as a marker
    page = MARKER.sub(lambda m: markers.get(m.group(1), m.group(0)), page)
    return page, md


def copy_assets(cfg: dict, project: Path, dist: Path) -> None:
    for src in filter(None, cfg.get("logo", {}).values()):
        if (project / src).exists():
            shutil.copy2(project / src, dist / Path(src).name)
    for face in cfg.get("fonts", {}).get("faces", []):
        (dist / "fonts").mkdir(exist_ok=True)
        shutil.copy2(project / face["src"], dist / "fonts" / Path(face["src"]).name)
    if (project / "icons").exists():
        shutil.copytree(project / "icons", dist / "icons", dirs_exist_ok=True)
    # Atkinson Hyperlegible (OFL) for the accessibility panel's "readable font"
    shutil.copytree(ASSETS / "fonts", dist / "fonts", dirs_exist_ok=True)
    (dist / "splash").mkdir(exist_ok=True)
    for name, svg in SP.all_svgs(project, cfg).items():
        (dist / "splash" / (name + ".svg")).write_text(svg, encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("project")
    ap.add_argument("--out", help="preview file name in dist/ (writes nothing else)")
    args = ap.parse_args()
    project = Path(args.project).resolve()
    cfg = load_config(project)
    page, md = assemble(cfg, project)
    dist = project / "dist"
    dist.mkdir(exist_ok=True)
    out = dist / (args.out or "design.html")
    out.write_text(page, encoding="utf-8")
    if not args.out:
        (dist / "design.md").write_text(md, encoding="utf-8")
        copy_assets(cfg, project, dist)
    print("wrote %s (%d KB, %d sections)" % (out, len(page) // 1024, len(cfg["sections"])))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
