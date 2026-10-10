"""Search colour-vision-safe chart palettes (6 colours) for the accessibility panel, light and dark.

    python cvd_palettes.py            prints the palettes; paste them into tokens.CVD if you regenerate

Candidates: every 10° of hue at a few OKLCH lightness/chroma steps, kept only if they reach 3:1 on the surface.
Selection: the 6 colours whose weakest pair (normal vision and the simulated deficiencies of the mode) is the
strongest; then the order that maximises the weakest neighbour pair (series are drawn in order).
"""
from __future__ import annotations

import math
import sys
from itertools import combinations, permutations

import palette_check as PC
import tokens as TK

# both modes stay legible for all three deficiencies; each one favours its own (listed first)
MODES = {"rg": ("protan", "deutan", "tritan"), "by": ("tritan", "protan", "deutan")}
SURFACE = {"light": "#FFFFFF", "dark": "#1B1A3A"}
STEPS = {"light": [(0.50, 0.15), (0.58, 0.14), (0.44, 0.12), (0.38, 0.10), (0.54, 0.18), (0.62, 0.12)],
         "dark": [(0.74, 0.14), (0.82, 0.12), (0.68, 0.15)]}


def oklch_hex(l: float, c: float, h: float) -> str | None:
    a, b = c * math.cos(math.radians(h)), c * math.sin(math.radians(h))
    l_, m_, s_ = l + 0.3963377774 * a + 0.2158037573 * b, l - 0.1055613458 * a - 0.0638541728 * b, l - 0.0894841775 * a - 1.2914855480 * b
    l3, m3, s3 = l_ ** 3, m_ ** 3, s_ ** 3
    lin = (4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
           -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
           -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3)
    if any(v < -0.001 or v > 1.001 for v in lin):
        return None  # outside sRGB
    enc = [12.92 * v if v <= 0.0031308 else 1.055 * max(v, 0) ** (1 / 2.4) - 0.055 for v in lin]
    return TK.to_hex(tuple(255 * min(1, max(0, v)) for v in enc))


def dist(x: str, y: str, kinds: tuple[str, ...]) -> float:
    """The pair's margin over both floors, in units of ΔE 8: normal vision counts against 15, deficiencies against 8."""
    lx, ly = PC.linear(x), PC.linear(y)
    d = [PC.delta_e(PC.oklab(lx), PC.oklab(ly)) * 8 / 15]
    d += [PC.delta_e(PC.oklab(PC.simulate(lx, k)), PC.oklab(PC.simulate(ly, k))) for k in kinds]
    return min(d)


def best(theme: str, kinds: tuple[str, ...]) -> list[str]:
    pool = []
    for l, c in STEPS[theme]:
        for h in range(0, 360, 5 if theme == "light" else 10):
            hx = oklch_hex(l, c, h)
            if hx and TK.contrast(hx, SURFACE[theme]) >= 3:
                pool.append(hx)
    pool = sorted(set(pool))
    D = {(a, b): dist(a, b, kinds) for a, b in combinations(pool, 2)}
    d = lambda a, b: D.get((a, b)) or D.get((b, a))
    # greedy farthest-point start, then local swaps: a 6-subset with the best weakest pair
    chosen = [max(pool, key=lambda p: TK.contrast(p, SURFACE[theme]))]
    while len(chosen) < 6:
        chosen.append(max((p for p in pool if p not in chosen), key=lambda p: min(d(p, q) for q in chosen)))
    improved = True
    while improved:
        improved = False
        score = min(d(a, b) for a, b in combinations(chosen, 2))
        for i in range(6):
            for p in pool:
                if p in chosen:
                    continue
                trial = chosen[:i] + [p] + chosen[i + 1:]
                s = min(d(a, b) for a, b in combinations(trial, 2))
                if s > score + 0.01:
                    chosen, score, improved = trial, s, True
    # neighbours must clear both floors: normal vision ΔE ≥ 15 and the mode's deficiencies ΔE ≥ 8
    normal = lambda x, y: PC.delta_e(PC.oklab(PC.linear(x)), PC.oklab(PC.linear(y)))
    def neighbour_score(o):
        seq = (chosen[0],) + o
        pairs = list(zip(seq, seq[1:] + seq[:1]))
        return min(min(normal(x, y) / 15, dist(x, y, ("protan", "deutan", "tritan")) / 8) for x, y in pairs)
    order = max(permutations(chosen[1:]), key=neighbour_score)
    return [chosen[0], *order]


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    for mode, kinds in MODES.items():
        for theme in ("light", "dark"):
            pal = best(theme, kinds)
            worst = min(dist(a, b, kinds) for a, b in combinations(pal, 2))
            print('"%s/%s": %s,  # weakest pair %.2f of the floors' % (mode, theme, pal, worst / 8))
