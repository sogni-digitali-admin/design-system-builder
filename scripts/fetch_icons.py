"""Find and download icons from one open-source set, through the public Iconify API (api.iconify.design).

    python fetch_icons.py sets                                   the recommended sets, live: count, licence
    python fetch_icons.py search <prefix> <words> [--limit 30]   names in one set matching the words
    python fetch_icons.py get <project_dir> <prefix> NAME[=alias] ...   write icons/<alias or name>.svg

Examples:
    python fetch_icons.py search lucide "invoice receipt"
    python fetch_icons.py get ../acme lucide house mail-open=mail chart-column=chart

Every downloaded icon is recorded in icons/SOURCES.md (set, licence, original name). Use ONE set per
design system (two stroke styles side by side look broken). A single <g> wrapper is unwrapped onto <svg>
so the motion "draw" can reach each stroke.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://api.iconify.design"
RECOMMENDED = ["lucide", "tabler", "ph", "hugeicons", "iconoir", "heroicons", "ri", "mingcute",
               "material-symbols", "fluent", "carbon", "bi", "radix-icons", "solar"]


def get_json(path: str) -> dict:
    try:
        req = urllib.request.Request(API + path, headers={"User-Agent": "design-system-builder/1.0 (+fetch_icons.py)"})
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    except OSError as e:
        sys.exit("Iconify API unreachable (%s). Download the set from its own site instead (references/icons.md)." % e)


def cmd_sets() -> None:
    data = get_json("/collections?prefixes=" + ",".join(RECOMMENDED))
    print("%-18s %-26s %7s  %-12s %s" % ("prefix", "name", "icons", "licence", "grid"))
    for prefix in RECOMMENDED:
        info = data.get(prefix)
        if info:
            lic = info.get("license", {})
            print("%-18s %-26s %7s  %-12s %s" % (prefix, info.get("name", ""), info.get("total", "?"),
                                                lic.get("spdx") or lic.get("title", "?"), info.get("height", "mixed")))


def cmd_search(prefix: str, words: str, limit: int) -> None:
    q = urllib.parse.urlencode({"query": words, "prefix": prefix, "limit": max(32, limit)})
    found = get_json("/search?" + q).get("icons", [])[:limit]
    for full in found:
        print(full.split(":", 1)[1])
    if not found:
        print("no match in %s for '%s': try a synonym (receipt for invoice, house for home)" % (prefix, words))


def unwrap(body: str) -> tuple[str, str]:
    """'<g stroke=…>children</g>' -> (' stroke=…', 'children') when the body is one group."""
    m = re.fullmatch(r"\s*<g([^>]*)>(.*)</g>\s*", body, flags=re.S)
    if m and "<g" not in m.group(2):
        return m.group(1), m.group(2)
    return "", body


def cmd_get(project: Path, prefix: str, items: list[str]) -> None:
    pairs = [i.split("=", 1) if "=" in i else [i, i] for i in items]
    data = get_json("/%s.json?icons=%s" % (prefix, ",".join(p[0] for p in pairs)))
    info = get_json("/collections?prefixes=" + prefix).get(prefix, {})
    lic = info.get("license", {})
    folder = project / "icons"
    folder.mkdir(parents=True, exist_ok=True)
    w, h = data.get("width", 24), data.get("height", 24)
    log = []
    for name, alias in pairs:
        icon = data.get("icons", {}).get(name) or data.get("icons", {}).get(data.get("aliases", {}).get(name, {}).get("parent", ""))
        if not icon:
            print("not found: %s:%s (try: fetch_icons.py search %s %s)" % (prefix, name, prefix, name))
            continue
        extra, body = unwrap(icon["body"])
        svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %s %s"%s>%s</svg>\n' % (icon.get("width", w), icon.get("height", h), extra, body)
        (folder / (alias + ".svg")).write_text(svg, encoding="utf-8")
        log.append("| %s | %s:%s | %s | %s |" % (alias, prefix, name, info.get("name", prefix), lic.get("spdx") or lic.get("title", "?")))
        print("icons/%s.svg" % alias)
    sources = folder / "SOURCES.md"
    if not sources.exists():
        sources.write_text("# Icon sources\n\n| file | source | set | licence |\n|---|---|---|---|\n", encoding="utf-8")
    with sources.open("a", encoding="utf-8") as f:
        f.write("\n".join(log) + ("\n" if log else ""))


def main(argv: list[str]) -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    if not argv or argv[0] not in ("sets", "search", "get"):
        sys.exit(__doc__)
    if argv[0] == "sets":
        cmd_sets()
    elif argv[0] == "search" and len(argv) >= 3:
        limit = int(argv[argv.index("--limit") + 1]) if "--limit" in argv else 30
        words = " ".join(a for a in argv[2:] if a != "--limit" and not a.isdigit())
        cmd_search(argv[1], words, limit)
    elif argv[0] == "get" and len(argv) >= 4:
        cmd_get(Path(argv[1]), argv[2], argv[3:])
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
