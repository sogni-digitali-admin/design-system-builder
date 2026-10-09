"""Splash and loader as self-contained animated SVG images, generated from the brand mark.

Each file carries its own <style>: it plays the same inline, as <img src>, as a CSS background or in a PWA
start page, with no script. The mark's shapes are traced in the primary colour, then take their own fills,
then the name rises. Under prefers-reduced-motion the finished image fades in.
Files written by a full build: dist/splash/splash-light.svg, splash-dark.svg, loader-light.svg, loader-dark.svg.
"""
from __future__ import annotations

import html
import re
from pathlib import Path

import tokens as TK

SHAPE = re.compile(r"<(path|circle|rect|polygon|ellipse|line|polyline)\b([^>]*?)(/?)>")
SIZE = 400          # splash canvas, square
MARK = 150          # mark size on the splash
EASE = "cubic-bezier(.16,1,.3,1)"


def mark_source(project: Path, cfg: dict) -> tuple[str, str]:
    """(viewBox, inner SVG) of the mark; a rounded square with the initial when no mark file is set."""
    src = cfg.get("logo", {}).get("mark")
    if src and (project / src).exists():
        text = re.sub(r"<\?xml.*?\?>|<!--.*?-->|<title.*?</title>", "", (project / src).read_text(encoding="utf-8"), flags=re.S)
        vb = re.search(r'viewBox="([^"]+)"', text)
        inner = re.sub(r"^\s*<svg[^>]*>|</svg>\s*$", "", text.strip())
        return (vb.group(1) if vb else "0 0 100 100"), inner
    initial = html.escape(cfg["name"][:1].upper())
    return "0 0 100 100", ('<rect x="6" y="6" width="88" height="88" rx="26" fill="var(--sp-primary)"/>'
                           '<text x="50" y="66" text-anchor="middle" font-size="48" font-weight="700" fill="var(--sp-on-primary)" '
                           'font-family="system-ui, sans-serif">%s</text>' % initial)


def scoped(inner: str, prefix: str) -> str:
    """Prefix the mark's ids so two copies on one page never share a gradient or a clip path."""
    ids = re.findall(r'\bid="([^"]+)"', inner)
    for i in ids:
        inner = inner.replace('id="%s"' % i, 'id="%s-%s"' % (prefix, i))
        inner = re.sub(r"(url\(#|href=\"#)%s([\")])" % re.escape(i), r"\g<1>%s-%s\2" % (prefix, i), inner)
    return inner


def is_line_art(attrs: str) -> bool:
    """A shape drawn by its own stroke (kept and traced as is), as opposed to a filled shape (traced, then filled)."""
    own_stroke = re.search(r'(?<![\w-])stroke="(?!none)[^"]+"|(?<![\w-])stroke\s*:\s*(?!none)', attrs)
    return bool(own_stroke or re.search(r'(?<![\w-])fill="none"|(?<![\w-])fill\s*:\s*none', attrs))


def numbered(inner: str) -> tuple[str, int]:
    """Every shape gets pathLength="1" (to trace it), data-i (its turn in the stagger) and data-k (s = line art, f = filled)."""
    count = 0

    def tag(m: re.Match) -> str:
        nonlocal count
        count += 1
        kind = "s" if is_line_art(m.group(2)) else "f"
        return '<%s%s data-i="%d" data-k="%s" pathLength="1"%s>' % (m.group(1), m.group(2), count - 1, kind, m.group(3))
    return SHAPE.sub(tag, inner), count


def place(view_box: str, size: float, cx: float, cy: float) -> str:
    x, y, w, h = (float(v) for v in view_box.replace(",", " ").split())
    s = size / max(w, h)
    return "translate(%.2f %.2f) scale(%.4f) translate(%.2f %.2f)" % (cx - w * s / 2, cy - h * s / 2, s, -x, -y)


def style(t: dict, count: int, loader: bool) -> str:
    stagger = "".join('.m [data-i="%d"]{animation-delay:%dms,%dms,900ms}' % (i, i * 40, 550 + i * 40) for i in range(count))
    # line art has one animation: its delay is the first of the list
    if loader:
        return ("<style>:root{--sp-primary:%s;--sp-on-primary:%s}"
                "@media (prefers-reduced-motion:no-preference){.m{transform-box:fill-box;transform-origin:center;animation:b 1.6s ease-in-out infinite}}"
                "@keyframes b{0%%,100%%{transform:scale(.94);opacity:.7}50%%{transform:scale(1);opacity:1}}</style>" % (t["primary"], t["on-primary"]))
    return ("<style>:root{--sp-primary:%(p)s;--sp-on-primary:%(op)s}"
            "@media (prefers-reduced-motion:no-preference){"
            ".m [data-k=f]{stroke:%(p)s;stroke-width:1.5px;vector-effect:non-scaling-stroke;stroke-dasharray:1 1;stroke-opacity:0;"
            "animation:d 700ms %(e)s both,f 400ms ease both,u 300ms ease both}"
            ".m [data-k=s]{animation:t 700ms %(e)s both}%(st)s"
            ".n{animation:r 400ms 800ms %(e)s both}}"
            "@media (prefers-reduced-motion:reduce){svg{animation:i 200ms ease both}}"
            "@keyframes d{from{stroke-dashoffset:1;stroke-opacity:1;fill-opacity:0}to{stroke-dashoffset:0;stroke-opacity:1;fill-opacity:0}}"
            "@keyframes t{from{stroke-dasharray:1 1;stroke-dashoffset:1}99.9%%{stroke-dasharray:1 1;stroke-dashoffset:0}to{stroke-dasharray:none}}"
            "@keyframes f{from{fill-opacity:0}to{fill-opacity:1}}@keyframes u{from{stroke-opacity:1}to{stroke-opacity:0}}"
            "@keyframes r{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@keyframes i{from{opacity:0}}</style>"
            % {"p": t["primary"], "op": t["on-primary"], "e": EASE, "st": stagger})


def splash_svg(project: Path, cfg: dict, theme: str, prefix: str) -> str:
    t = TK.resolve(cfg, theme)
    vb, inner = mark_source(project, cfg)
    inner, count = numbered(scoped(inner, prefix))
    font = html.escape(cfg.get("fonts", {}).get("heading", "system-ui, sans-serif"), quote=True)
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %(z)d %(z)d" role="img" aria-label="%(n)s">%(st)s'
            '<rect width="%(z)d" height="%(z)d" fill="%(bg)s"/><g class="m" transform="%(tr)s">%(in)s</g>'
            '<text class="n" x="%(c)d" y="%(ty)d" text-anchor="middle" font-family="%(f)s" font-size="34" font-weight="700" fill="%(tx)s">%(n)s</text></svg>'
            % {"z": SIZE, "n": html.escape(cfg["name"]), "st": style(t, count, False), "bg": t["bg"], "tr": place(vb, MARK, SIZE / 2, 170),
               "in": inner, "c": SIZE / 2, "ty": 300, "f": font, "tx": t["text"]})


def loader_svg(project: Path, cfg: dict, theme: str, prefix: str) -> str:
    t = TK.resolve(cfg, theme)
    vb, inner = mark_source(project, cfg)
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="%s">%s'
            '<g class="m"><g transform="%s">%s</g></g></svg>'
            % (html.escape(cfg["name"]), style(t, 0, True), place(vb, 52, 32, 32), scoped(inner, prefix)))


def data_uri(svg: str) -> str:
    """An <img>-ready URI: the image keeps its <style> to itself (inline, it would style the whole page)."""
    import base64
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode("utf-8")).decode("ascii")


def all_svgs(project: Path, cfg: dict) -> dict[str, str]:
    return {"splash-light": splash_svg(project, cfg, "light", "spl"), "splash-dark": splash_svg(project, cfg, "dark", "spd"),
            "loader-light": loader_svg(project, cfg, "light", "ldl"), "loader-dark": loader_svg(project, cfg, "dark", "ldd")}
