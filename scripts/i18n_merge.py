"""Rebuild i18n/dict.json from the translators' outputs and the hand corrections, and report gaps.

    python i18n_merge.py <project_dir>

Reads  i18n/dict.json (kept: earlier translations), i18n/chunks/chunk_NN.json (source strings),
       i18n/chunks/out_NN.json ({"<lang>": {"<source>": "<translation>"}}), i18n/overrides*.json (win over all).
Writes i18n/dict.json. Rebuilding from the files each time means a bad entry is fixed by fixing its file.
An empty translation (output or override) never replaces a published one: it is counted and reported instead.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _text import write_text  # noqa: E402


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def filled(value) -> bool:
    return isinstance(value, str) and bool(value.strip())


def main(project: Path) -> None:
    cfg = load(project / "ds.config.json")
    targets = [lang for lang in cfg["langs"] if lang != cfg["source_lang"]]
    folder = project / "i18n"
    old = load(folder / "dict.json")
    d = {lang: dict(old.get(lang, {})) for lang in targets}
    missing_out, empty = [], 0
    for chunk in sorted((folder / "chunks").glob("chunk_*.json")):
        src = load(chunk)
        out = load(chunk.with_name(chunk.name.replace("chunk_", "out_")))
        if not out:
            missing_out.append(chunk.name)
            continue
        for lang in targets:
            for s in src:
                v = out.get(lang, {}).get(s)
                if filled(v):
                    d[lang][s] = v
                else:
                    empty += 1
    # an elision before a tag ("l'" + <b>word</b>) has no space in French; the translation needs one
    for lang in targets:
        for k, v in d[lang].items():
            if k.endswith(("'", "’")) and v[-1:].isalpha():
                d[lang][k] = v + " "
    blank_overrides = 0
    for ov in sorted(folder.glob("overrides*.json")):
        o = load(ov)
        for lang in targets:
            for k, v in o.get(lang, {}).items():
                if filled(v):
                    d[lang][k] = v
                else:
                    blank_overrides += 1
                    print("  skipped: %s %s has an empty value for %r (the earlier translation is kept)" % (ov.name, lang, k[:60]))
    write_text(folder / "dict.json", json.dumps(d, ensure_ascii=False, indent=0))
    sizes = ", ".join("%s %d" % (lang, len(d[lang])) for lang in targets)
    print("dict.json: %s · chunks without output: %s · empty entries: %d · empty overrides: %d"
          % (sizes, ", ".join(missing_out) or "none", empty, blank_overrides))
    sys.exit(1 if missing_out or empty or blank_overrides else 0)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(Path(sys.argv[1]))
