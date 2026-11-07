"""Assemble a design system page (design.html) and its machine file (design.md) from a project folder.

Usage:
    python build.py <project_dir>                  full build: dist/design.html, dist/design.md, logos, fonts, icons
    python build.py <project_dir> --out NAME.html  preview: writes dist/NAME.html only (safe for parallel agents)

The project folder (create it with new_project.py) holds:
    ds.config.json        brand, languages, tokens, the ordered list of sections (optional "group" per section:
                          collapsible blocks in the side navigation), optional eager_sections (scripts started at load)
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
    unknown = [e for e in cfg.get("eager_sections", []) if e not in ids]
    if unknown:
        sys.exit("ds.config.json: eager_sections names sections that do not exist: %s" % ", ".join(unknown))
    missing = [t for t in TK.BASES if t not in cfg["themes"]]
    if missing:
        sys.exit("ds.config.json: themes must include light and dark (more themes may follow); missing %s" % ", ".join(missing))
    for theme in TK.theme_ids(cfg):
        TK.base_of(cfg, theme)
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


def nav_groups(secs: list[tuple]) -> list[tuple[str | None, list[tuple]]]:
    """Consecutive sections sharing the optional "group" key form one block of the side navigation."""
    out: list[tuple[str | None, list[tuple]]] = []
    for n, s, *_ in secs:
        g = s.get("group") or None
        if not out or out[-1][0] != g:
            out.append((g, []))
        out[-1][1].append((n, s))
    return out


def side_filter(cfg: dict) -> str:
    """The filter field above a grouped side navigation; its labels are repainted per language by runtime/doc.js."""
    return ('<div class="side-filter" role="search" data-i18n-skip><label class="side-vh" for="side-q">%s</label>'
            '<input id="side-q" class="side-q" type="search" autocomplete="off" spellcheck="false" placeholder="%s" aria-controls="side-nav">'
            '<p class="side-none" hidden>%s</p></div>'
            % (html.escape(ui(cfg, "filter_label")), html.escape(ui(cfg, "filter")), html.escape(ui(cfg, "no_match"))))


def navs(project: Path, cfg: dict, secs: list[tuple]) -> tuple[str, str, str]:
    """Top navigation, side navigation and the side filter. Sections without "group" render as a flat list, exactly
    as before, and the filter is empty; grouped sections become <details> blocks (the first one open), the top bar
    links to each group's first section, and the filter field narrows the links."""
    def link(n: int, s: dict) -> str:
        ic = icon_svg(project, s["icon"], s.get("motion", "pop")) if s.get("icon") else ""
        return ('<a class="oi" href="#%s"><span class="side-n">%02d</span>%s<span>%s</span></a>'
                % (s["id"], n, ic, html.escape(s["title"])))
    groups = nav_groups(secs)
    side, top = [], []
    for gi, (g, items) in enumerate(groups):
        if not g:
            side.extend(link(n, s) for n, s in items)
            top.extend('<a href="#%s">%s</a>' % (s["id"], html.escape(s["title"])) for _n, s in items)
            continue
        gid = "side-g%d" % (gi + 1)
        side.append('<details class="side-g" id="%s"%s><summary class="side-gh"><span class="side-gt">%s</span>'
                    '<span class="side-gc">%d</span></summary><div class="side-gl">%s</div></details>'
                    % (gid, " open" if gi == 0 else "", html.escape(g), len(items), "".join(link(n, s) for n, s in items)))
        top.append('<a href="#%s" data-group="%s">%s</a>' % (items[0][1]["id"], gid, html.escape(g)))
    grouped = any(g for g, _ in groups)
    return "".join(top), "".join(side), side_filter(cfg) if grouped else ""


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
    if Path(src).suffix.lower() != ".svg":  # a raster logo is shown as an image; it can never feed the splash
        return '<img class="brand-logo logo-%s" src="%s" alt="" data-i18n-skip>' % (key, html.escape(Path(src).name, quote=True))
    svg = re.sub(r"<\?xml.*?\?>|<!--.*?-->", "", read(project / src), flags=re.S).strip()
    return svg.replace("<svg", '<svg class="brand-logo logo-%s" aria-hidden="true" focusable="false"' % key, 1)


SPLASH_KEYS = ("splash-light", "splash-dark", "loader-light", "loader-dark")


def splash_state(cfg: dict) -> str:
    """"ok" (an SVG mark), "placeholder" (no mark set: scaffold only) or "skipped" (the mark is not an SVG)."""
    mark = cfg.get("logo", {}).get("mark")
    if not mark:
        return "placeholder"
    return "ok" if Path(mark).suffix.lower() == ".svg" else "skipped"


def splash_svgs(project: Path, cfg: dict) -> dict[str, str]:
    """The generated splash and loader images; nothing at all (never a stand-in) when logo.mark is not an SVG."""
    return {} if splash_state(cfg) == "skipped" else SP.all_svgs(project, cfg)


def theme_labels(cfg: dict) -> dict:
    """Picker labels per theme and language, from theme_names or the UI strings."""
    return {"auto": {l: TK.ui_text(l, "auto") for l in cfg["langs"]},
            "themes": {t: {l: TK.theme_label(cfg, t, l) for l in cfg["langs"]} for t in TK.theme_ids(cfg)}}


def theme_control(cfg: dict) -> str:
    """The theme toggle (light and dark only) or, with more themes, a segmented picker: Auto + each theme."""
    if len(TK.theme_ids(cfg)) <= 2:
        return read(ASSETS / "theme-toggle.html").rstrip("\n").replace("{{UI_TOGGLE}}", ui(cfg, "toggle")).replace("{{UI_LIGHT}}", ui(cfg, "light"))
    src = cfg["source_lang"]
    items = [("auto", ui(cfg, "auto"))] + [(t, TK.theme_label(cfg, t, src)) for t in TK.theme_ids(cfg)]
    buttons = "".join('<button type="button" data-theme-set="%s" aria-pressed="false">%s</button>' % (k, html.escape(v)) for k, v in items)
    return '<div class="theme-sw" id="theme-picker" role="group" aria-label="%s" data-i18n-skip>%s</div>' % (html.escape(ui(cfg, "theme")), buttons)


def runtime_js(cfg: dict, project: Path) -> str:
    conf = {"slug": cfg["slug"], "source": cfg["source_lang"], "langs": cfg["langs"], "themes": TK.theme_ids(cfg),
            "labels": {"light": ui(cfg, "light"), "dark": ui(cfg, "dark"), "copied": ui(cfg, "copied"), **theme_labels(cfg),
                       "phone": TK.phone_labels(cfg), "nav": TK.nav_labels(cfg)},
            "a11yCss": TK.a11y_css(cfg)}
    dict_path = project / "i18n" / "dict.json"
    data = json.loads(read(dict_path)) if dict_path.exists() else {}
    js = "window.DS = %s;\nwindow.DSI18n = %s;\n" % (json.dumps(conf, ensure_ascii=False),
                                                   json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    # phone.js last: it moves the controls the others have wired, and reads one section at a time below 760 px
    for name in ("doc.js", "hairline-mount.js", "a11y.js", "i18n.js", "phone.js"):
        js += "\n" + read(ASSETS / "runtime" / name)
    return script_safe(js)


EAGER_FIRST = 2  # the first sections (hero and its neighbour) always start at load: they are on screen anyway
PAGE_WIDE = re.compile(r"customElements\.define\(|createElement\(\s*[\"']ds-a11y[\"']")  # what a deferred part should not add


def parts_js(cfg: dict, secs: list[tuple]) -> str:
    """One <script> per section (an exception stays in its section). A section's script starts when the section comes
    near the screen, when an anchor opens it or when the phone runtime shows it (runtime/defer.js), except the first
    EAGER_FIRST sections and those listed in ds.config.json → eager_sections (other sections call them at start)."""
    eager = set(cfg.get("eager_sections", [])) | {s["id"] for _n, s, *_ in secs[:EAGER_FIRST]}
    out = [read(ASSETS / "runtime" / "defer.js")]
    for _n, s, _html, _css, js, _md in secs:
        if not js.strip():
            continue
        if s["id"] not in eager and PAGE_WIDE.search(js):
            print("  warning: parts/%s.js adds something page-wide (a custom element, <ds-a11y>) but starts only when its "
                  "section comes near; list \"%s\" in eager_sections if the page needs it at load" % (s.get("part", s["id"]), s["id"]), file=sys.stderr)
        out.append(js if s["id"] in eager else "dsDefer(%s, function () {\n%s\n});" % (json.dumps(s["id"]), js))
    return "</script>\n<script>".join(script_safe(x) for x in out)


def head_js(cfg: dict) -> str:
    return script_safe(read(ASSETS / "runtime" / "head.js").replace("__SLUG__", cfg["slug"])
                       .replace("__SOURCE__", cfg["source_lang"]).replace("__LANGS__", json.dumps(cfg["langs"]))
                       .replace("__THEMES__", json.dumps(TK.theme_ids(cfg))))


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
def _bridge(cfg: dict) -> str:
    css = TK.bridge_css(cfg)
    return "\n/* extra themes: logo swap and Hairline highlight, as base.css does for light and dark */\n" + css + "\n" if css else ""


def extra_theme_markers(cfg: dict) -> dict[str, str]:
    """{{SLOTS_<ID>}} and {{CONTRAST_<ID>}} for the themes beyond light and dark (ids with digits: use THEME_CARDS)."""
    return {k: v for k, v in TK.theme_marker_values(cfg).items() if MARKER.fullmatch("{{%s}}" % k)}


def page_markers(cfg: dict, project: Path, secs: list[tuple], md: str) -> dict[str, str]:
    top, side, flt = navs(project, cfg, secs)
    css = TK.tokens_css(cfg)
    return {
        "LANG": cfg["source_lang"], "NAME": html.escape(cfg["name"]), "VERSION": html.escape(str(cfg.get("version", "1.0"))),
        "DATE": html.escape(cfg.get("date", "")), "DESCRIPTION": html.escape(cfg.get("summary", "")),
        "HEAD_JS": head_js(cfg), "FONT_FACES": font_faces(cfg), "TOKENS_CSS": css,
        "BASE_CSS": read(ASSETS / "base.css") + _bridge(cfg), "ICON_MOTION_CSS": read(ASSETS / "icon-motion.css"),
        "PARTS_CSS": "\n".join(s[3] for s in secs), "PARTS_JS": parts_js(cfg, secs),
        "LOGO_LIGHT": logo(project, cfg, "light"), "LOGO_DARK": logo(project, cfg, "dark"),
        "TOPNAV": top, "SIDENAV": side, "SIDE_FILTER": flt, "LANG_SWITCH": lang_switch(cfg),
        "UI_CONTENTS": ui(cfg, "contents"), "UI_TOGGLE": ui(cfg, "toggle"), "UI_LIGHT": ui(cfg, "light"),
        "UI_DOWNLOAD": ui(cfg, "download"), "UI_TOP": ui(cfg, "top"), "THEME_CONTROL": theme_control(cfg),
        "THEME_COUNT": str(len(TK.theme_ids(cfg))), "THEME_CARDS": TK.theme_cards(cfg), "CONTRAST_TABLES": TK.contrast_tables(cfg),
        "HAIRLINE": hairline_scripts(project, cfg), "RUNTIME_JS": runtime_js(cfg, project),
        "TOKENS_PRE": html.escape(css), "DESIGN_MD_PRE": html.escape(md),
        "SWATCHES": TK.swatches(cfg), "SLOTS_LIGHT": TK.slots(cfg, "light"), "SLOTS_DARK": TK.slots(cfg, "dark"),
        "CONTRAST_LIGHT": TK.contrast_rows(cfg, "light"), "CONTRAST_DARK": TK.contrast_rows(cfg, "dark"),
        "CHART_SWATCHES": TK.chart_swatches(cfg), "ICON_GRID": icon_grid(project), **extra_theme_markers(cfg),
        **{k.upper().replace("-", "_") + "_URI": SP.data_uri(v) if v else "" for k, v in
           {**dict.fromkeys(SPLASH_KEYS, ""), **splash_svgs(project, cfg)}.items()},
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
    svgs = splash_svgs(project, cfg)
    if svgs:
        (dist / "splash").mkdir(exist_ok=True)
    for name, svg in svgs.items():
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
    state = splash_state(cfg)
    if state == "skipped":
        print("splash skipped: logo.mark is not an SVG (provide the logo as SVG to get the splash and the loader)")
    elif state == "placeholder":
        print("splash: scaffold placeholder (no logo.mark set): set an SVG mark, or remove the splash section")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
