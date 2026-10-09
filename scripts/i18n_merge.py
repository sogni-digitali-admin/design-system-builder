"""Rebuild i18n/dict.json from the translators' outputs and the hand corrections, and report gaps.

    python i18n_merge.py <project_dir>

Reads  i18n/dict.json (kept: earlier translations), i18n/chunks/chunk_NN.json (source strings),
       i18n/chunks/out_NN.json ({"<lang>": {"<source>": "<translation>"}}), i18n/overrides*.json (win over all).
Writes i18n/dict.json. Rebuilding from the files each time means a bad entry is fixed by fixing its file.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


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
                if isinstance(v, str) and v.strip():
                    d[lang][s] = v
                else:
                    empty += 1
    # an elision before a tag ("l'" + <b>word</b>) has no space in French; the translation needs one
    for lang in targets:
        for k, v in d[lang].items():
            if k.endswith(("'", "’")) and v[-1:].isalpha():
                d[lang][k] = v + " "
    for ov in sorted(folder.glob("overrides*.json")):
        o = load(ov)
        for lang in targets:
            d[lang].update(o.get(lang, {}))
    (folder / "dict.json").write_text(json.dumps(d, ensure_ascii=False, indent=0), encoding="utf-8")
    sizes = ", ".join("%s %d" % (lang, len(d[lang])) for lang in targets)
    print("dict.json: %s · chunks without output: %s · empty entries: %d" % (sizes, ", ".join(missing_out) or "none", empty))
    sys.exit(1 if missing_out or empty else 0)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(Path(sys.argv[1]))
