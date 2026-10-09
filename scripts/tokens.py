"""Tokens: CSS custom properties, contrast checks, swatches and the token part of design.md.

Semantic colours in ds.config.json may name a primitive ("brand-700") or give a hex ("#7E27C9").
"""
from __future__ import annotations

import html

REQUIRED = ("bg", "surface", "text", "text-muted", "primary", "on-primary", "primary-hover",
            "accent", "border", "focus", "success", "warning", "danger", "info")
STATUS = ("success", "warning", "danger", "info")
SOFT_MIX = {"light": 0.12, "dark": 0.20}  # share of the status colour in its pale background

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
           "aaa": "AAA", "aa": "AA", "large": "Large text / graphics", "deco": "Decorative only", "copy": "Copy"},
    "fr": {"language": "Langue", "light": "Clair", "dark": "Sombre", "copied": "Copié", "contents": "Sommaire",
           "toggle": "Basculer clair / sombre", "download": "Télécharger design.md", "top": "haut de page",
           "on": "sur", "page": "fond de page", "surface": "surface des cartes", "text": "Texte", "muted": "Texte atténué",
           "primary": "Couleur principale", "button": "Texte de bouton sur couleur principale", "accent": "Accent",
           "soft": "sur son fond pâle", "aaa": "AAA", "aa": "AA", "large": "Grand texte / graphisme",
           "deco": "Décoratif seulement", "copy": "Copier"},
    "it": {"language": "Lingua", "light": "Chiaro", "dark": "Scuro", "copied": "Copiato", "contents": "Indice",
           "toggle": "Passa a chiaro / scuro", "download": "Scarica design.md", "top": "inizio pagina",
           "on": "su", "page": "sfondo pagina", "surface": "superficie delle card", "text": "Testo", "muted": "Testo attenuato",
           "primary": "Colore principale", "button": "Testo del pulsante sul colore principale", "accent": "Accento",
           "soft": "sul suo fondo chiaro", "aaa": "AAA", "aa": "AA", "large": "Testo grande / grafica",
           "deco": "Solo decorativo", "copy": "Copia"},
    "es": {"language": "Idioma", "light": "Claro", "dark": "Oscuro", "copied": "Copiado", "contents": "Índice",
           "toggle": "Cambiar claro / oscuro", "download": "Descargar design.md", "top": "inicio de página",
           "on": "sobre", "page": "fondo de página", "surface": "superficie de tarjetas", "text": "Texto", "muted": "Texto atenuado",
           "primary": "Color principal", "button": "Texto de botón sobre color principal", "accent": "Acento",
           "soft": "sobre su fondo claro", "aaa": "AAA", "aa": "AA", "large": "Texto grande / gráficos",
           "deco": "Solo decorativo", "copy": "Copiar"},
    "de": {"language": "Sprache", "light": "Hell", "dark": "Dunkel", "copied": "Kopiert", "contents": "Inhalt",
           "toggle": "Hell / dunkel umschalten", "download": "design.md herunterladen", "top": "Seitenanfang",
           "on": "auf", "page": "Seitenhintergrund", "surface": "Kartenfläche", "text": "Text", "muted": "Gedämpfter Text",
           "primary": "Primärfarbe", "button": "Buttontext auf Primärfarbe", "accent": "Akzent",
           "soft": "auf seinem hellen Grund", "aaa": "AAA", "aa": "AA", "large": "Großer Text / Grafik",
           "deco": "Nur dekorativ", "copy": "Kopieren"},
}


def ui_text(lang: str, key: str) -> str:
    return UI.get(lang, UI["en"]).get(key, UI["en"][key])


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


def resolve(cfg: dict, theme: str) -> dict[str, str]:
    """Semantic colours of one theme as hex, with the pale status backgrounds added."""
    prim = primitives(cfg)
    raw = cfg["themes"][theme]
    missing = [k for k in REQUIRED if k not in raw]
    if missing:
        raise SystemExit("themes.%s is missing %s" % (theme, ", ".join(missing)))
    out = {k: prim.get(v, v) for k, v in raw.items()}
    for key in STATUS:
        out.setdefault(key + "-soft", mix(out[key], out["bg"], SOFT_MIX[theme]))
    return out


def ref(cfg: dict, value: str) -> str:
    """A semantic value as var(--primitive) when it names one or equals one."""
    for name, hex_ in primitives(cfg).items():
        if value == name or value.lower() == hex_.lower():
            return "var(--%s)" % name
    return value


# --------------------------------------------------------------------------- CSS
def _theme_css(cfg: dict, theme: str, selector: str) -> list[str]:
    raw, res = cfg["themes"][theme], resolve(cfg, theme)
    lines = ["%s {" % selector]
    lines += ["  --color-%s: %s;" % (k, ref(cfg, raw.get(k, v))) for k, v in res.items()]
    lines.append("  --gradient-bg: %s;" % cfg.get("gradient", {}).get(theme, "none"))
    lines += ["  --chart-%d: %s;" % (i + 1, c) for i, c in enumerate(cfg.get("chart", {}).get(theme, []))]
    shadow = cfg.get("shadow", {}).get(theme) or (
        "0 1px 2px rgb(0 0 0 / .06), 0 10px 28px rgb(0 0 0 / .08)" if theme == "light"
        else "0 1px 2px rgb(0 0 0 / .4), 0 12px 32px rgb(0 0 0 / .45)")
    lines += ["  --shadow-card: %s;" % shadow, "  color-scheme: %s;" % theme, "}"]
    return lines


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


def swatches(cfg: dict) -> str:
    copy = ui_text(cfg["source_lang"], "copy")
    return "\n".join(
        '<li><button class="copy dot-btn" type="button" data-i18n-skip data-copy="%(h)s" aria-label="%(c)s %(h)s"><span class="big-dot" style="background:%(h)s"></span></button>'
        '<strong>%(n)s</strong><code>%(h)s</code><span class="muted">%(note)s</span></li>'
        % {"h": p["hex"], "n": html.escape(p["name"]), "c": copy, "note": html.escape(p.get("note", ""))}
        for p in cfg.get("primitives", []))


def chart_swatches(cfg: dict) -> str:
    out = []
    for theme in ("light", "dark"):
        dots = "".join('<span class="dot" style="background:%s" title="%s"></span>' % (c, c) for c in cfg.get("chart", {}).get(theme, []))
        out.append('<div class="chart-row" data-theme="%s"><span class="label">%s</span>%s</div>' % (theme, ui_text(cfg["source_lang"], theme), dots))
    return "\n".join(out)


# --------------------------------------------------------------------------- design.md
def design_md_tokens(cfg: dict) -> str:
    out = []
    for theme in ("light", "dark"):
        t = resolve(cfg, theme)
        out.append("## Colors — %s" % theme)
        out += ["%s: %s" % (k, v) for k, v in t.items() if k not in STATUS and not k.endswith("-soft")]
        if cfg.get("gradient", {}).get(theme):
            out.append("gradient-bg: %s" % cfg["gradient"][theme])
        out += ["", "## Status — %s" % theme]
        out += ["%s: %s\n%s-soft: %s" % (k, t[k], k, t[k + "-soft"]) for k in STATUS]
        out.append("")
    chart = cfg.get("chart", {})
    if chart:
        out += ["## Charts", "categorical-light: %s" % ", ".join(chart.get("light", [])),
                "categorical-dark: %s" % ", ".join(chart.get("dark", [])),
                "rule: assign in fixed order, never cycle; one y-axis only; status colours never used as series", ""]
    fonts = cfg.get("fonts", {})
    out += ["## Type", "heading: %s" % fonts.get("heading", "system-ui"), "body: %s" % fonts.get("body", "system-ui"), ""]
    return "\n".join(out)
