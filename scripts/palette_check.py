"""Check a design system's colours: text contrast (WCAG 2.x) and the chart palettes for colour-vision deficiency.

    python palette_check.py <project_dir>            reads ds.config.json
    python palette_check.py --chart "#hex,#hex,..." --surface "#FFFFFF"

Chart checks, per theme, on each pair of neighbouring colours (series are assigned in order):
  - normal vision ΔE (OKLab ×100) ≥ 15            below: FAIL, two series look the same to everyone
  - protan / deutan / tritan simulated ΔE ≥ 8      6–8: WARN (needs a second cue: labels, texture); < 6: FAIL
  - contrast of each colour on the surface ≥ 3:1   below: WARN (marks need a visible label or a table view)
Text checks: the pairs listed in references/tokens-and-color.md, AA = 4.5:1 for text, 3:1 for large text and UI.
Exit code 1 when anything FAILs.
"""
from __future__ import annotations

import argparse
import json
import sys
from itertools import combinations
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import tokens as TK  # noqa: E402

# Machado, Oliveira & Fernandes (2009), severity 1.0, applied to linear RGB
CVD = {
    "protan": ((0.152286, 1.052583, -0.204868), (0.114503, 0.786281, 0.099216), (-0.003882, -0.048116, 1.051998)),
    "deutan": ((0.367322, 0.860646, -0.227968), (0.280085, 0.672501, 0.047413), (-0.011820, 0.042940, 0.968881)),
    "tritan": ((1.255528, -0.076749, -0.178779), (-0.078411, 0.930809, 0.147602), (0.004733, 0.691367, 0.303900)),
}


def linear(hex_: str) -> tuple[float, float, float]:
    def f(c: int) -> float:
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(f(c) for c in TK.rgb(hex_))


def oklab(lin: tuple[float, float, float]) -> tuple[float, float, float]:
    r, g, b = lin
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    return (0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s)


def simulate(lin: tuple[float, float, float], kind: str) -> tuple[float, float, float]:
    return tuple(max(0.0, min(1.0, sum(row[i] * lin[i] for i in range(3)))) for row in CVD[kind])


def delta_e(a: tuple, b: tuple) -> float:
    return 100 * sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5


def check_chart(colors: list[str], surface: str, label: str) -> int:
    fails = 0
    print("\nChart palette · %s (on %s)" % (label, surface))
    for c in colors:
        r = TK.contrast(c, surface)
        print("  %s  contrast %.2f:1 %s" % (c, r, "" if r >= 3 else "WARN (needs labels or a table)"))
    pairs = list(zip(colors, colors[1:])) + ([(colors[-1], colors[0])] if len(colors) > 2 else [])
    for a, b in pairs:
        la, lb = linear(a), linear(b)
        normal = delta_e(oklab(la), oklab(lb))
        cvd = {k: delta_e(oklab(simulate(la, k)), oklab(simulate(lb, k))) for k in CVD}
        worst = min(cvd.values())
        state = "FAIL" if normal < 15 or worst < 6 else ("WARN" if worst < 8 else "ok")
        fails += state == "FAIL"
        print("  %s / %s  normal %5.1f  protan %5.1f  deutan %5.1f  tritan %5.1f  %s"
              % (a, b, normal, cvd["protan"], cvd["deutan"], cvd["tritan"], state))
    close = [(a, b) for a, b in combinations(colors, 2) if delta_e(oklab(linear(a)), oklab(linear(b))) < 15]
    if close:
        print("  note: non-neighbour pairs under ΔE 15 (avoid them in the same chart): %s" % ", ".join("%s/%s" % p for p in close))
    return fails


def check_text(cfg: dict) -> int:
    fails = 0
    for theme in ("light", "dark"):
        t = TK.resolve(cfg, theme)
        print("\nText contrast · %s" % theme)
        pairs = [("text / bg", "text", "bg", 4.5), ("text / surface", "text", "surface", 4.5),
                 ("text-muted / bg", "text-muted", "bg", 4.5), ("text-muted / surface", "text-muted", "surface", 4.5),
                 ("primary / bg (links)", "primary", "bg", 4.5), ("on-primary / primary (buttons)", "on-primary", "primary", 4.5),
                 ("focus / bg (ring)", "focus", "bg", 3.0), ("border / bg (inputs)", "border", "bg", 1.3)]
        pairs += [("%s / %s-soft" % (k, k), k, k + "-soft", 4.5) for k in TK.STATUS]
        for label, fg, bg, need in pairs:
            r = TK.contrast(t[fg], t[bg])
            state = "ok" if r >= need else "FAIL"
            fails += state == "FAIL" and need >= 3
            print("  %-34s %s on %s  %5.2f:1  (needs %.1f) %s" % (label, t[fg], t[bg], r, need, state))
    return fails


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("project", nargs="?")
    ap.add_argument("--chart")
    ap.add_argument("--surface", default="#FFFFFF")
    a = ap.parse_args()
    if a.chart:
        fails = check_chart([c.strip() for c in a.chart.split(",")], a.surface, "given")
    elif a.project:
        cfg = json.loads((Path(a.project) / "ds.config.json").read_text(encoding="utf-8"))
        fails = check_text(cfg)
        for theme in ("light", "dark"):
            colors = cfg.get("chart", {}).get(theme, [])
            if colors:
                fails += check_chart(colors, TK.resolve(cfg, theme)["surface"], theme)
    else:
        sys.exit(__doc__)
    print("\n%s" % ("FAIL: %d problem(s)" % fails if fails else "all checks passed"))
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
