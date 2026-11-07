"""Tokens: CSS custom properties, contrast checks, swatches and the token part of design.md.

Semantic colours in ds.config.json may name a primitive ("brand-700") or give a hex ("#7E27C9").
"""
from __future__ import annotations

import html
import re

REQUIRED = ("bg", "surface", "text", "text-muted", "primary", "on-primary", "primary-hover",
            "accent", "border", "focus", "success", "warning", "danger", "info")
STATUS = ("success", "warning", "danger", "info")
SOFT_MIX = {"light": 0.12, "dark": 0.20}  # share of the status colour in its pale background, by base
BASES = ("light", "dark")
META = ("base", "note")  # keys of a theme block that are not colours

DEFAULTS = {
    "radius": {"sm": "8px", "md": "12px", "lg": "20px", "full": "999px"},
    "space": [4, 8, 12, 16, 24, 32, 48, 64, 96],
    "text": {"label": "0.75rem", "small": "0.875rem", "body": "1rem", "h3": "1.375rem",
             "h2": "1.75rem", "h1": "2.25rem", "display": "3rem"},
    "motion": {"fast": "120ms", "base": "200ms", "slow": "320ms",
               "ease-out": "cubic-bezier(.16, 1, .3, 1)", "ease-in-out": "cubic-bezier(.65, 0, .35, 1)"},
}

# Labels the build itself writes into the page, in the source language. Other text lives in the parts.
UI = {
    "en": {"language": "Language", "light": "Light", "dark": "Dark", "copied": "Copied", "contents": "Contents",
           "toggle": "Switch light / dark", "download": "Download design.md", "top": "top of page",
           "on": "on", "page": "page background", "surface": "card surface", "text": "Text", "muted": "Muted text",
           "primary": "Primary", "button": "Button text on primary", "accent": "Accent", "soft": "on its pale background",
           "aaa": "AAA", "aa": "AA", "large": "Large text / graphics", "deco": "Decorative only", "copy": "Copy", "auto": "Auto", "theme": "Theme", "col_colour": "Colour", "col_on": "On", "col_ratio": "Ratio", "col_use": "Use",
           "menu": "Menu", "close_menu": "Close the menu", "sections": "Sections", "in_section": "In this section",
           "previous": "Previous", "next": "Next", "prev_next": "Previous and next section",
           "filter": "Filter…", "filter_label": "Filter the sections", "no_match": "No section matches."},
    "fr": {"language": "Langue", "light": "Clair", "dark": "Sombre", "copied": "Copié", "contents": "Sommaire",
           "toggle": "Basculer clair / sombre", "download": "Télécharger design.md", "top": "haut de page",
           "on": "sur", "page": "fond de page", "surface": "surface des cartes", "text": "Texte", "muted": "Texte atténué",
           "primary": "Couleur principale", "button": "Texte de bouton sur couleur principale", "accent": "Accent",
           "soft": "sur son fond pâle", "aaa": "AAA", "aa": "AA", "large": "Grand texte / graphisme",
           "deco": "Décoratif seulement", "copy": "Copier", "auto": "Auto", "theme": "Thème", "col_colour": "Couleur", "col_on": "Sur", "col_ratio": "Ratio", "col_use": "Usage",
           "menu": "Menu", "close_menu": "Fermer le menu", "sections": "Sections", "in_section": "Dans cette section",
           "previous": "Précédent", "next": "Suivant", "prev_next": "Section précédente et suivante",
           "filter": "Filtrer…", "filter_label": "Filtrer les sections", "no_match": "Aucune section ne correspond."},
    "it": {"language": "Lingua", "light": "Chiaro", "dark": "Scuro", "copied": "Copiato", "contents": "Indice",
           "toggle": "Passa a chiaro / scuro", "download": "Scarica design.md", "top": "inizio pagina",
           "on": "su", "page": "sfondo pagina", "surface": "superficie delle card", "text": "Testo", "muted": "Testo attenuato",
           "primary": "Colore principale", "button": "Testo del pulsante sul colore principale", "accent": "Accento",
           "soft": "sul suo fondo chiaro", "aaa": "AAA", "aa": "AA", "large": "Testo grande / grafica",
           "deco": "Solo decorativo", "copy": "Copia", "auto": "Auto", "theme": "Tema", "col_colour": "Colore", "col_on": "Su", "col_ratio": "Rapporto", "col_use": "Uso",
           "menu": "Menu", "close_menu": "Chiudi il menu", "sections": "Sezioni", "in_section": "In questa sezione",
           "previous": "Precedente", "next": "Successiva", "prev_next": "Sezione precedente e successiva",
           "filter": "Filtra…", "filter_label": "Filtra le sezioni", "no_match": "Nessuna sezione corrisponde."},
    "es": {"language": "Idioma", "light": "Claro", "dark": "Oscuro", "copied": "Copiado", "contents": "Índice",
           "toggle": "Cambiar claro / oscuro", "download": "Descargar design.md", "top": "inicio de página",
           "on": "sobre", "page": "fondo de página", "surface": "superficie de tarjetas", "text": "Texto", "muted": "Texto atenuado",
           "primary": "Color principal", "button": "Texto de botón sobre color principal", "accent": "Acento",
           "soft": "sobre su fondo claro", "aaa": "AAA", "aa": "AA", "large": "Texto grande / gráficos",
           "deco": "Solo decorativo", "copy": "Copiar", "auto": "Auto", "theme": "Tema", "col_colour": "Color", "col_on": "Sobre", "col_ratio": "Proporción", "col_use": "Uso",
           "menu": "Menú", "close_menu": "Cerrar el menú", "sections": "Secciones", "in_section": "En esta sección",
           "previous": "Anterior", "next": "Siguiente", "prev_next": "Sección anterior y siguiente",
           "filter": "Filtrar…", "filter_label": "Filtrar las secciones", "no_match": "Ninguna sección coincide."},
    "de": {"language": "Sprache", "light": "Hell", "dark": "Dunkel", "copied": "Kopiert", "contents": "Inhalt",
           "toggle": "Hell / dunkel umschalten", "download": "design.md herunterladen", "top": "Seitenanfang",
           "on": "auf", "page": "Seitenhintergrund", "surface": "Kartenfläche", "text": "Text", "muted": "Gedämpfter Text",
           "primary": "Primärfarbe", "button": "Buttontext auf Primärfarbe", "accent": "Akzent",
           "soft": "auf seinem hellen Grund", "aaa": "AAA", "aa": "AA", "large": "Großer Text / Grafik",
           "deco": "Nur dekorativ", "copy": "Kopieren", "auto": "Auto", "theme": "Farbschema", "col_colour": "Farbe", "col_on": "Auf", "col_ratio": "Verhältnis", "col_use": "Verwendung",
           "menu": "Menü", "close_menu": "Menü schließen", "sections": "Abschnitte", "in_section": "In diesem Abschnitt",
           "previous": "Zurück", "next": "Weiter", "prev_next": "Vorheriger und nächster Abschnitt",
           "filter": "Filtern…", "filter_label": "Abschnitte filtern", "no_match": "Kein Abschnitt passt."},
}
PHONE_KEYS = ("menu", "close_menu", "sections", "in_section", "previous", "next", "prev_next")  # runtime/phone.js
NAV_KEYS = ("filter", "filter_label", "no_match")  # the side navigation filter (grouped sections), runtime/doc.js


def ui_text(lang: str, key: str) -> str:
    return UI.get(lang, UI["en"]).get(key, UI["en"][key])


def runtime_labels(keys: tuple, cfg: dict) -> dict:
    """Labels a runtime script paints itself, one string per language: {key: {lang: text}} (read with dsT)."""
    return {k: {l: ui_text(l, k) for l in cfg["langs"]} for k in keys}


def phone_labels(cfg: dict) -> dict:
    return runtime_labels(PHONE_KEYS, cfg)


def nav_labels(cfg: dict) -> dict:
    return runtime_labels(NAV_KEYS, cfg)


# --------------------------------------------------------------------------- colour maths
def rgb(hex_: str) -> tuple[int, int, int]:
    h = hex_.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def to_hex(c: tuple[float, float, float]) -> str:
    return "#%02X%02X%02X" % tuple(max(0, min(255, round(v))) for v in c)


def mix(fg: str, bg: str, share: float) -> str:
    a, b = rgb(fg), rgb(bg)
    return to_hex(tuple(b[i] + (a[i] - b[i]) * share for i in range(3)))


def luminance(hex_: str) -> float:
    def lin(c: int) -> float:
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(c) for c in rgb(hex_))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: str, b: str) -> float:
    hi, lo = sorted((luminance(a), luminance(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def verdict(ratio: float) -> tuple[str, str]:
    if ratio >= 7:
        return "ok", "aaa"
    if ratio >= 4.5:
        return "ok", "aa"
    if ratio >= 3:
        return "warn", "large"
    return "no", "deco"


# --------------------------------------------------------------------------- resolved themes
def primitives(cfg: dict) -> dict[str, str]:
    return {p["name"]: p["hex"] for p in cfg.get("primitives", [])}


def theme_ids(cfg: dict) -> list[str]:
    """light, dark, then every other theme of ds.config.json in the order written."""
    ids = [t for t in BASES if t in cfg["themes"]] + [t for t in cfg["themes"] if t not in BASES]
    bad = [t for t in ids if not re.fullmatch(r"[a-z][a-z0-9-]*", t)]
    if bad:
        raise SystemExit("theme ids are lowercase letters, digits and dashes: %s" % ", ".join(bad))
    return ids


def extra_themes(cfg: dict) -> list[str]:
    return [t for t in theme_ids(cfg) if t not in BASES]


def base_of(cfg: dict, theme: str) -> str:
    """"light" or "dark": what an extra theme is built on (colour-scheme, shadows, soft mixes, a11y variants)."""
    if theme in BASES:
        return theme
    raw = cfg["themes"][theme]
    if raw.get("base") in BASES:
        return raw["base"]
    if raw.get("base"):
        raise SystemExit("themes.%s.base must be \"light\" or \"dark\"" % theme)
    bg = primitives(cfg).get(raw.get("bg", ""), raw.get("bg", "#FFFFFF"))
    return "dark" if luminance(bg) < 0.5 else "light"


def theme_label(cfg: dict, theme: str, lang: str) -> str:
    """Name shown in the picker and the tables: theme_names (a string or one string per language), else the UI string."""
    names = cfg.get("theme_names", {}).get(theme)
    if isinstance(names, dict):
        return names.get(lang) or names.get(cfg["source_lang"]) or theme.capitalize()
    if names:
        return names
    return ui_text(lang, theme) if theme in BASES else theme.replace("-", " ").capitalize()


def resolve(cfg: dict, theme: str) -> dict[str, str]:
    """Semantic colours of one theme as hex, with the pale status backgrounds added."""
    prim = primitives(cfg)
    raw = cfg["themes"][theme]
    missing = [k for k in REQUIRED if k not in raw]
    if missing:
        raise SystemExit("themes.%s is missing %s" % (theme, ", ".join(missing)))
    out = {k: prim.get(v, v) for k, v in raw.items() if k not in META}
    for key in STATUS:
        out.setdefault(key + "-soft", mix(out[key], out["bg"], SOFT_MIX[base_of(cfg, theme)]))
    return out


def ref(cfg: dict, value: str) -> str:
    """A semantic value as var(--primitive) when it names one or equals one."""
    for name, hex_ in primitives(cfg).items():
        if value == name or value.lower() == hex_.lower():
            return "var(--%s)" % name
    return value


# --------------------------------------------------------------------------- CSS
def _theme_css(cfg: dict, theme: str, selector: str) -> list[str]:
    raw, res, base = cfg["themes"][theme], resolve(cfg, theme), base_of(cfg, theme)
    lines = ["%s {" % selector]
    lines += ["  --color-%s: %s;" % (k, ref(cfg, raw.get(k, v))) for k, v in res.items()]
    lines.append("  --gradient-bg: %s;" % cfg.get("gradient", {}).get(theme, "none"))
    lines += ["  --chart-%d: %s;" % (i + 1, c) for i, c in enumerate(cfg.get("chart", {}).get(theme, []))]
    shadow = cfg.get("shadow", {}).get(theme) or (
        "0 1px 2px rgb(0 0 0 / .06), 0 10px 28px rgb(0 0 0 / .08)" if base == "light"
        else "0 1px 2px rgb(0 0 0 / .4), 0 12px 32px rgb(0 0 0 / .45)")
    lines.append("  --shadow-card: %s;" % shadow)
    lines += ["  color-scheme: %s;" % base, "}"]
    return lines


def bridge_css(cfg: dict) -> str:
    """What base.css gives [data-theme=light|dark] (logo and icon swap, Hairline highlight), for the other themes.
    Placed after base.css, whose :root rules would otherwise win on order."""
    out = []
    for theme in extra_themes(cfg):
        dark = base_of(cfg, theme) == "dark"
        out.append('[data-theme="%s"] { --show-light: %s; --show-dark: %s;%s }' % (
            theme, "none" if dark else "block", "block" if dark else "none", " --hairline-hi: var(--color-text);" if dark else ""))
    return "\n".join(out)


def tokens_css(cfg: dict) -> str:
    d = {k: {**v, **cfg.get(k, {})} if isinstance(v, dict) else cfg.get(k, v) for k, v in DEFAULTS.items()}
    fonts = cfg.get("fonts", {})
    out = ["/* 1 · Primitives */", ":root {"]
    out += ["  --%s: %s;%s" % (p["name"], p["hex"], "  /* %s */" % p["note"] if p.get("note") else "") for p in cfg.get("primitives", [])]
    out += ["  --font-heading: %s;" % fonts.get("heading", "system-ui, sans-serif"),
            "  --font-body: %s;" % fonts.get("body", "system-ui, sans-serif"),
            "  --font-mono: %s;" % fonts.get("mono", 'ui-monospace, "Cascadia Code", Consolas, monospace')]
    out += ["  --text-%s: %s;" % kv for kv in d["text"].items()]
    out += ["  --space-%d: %dpx;" % (i + 1, v) for i, v in enumerate(d["space"])]
    out += ["  --radius-%s: %s;" % kv for kv in d["radius"].items()]
    out += ["  --motion-%s: %s;" % kv for kv in d["motion"].items()]
    out += ["}", "", "/* 2 · Semantic (per theme) */"]
    out += _theme_css(cfg, "light", ':root,\n[data-theme="light"]') + [""] + _theme_css(cfg, "dark", '[data-theme="dark"]')
    for theme in extra_themes(cfg):
        out += ["", "/* %s (base %s) */" % (theme, base_of(cfg, theme))] + _theme_css(cfg, theme, '[data-theme="%s"]' % theme)
    out += ["", "/* 3 · Component */", ":root,\n[data-theme] {",
            "  --button-bg: var(--color-primary); --button-bg-hover: var(--color-primary-hover); --button-fg: var(--color-on-primary);",
            "  --card-bg: var(--color-surface); --card-border: var(--color-border); --card-radius: var(--radius-lg);",
            "  --input-border: var(--color-border); --focus-ring: 3px solid var(--color-focus);", "}"]
    return "\n".join(out)


# --------------------------------------------------------------------------- generated HTML
def contrast_rows(cfg: dict, theme: str) -> str:
    t, L = resolve(cfg, theme), lambda k: ui_text(cfg["source_lang"], k)
    pairs = [("%s %s %s" % (L("text"), L("on"), L("page")), t["text"], t["bg"]),
             ("%s %s %s" % (L("text"), L("on"), L("surface")), t["text"], t["surface"]),
             ("%s %s %s" % (L("muted"), L("on"), L("page")), t["text-muted"], t["bg"]),
             ("%s %s %s" % (L("muted"), L("on"), L("surface")), t["text-muted"], t["surface"]),
             ("%s %s %s" % (L("primary"), L("on"), L("page")), t["primary"], t["bg"]),
             (L("button"), t["on-primary"], t["primary"]),
             ("%s %s %s" % (L("accent"), L("on"), L("page")), t["accent"], t["bg"])]
    pairs += [("%s %s" % (k, L("soft")), t[k], t[k + "-soft"]) for k in STATUS]
    rows = []
    for label, fg, bg in pairs:
        r = contrast(fg, bg)
        cls, key = verdict(r)
        rows.append('<tr><td>%s</td><td><span class="dot" style="background:%s"></span><code>%s</code></td>'
                    '<td><span class="dot" style="background:%s"></span><code>%s</code></td>'
                    '<td class="num">%.2f:1</td><td><span class="chip %s">%s</span></td></tr>'
                    % (html.escape(label), fg, fg, bg, bg, r, cls, html.escape(L(key))))
    return "\n".join(rows)


def slots(cfg: dict, theme: str) -> str:
    t, copy = resolve(cfg, theme), ui_text(cfg["source_lang"], "copy")
    out = []
    for key in [k for k in t if not k.endswith("-soft")]:
        r = contrast(t[key], t["bg"])
        cls, v = verdict(r)
        out.append('<li class="slot"><span class="sw" style="background:%(h)s"></span><div class="slot-main"><code>--color-%(k)s</code></div>'
                   '<div class="slot-side"><button class="copy" type="button" data-i18n-skip data-copy="%(h)s" aria-label="%(c)s %(h)s">%(h)s</button>'
                   '<span class="chip %(cls)s">%(r).1f:1</span></div></li>'
                   % {"h": t[key], "k": key, "c": copy, "cls": cls, "r": r})
    return "\n".join(out)


def theme_cards(cfg: dict) -> str:
    """One card per theme, each forcing its own theme, listing its slots."""
    lang = cfg["source_lang"]
    return "\n".join('<div class="card" data-theme="%s">\n  <span class="label">%s</span>\n  <ul class="slots">%s</ul>\n</div>'
                     % (t, html.escape(theme_label(cfg, t, lang)), slots(cfg, t)) for t in theme_ids(cfg))


def contrast_tables(cfg: dict) -> str:
    lang = cfg["source_lang"]
    head = "".join("<th>%s</th>" % html.escape(ui_text(lang, k)) for k in ("col_colour", "col_on", "col_ratio", "col_use"))
    return "\n".join('<div class="tbl"><table><thead><tr><th>%s</th>%s</tr></thead><tbody>%s</tbody></table></div>'
                     % (html.escape(theme_label(cfg, t, lang)), head, contrast_rows(cfg, t)) for t in theme_ids(cfg))


def theme_marker_values(cfg: dict) -> dict[str, str]:
    """SLOTS_<ID> and CONTRAST_<ID> for every theme (light and dark keep their historical markers)."""
    out = {}
    for t in theme_ids(cfg):
        key = t.upper().replace("-", "_")
        out["SLOTS_" + key], out["CONTRAST_" + key] = slots(cfg, t), contrast_rows(cfg, t)
    return out


def swatches(cfg: dict) -> str:
    copy = ui_text(cfg["source_lang"], "copy")
    return "\n".join(
        '<li><button class="copy dot-btn" type="button" data-i18n-skip data-copy="%(h)s" aria-label="%(c)s %(h)s"><span class="big-dot" style="background:%(h)s"></span></button>'
        '<strong>%(n)s</strong><code>%(h)s</code><span class="muted">%(note)s</span></li>'
        % {"h": p["hex"], "n": html.escape(p["name"]), "c": copy, "note": html.escape(p.get("note", ""))}
        for p in cfg.get("primitives", []))


def chart_swatches(cfg: dict) -> str:
    out = []
    for theme in theme_ids(cfg):
        colors = cfg.get("chart", {}).get(theme, [])
        if not colors and theme not in BASES:
            continue
        dots = "".join('<span class="dot" style="background:%s" title="%s"></span>' % (c, c) for c in colors)
        out.append('<div class="chart-row" data-theme="%s"><span class="label">%s</span>%s</div>'
                   % (theme, html.escape(theme_label(cfg, theme, cfg["source_lang"])), dots))
    return "\n".join(out)


# --------------------------------------------------------------------------- design.md
def design_md_tokens(cfg: dict) -> str:
    out = []
    for theme in theme_ids(cfg):
        t = resolve(cfg, theme)
        out.append("## Colors — %s" % theme)
        if theme not in BASES:
            out.append("base: %s" % base_of(cfg, theme))
        out += ["%s: %s" % (k, v) for k, v in t.items() if k not in STATUS and not k.endswith("-soft")]
        if cfg.get("gradient", {}).get(theme):
            out.append("gradient-bg: %s" % cfg["gradient"][theme])
        out += ["", "## Status — %s" % theme]
        out += ["%s: %s\n%s-soft: %s" % (k, t[k], k, t[k + "-soft"]) for k in STATUS]
        out.append("")
    chart = cfg.get("chart", {})
    if chart:
        out += ["## Charts"] + ["categorical-%s: %s" % (t, ", ".join(chart.get(t, []))) for t in theme_ids(cfg) if t in BASES or chart.get(t)]
        out += ["rule: assign in fixed order, never cycle; one y-axis only; status colours never used as series", ""]
    for theme in extra_themes(cfg):
        out += ["## Contrast — %s" % theme] + ["%s: %s" % (k.removeprefix("color-"), v) for k, v in contrast_tokens(cfg, theme).items()] + [""]
    fonts = cfg.get("fonts", {})
    out += ["## Type", "heading: %s" % fonts.get("heading", "system-ui"), "body: %s" % fonts.get("body", "system-ui"), ""]
    return "\n".join(out)


# --------------------------------------------------------------------------- accessibility panel (assets/runtime/a11y.js)
# Colour-vision palettes found by scripts/cvd_palettes.py and checked with palette_check.py (0 FAIL): every pair
# clears ΔE 15 for normal vision and ΔE 8 under protan, deutan and tritan simulation (light: all pairs; dark: all
# neighbours), and each colour reaches 3:1 on the surface. Both modes share the series colours; the status colours
# differ: red-green moves success/danger off the red-green axis (blue/vermilion), blue-yellow off the blue-yellow one.
SAFE_SERIES = {"light": ["#6B2F01", "#1292C0", "#BF2F56", "#814EC6", "#174276", "#A28218"],
               "dark": ["#78DCA9", "#878BF2", "#E6705F", "#25BAF2", "#E2C162", "#E486C6"]}
CVD = {
    "rg": {**SAFE_SERIES,
           "status": {"light": {"success": "#0B5DB0", "warning": "#8A4B00", "danger": "#8F2D00", "info": "#5B2C83"},
                      "dark": {"success": "#8CC8F5", "warning": "#F5C04A", "danger": "#FFA27A", "info": "#D3A6F0"}}},
    "by": {**SAFE_SERIES,
           "status": {"light": {"success": "#006B5E", "warning": "#8C3A00", "danger": "#A3141F", "info": "#004F8C"},
                      "dark": {"success": "#5FD6C4", "warning": "#FFB37A", "danger": "#FF8A94", "info": "#7FC4F5"}}},
}


def push(color: str, toward: str, against: list[str], target: float) -> str:
    """Mix `color` toward black or white until it reaches `target` contrast with every colour in `against`."""
    end = "#000000" if toward == "black" else "#FFFFFF"
    for i in range(0, 101, 4):
        c = mix(end, color, i / 100)
        if all(contrast(c, b) >= target for b in against):
            return c
    return end


def contrast_tokens(cfg: dict, theme: str) -> dict[str, str]:
    """Stronger text, borders and primary for "Contraste élevé": AAA (7:1) for text where the palette allows."""
    t, base = resolve(cfg, theme), base_of(cfg, theme)
    way = "black" if base == "light" else "white"
    bg = t["bg"] if base == "light" else mix("#000000", t["bg"], 0.35)
    surface = t["surface"] if base == "light" else mix("#000000", t["surface"], 0.25)
    text = push(t["text"], way, [bg, surface], 12)
    muted = push(t["text-muted"], way, [bg, surface], 7)
    border = push(t["border"], way, [bg, surface], 3)
    primary = push(t["primary"], way, [bg, surface], 7)
    on_primary = "#FFFFFF" if contrast("#FFFFFF", primary) >= contrast("#000000", primary) else "#000000"
    out = {"color-text": text, "color-text-muted": muted, "color-border": border, "card-border": border,
           "color-primary": primary, "color-primary-hover": push(primary, way, [bg], 9), "button-bg": primary,
           "color-on-primary": on_primary, "input-border": primary, "color-focus": text, "color-accent": primary}
    if base == "dark":
        out.update({"color-bg": bg, "color-surface": surface, "gradient-bg": "none"})
    return out


def a11y_css(cfg: dict) -> str:
    """CSS the accessibility panel injects: high contrast and colour-vision palettes for every theme.
    Extra themes add [data-theme=id] (one more attribute than light's rule) so they win over the light variants."""
    decl = lambda d: ";".join("--%s:%s" % kv for kv in d.items())
    extras = extra_themes(cfg)
    css = ["html[data-a11y-contrast=more]{%s}" % decl(contrast_tokens(cfg, "light")),
           "html[data-a11y-contrast=more].dark,html[data-a11y-contrast=more][data-theme=dark]{%s}" % decl(contrast_tokens(cfg, "dark"))]
    css += ['html[data-a11y-contrast=more][data-theme="%s"]{%s}' % (t, decl(contrast_tokens(cfg, t))) for t in extras]
    n = max(len(cfg.get("chart", {}).get("light", [])), 6)
    for kind, pal in CVD.items():
        for theme in ("light", "dark", *extras):
            base = base_of(cfg, theme)
            vals = {"chart-%d" % (i + 1): pal[base][i % len(pal[base])] for i in range(n)}
            vals.update({"color-" + k: v for k, v in pal["status"][base].items()})
            if theme == "light":
                sel = "html[data-a11y-cvd=%s]" % kind
            elif theme == "dark":
                sel = "html[data-a11y-cvd=%s].dark,html[data-a11y-cvd=%s][data-theme=dark]" % (kind, kind)
            else:
                sel = 'html[data-a11y-cvd=%s][data-theme="%s"]' % (kind, theme)
            css.append("%s{%s}" % (sel, decl(vals)))
    return "".join(css)
