"""Turn the person's answers (ds.plan.json) into the project: ds.config.json and notes/plan.md.

    python apply_plan.py <project_dir> <ds.plan.json> [--proposals proposals.json]

Reads the export and the proposals it answers (default <project_dir>/plan/proposals.json) for the full values of the chosen
cards. Creates the project with new_project.py when the folder does not exist, then patches ds.config.json: name, languages,
themes (light, dark, extra), primitives with provenance, fonts, icon set and list, style tokens, modules, planned sections,
features. Writes notes/plan.md (every decision with its reason, custom answers, notes, open questions, the export hash) and
prints the next commands. Nothing is invented: what the export does not settle becomes an open question.
No SVG logo = no splash: the splash section is removed and the reason recorded.
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import new_project as NP  # noqa: E402
import plan_schema as PS  # noqa: E402
import tokens as TK  # noqa: E402

SKILL = Path(__file__).resolve().parent.parent
FEATURE_SECTIONS = {"mobile": ("mobile", "references/mobile-pwa.md"), "wearables": ("wearables", "references/wearables.md"),
                    "emails": ("emails", "references/emails.md"), "signatures": ("emails", "references/emails.md"),
                    "messaging": ("emails", "references/emails.md"), "ai": ("ai", "references/ai-ux.md"),
                    "notifications": ("notifications", "references/notifications.md")}
AUTH_REF = ("auth", "references/auth.md")


# --------------------------------------------------------------------------- reading the answers
def load_json(path: Path, what: str) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        sys.exit("%s: cannot read %s (%s)" % (what, path, e))


def decisions(plan: dict, proposals: dict | None) -> list[dict]:
    """One record per topic: the answer, the chosen card(s) with their full proposal data, custom text, notes, values."""
    topics = {t["id"]: t for t in (proposals or {}).get("topics", [])}
    out = []
    for tid, ans in plan["answers"].items():
        topic = topics.get(tid) or {"id": tid, "title": tid, "kind": "choice", "proposals": []}
        by_id = {c["id"]: c for c in topic["proposals"]}
        ids = ans.get("choice_ids") if topic["kind"] == "multi" else [ans["choice_id"]] if ans.get("choice_id") else []
        cards = [by_id.get(i) or {"id": i, "title": i, "summary": ""} for i in ids or []]
        values = ans.get("values") or {}
        out.append({"topic": topic, "id": tid, "ans": ans, "cards": cards, "card": cards[0] if cards else None, "values": values,
                    "custom": (ans.get("custom") or "").strip(), "notes": (ans.get("notes") or "").strip(), "decided": bool(ans.get("decided")),
                    "tokens": (cards[0].get("tokens") or {}) if cards else {}, "known": bool(by_id)})
    return out


def field_values(dec: dict) -> dict:
    """Field values of the chosen card: the person's edit, else the proposed value."""
    card = dec["card"] or {}
    base = {f["key"]: f["value"] for f in card.get("fields", [])}
    return {**base, **dec["values"].get("fields", {})}


# --------------------------------------------------------------------------- handlers: colours
def hex_roles(roles: dict, rename: dict) -> dict:
    return {k: rename.get(v, v) for k, v in roles.items()}


def merge_primitives(cfg: dict, card: dict, edited: dict, theme: str, ctx: dict) -> dict:
    """Add the card's primitives to cfg. A name another theme already uses with a different hex becomes '<name>-<theme>'.
    Re-applying the same theme replaces its own primitives. Returns the renames."""
    have = {p["name"]: p for p in cfg["primitives"] if p.get("source") != "placeholder"}
    new, rename = {}, {}
    for p in card["palette"]["primitives"]:
        hex_ = (edited.get(p["name"]) or p["hex"]).upper()
        name, cur = p["name"], have.get(p["name"])
        if cur and cur["hex"].upper() == hex_ and cur.get("theme") != theme:
            continue
        if cur and cur["hex"].upper() != hex_ and cur.get("theme") not in (theme, None):
            name = "%s-%s" % (p["name"], theme)
            rename[p["name"]] = name
            ctx["questions"].append("Primitive '%s' has two different values (%s and %s): both kept, the second as '%s'." % (p["name"], cur["hex"], hex_, name))
        note = p.get("note", "") + (" (edited by the person)" if hex_ != p["hex"].upper() else "")
        new[name] = {"name": name, "hex": hex_, "source": p["source"], "note": note.strip(), "theme": theme, **({"input": p["input_id"]} if p.get("input_id") else {})}
    cfg["primitives"] = [x for x in cfg["primitives"] if x.get("source") != "placeholder" and x["name"] not in new] + list(new.values())
    return rename


def h_palette(cfg: dict, dec: dict, ctx: dict) -> None:
    card = dec["card"]
    if not card or "palette" not in card:
        if dec["topic"]["id"] != "extra_themes" or dec["custom"]:
            ctx["questions"].append("%s: %s" % (dec["topic"]["title"], "custom answer to turn into token values: " + dec["custom"] if dec["custom"] else "no palette chosen (the scaffold placeholder stays)"))
        return
    pal, theme = card["palette"], card["palette"].get("theme") or dec["topic"]["id"]
    rename = merge_primitives(cfg, card, dec["values"].get("primitives", {}), theme, ctx)
    roles = hex_roles(pal["roles"], rename)
    block = dict(roles)
    if theme not in TK.BASES:
        block.update({"base": pal.get("base", "light")})
        cfg["theme_names"] = {**cfg.get("theme_names", {}), theme: (card.get("extra_theme") or {}).get("names") or theme}
    cfg["themes"][theme] = block
    if pal.get("chart"):
        cfg["chart"][theme] = pal["chart"]
    else:
        ctx["questions"].append("No chart colours proposed for theme '%s': the scaffold placeholder ramp stays until a ramp is chosen." % theme)
    ctx["derived"].append("themes.%s from palette card '%s' (primitives sourced: %s)" % (theme, card["id"], ", ".join(sorted({p["source"] for p in pal["primitives"]}))))


# --------------------------------------------------------------------------- handlers: type, icons, style
def font_stack(name: str, fallback: str) -> str:
    return '"%s", %s' % (name.replace('"', ""), fallback or "system-ui, sans-serif")


def h_typography(cfg: dict, dec: dict, ctx: dict) -> None:
    card = dec["card"]
    if not card or "typography" not in card:
        ctx["questions"].append("Typography: %s" % (dec["custom"] or "no pairing chosen (system fonts stay)"))
        return
    ty, fonts = card["typography"], {**{"heading": card["typography"]["heading"], "body": card["typography"]["body"]}, **dec["values"].get("fonts", {})}
    cfg["fonts"] = {**cfg.get("fonts", {}), "heading": font_stack(fonts["heading"], ty.get("fallback_heading", "")), "body": font_stack(fonts["body"], ty.get("fallback_body", "")), "faces": cfg.get("fonts", {}).get("faces", [])}
    if fonts.get("accent"):
        cfg["fonts"]["accent"] = font_stack(fonts["accent"], ty.get("fallback_accent", ""))
    names = sorted({fonts[k] for k in ("heading", "body", "accent") if fonts.get(k)})
    ctx["questions"].append("Self-host the woff2 files of %s (%s) in fonts/ and fill fonts.faces; until then the system fallback shows." % (", ".join(names), ty["licence"]))


def h_icons(cfg: dict, dec: dict, ctx: dict) -> None:
    card = dec["card"]
    if not card or "icons" not in card:
        ctx["questions"].append("Icons: %s" % (dec["custom"] or "no set chosen"))
        return
    ic, names = card["icons"], dec["values"].get("icon_names") or card["icons"]["names"]
    motion = dec["values"].get("motion", ic.get("motion", False))
    cfg["icons"] = {"set": ic["set"], "licence": ic["licence"], "style": ic["style"], "motion": bool(motion), "names": names}
    ctx["icons"] = (ic["set"], names)


def style_derived(card: dict) -> dict:
    s = card["style"]
    out = {"radius": s["radius"], "border": s["border"], "shadow": s["shadow"], "density": s["density"]}
    if s.get("blur"):
        alpha = s.get("surface_alpha", 1)
        solid = TK.mix(s["surface"], s["bg_worst"], alpha)
        out["glass"] = {"blur": s["blur"], "surface_alpha": alpha, "solid_fallback": solid, "text_contrast_worst": round(TK.contrast(s["ink"], solid), 2),
                        "rules": "solid fallback without backdrop-filter, with prefers-reduced-transparency or high contrast; no text on raw blur; chrome and overlays only"}
    return out


def h_style(cfg: dict, dec: dict, ctx: dict) -> None:
    card = dec["card"]
    if not card or "style" not in card:
        ctx["questions"].append("Visual style: %s" % (dec["custom"] or "no style chosen"))
        return
    vals = dec["values"]
    accent = next((c for c in dec["topic"]["proposals"] if c["id"] == vals.get("accent_style")), None)
    derived = style_derived(card)
    if accent and "glass" in style_derived(accent):
        derived["accent_glass"] = style_derived(accent)["glass"]
    cfg["style"] = {"primary": card["id"], "family": card["style"]["family"], "accent": accent["id"] if accent else None,
                    "surfaces": vals.get("surfaces") or None, "derived": derived, "source": "derived from style"}
    cfg["radius"], cfg["density"] = derived["radius"], derived["density"]
    cfg["shadow"] = {"light": derived["shadow"], "dark": derived["shadow"]}
    ctx["derived"].append("radius, density, shadow, border and blur tokens derived from style '%s'" % card["id"])
    ctx["questions"] += ["Elevation: the style gives one card shadow; define the other levels (menus, dialogs) and check the dark theme reads.",
                         "Style '%s': confirm the border weight (%s) on inputs and cards against 3:1 where it carries meaning." % (card["id"], derived["border"])]
    if accent and not vals.get("surfaces"):
        ctx["questions"].append("Accent style '%s' chosen but the surfaces that use it are not named." % accent["id"])


def h_shape(cfg: dict, dec: dict, ctx: dict) -> None:
    tok = dec["tokens"]
    if not tok:
        return
    if tok.get("radius"):
        cfg["radius"] = {**cfg.get("radius", {}), **tok["radius"]}
    if tok.get("density"):
        cfg["density"] = tok["density"]
    ctx["derived"].append("radius and density from the shape decision (overrides the style's values)")


# --------------------------------------------------------------------------- handlers: splash, scope, language
def splash_parts_using_loader(project: Path) -> list[str]:
    hits = []
    for f in sorted((project / "parts").glob("*")):
        if f.stem == "splash" or f.suffix not in (".html", ".css", ".js"):
            continue
        if re.search(r"\{\{(LOADER|SPLASH)_|/splash/|\bsp-loader\b", f.read_text(encoding="utf-8", errors="replace")):
            hits.append(f.name)
    return hits


def remove_splash(cfg: dict, project: Path, reason: str, ctx: dict) -> None:
    cfg["sections"] = [s for s in cfg["sections"] if s["id"] != "splash"]
    cfg["splash"] = {"available": False, "reason": reason}
    ctx["questions"].append("Provide the logo as SVG to enable the splash (and the loader built from the mark). No splash was made from a raster logo, and none was traced or redrawn.")
    users = splash_parts_using_loader(project)
    if users:
        ctx["questions"].append("These parts still use the loader or splash images and must be changed to something else: %s." % ", ".join(users))
    ctx["derived"].append("splash section removed (%s)" % reason)


def h_splash(cfg: dict, dec: dict, ctx: dict) -> None:
    mark = cfg.get("logo", {}).get("mark") or ""
    if dec["ans"].get("available") is False:
        return remove_splash(cfg, ctx["project"], dec["ans"].get("reason", "logo-not-svg"), ctx)
    if mark and not mark.lower().endswith(".svg"):
        return remove_splash(cfg, ctx["project"], "logo-not-svg", ctx)
    card = dec["card"]
    cfg["splash"] = {"available": True, "concept": card["id"] if card else None}
    if card and card["id"] != "emblem":
        ctx["questions"].append("Splash concept '%s' is not generated by splash.py (it draws the SVG mark, then the name): it needs a hand-made SVG scene." % card["id"])
    if not mark:
        ctx["questions"].append("Set logo.mark to the SVG symbol file: until then the splash is only a scaffold placeholder (a rounded square with the initial).")


def h_languages(cfg: dict, dec: dict, ctx: dict) -> None:
    tok = dec["tokens"]
    if tok.get("langs"):
        cfg["langs"], cfg["source_lang"] = tok["langs"], tok.get("source_lang", tok["langs"][0])
    address = {k[len("address_"):]: v for k, v in field_values(dec).items() if k.startswith("address_")}
    if address:
        cfg["address"] = address
    elif dec["custom"]:
        ctx["questions"].append("Languages: custom answer to apply: " + dec["custom"])


def h_naming(cfg: dict, dec: dict, ctx: dict) -> None:
    f = field_values(dec)
    cfg["name"] = f.get("name") or cfg["name"]
    for key in ("tagline", "domain"):
        if f.get(key):
            cfg[key] = f[key]


def h_brand(cfg: dict, dec: dict, ctx: dict) -> None:
    f = field_values(dec)
    if f.get("statement"):
        cfg["brand"] = {"positioning": f["statement"], **({"details": dec["card"]["details"]} if dec["card"] and dec["card"].get("details") else {})}
        cfg["summary"] = cfg.get("summary") or f["statement"]


def h_scope(cfg: dict, dec: dict, ctx: dict) -> None:
    """product (modules), sections and the feature topics: planned sections are listed, not scaffolded (a part needs real content)."""
    planned = ctx["planned"]
    for card in dec["cards"]:
        m = card.get("maps") or {}
        if m.get("kind") == "module":
            cfg.setdefault("modules", [])
            cfg["modules"] = sorted(set(cfg["modules"]) | {m["value"]})
            planned.setdefault(m["value"], "references/modules/%s.md" % m["value"])
        elif m.get("kind") == "section" and m["value"] != "core":
            planned.setdefault(m["value"], m.get("reference", "references/sections.md"))
        elif m.get("kind") == "feature" and not card.get("tokens", {}).get("none"):
            ctx["features"].setdefault(dec["id"], []).append(m["value"] if dec["topic"]["kind"] == "multi" else card["id"])
            sec = FEATURE_SECTIONS.get(m["value"]) or (AUTH_REF if dec["id"] == "auth" else None)
            if sec:
                planned.setdefault(*sec)
    fv = field_values(dec)
    if dec["id"] == "ai" and dec["card"] and "ai" in ctx["features"]:
        ctx["features"]["ai"] = {"name": fv.get("name", ""), "may": fv.get("may", "")}
        if not fv.get("name"):
            ctx["questions"].append("AI assistant: no name given.")


def h_simple(cfg: dict, dec: dict, ctx: dict) -> None:
    tok = dec["tokens"]
    if dec["id"] == "motion" and tok.get("level"):
        cfg["motion_level"] = tok["level"]
    elif dec["id"] == "accessibility" and tok.get("target"):
        cfg["accessibility"] = {"target": tok["target"]}
    elif dec["id"] == "illustrations" and tok:
        cfg["illustrations"] = tok


HANDLERS = {"palette": h_palette, "typography": h_typography, "icons": h_icons, "style": h_style, "splash": h_splash}
BY_ID = {"languages": h_languages, "naming": h_naming, "brand": h_brand, "shape": h_shape, "product": h_scope, "sections": h_scope, "platforms": h_scope,
         "ai": h_scope, "comms": h_scope, "notifications": h_scope, "auth": h_scope, "motion": h_simple, "accessibility": h_simple, "illustrations": h_simple}


def apply_decision(cfg: dict, dec: dict, ctx: dict) -> None:
    if not dec["decided"] and not dec["card"] and not dec["custom"] and dec["ans"].get("available") is not False:
        ctx["questions"].append("%s: not decided." % dec["topic"]["title"])
        return
    handler = HANDLERS.get(dec["topic"]["kind"]) if dec["topic"]["kind"] != "choice" else None
    handler = handler or BY_ID.get(dec["id"])
    if handler and (dec["known"] or dec["topic"]["kind"] == "splash"):
        handler(cfg, dec, ctx)
    if dec["custom"] and handler is not h_palette:
        ctx["questions"].append("%s: custom answer, to be turned into decisions: %s" % (dec["topic"]["title"], dec["custom"]))
    if dec["card"]:
        empty = [f["label"] for f in dec["card"].get("fields", []) if not field_values(dec).get(f["key"], "").strip()]
        ctx["questions"] += ["%s: '%s' is empty." % (dec["topic"]["title"], label) for label in empty]


# --------------------------------------------------------------------------- notes
def card_line(card: dict) -> str:
    return "%s (`%s`)%s" % (card.get("title", card["id"]), card["id"], " [recommended]" if card.get("recommended") else "")


def decision_notes(n: int, dec: dict) -> list[str]:
    topic = dec["topic"]
    head = "### %d. %s%s" % (n, topic["title"], "" if dec["decided"] or dec["card"] else " (not decided)")
    lines = [head, ""]
    if dec["ans"].get("available") is False:
        lines.append("- Unavailable: %s (logo format: %s)." % (dec["ans"].get("reason"), dec["ans"].get("format", "?")))
    for c in dec["cards"]:
        lines.append("- Choice: " + card_line(c))
        if c.get("why"):
            lines.append("  - Why: " + c["why"])
        if c.get("summary") and topic["kind"] != "multi":
            lines.append("  - What: " + c["summary"])
    if topic["kind"] == "style" and dec["values"].get("accent_style"):
        lines.append("- Accent style: `%s` on: %s" % (dec["values"]["accent_style"], dec["values"].get("surfaces") or "(surfaces not named)"))
    if dec["values"].get("primitives"):
        lines.append("- Values at export: " + ", ".join("%s %s" % kv for kv in dec["values"]["primitives"].items()))
    if dec["custom"]:
        lines.append("- Custom answer: " + dec["custom"])
    if dec["notes"]:
        lines.append("- Notes: " + dec["notes"])
    return lines + [""]


def write_notes(project: Path, plan: dict, decs: list[dict], ctx: dict, info: dict) -> None:
    lines = ["# Plan decisions", "", "Written by `apply_plan.py` on %s. Every value below comes from the export or the proposals; nothing else was added." % info["when"], "",
             "- Export: `%s`, sha256 `%s`" % (info["export_name"], info["sha"]), "- Answers to proposals: `%s` (%s)" % (plan.get("generated_from"), info["match"]),
             "- Exported at: %s" % plan.get("exported_at", "?"), "- Decided: %d of %d topics" % (sum(d["decided"] or bool(d["card"]) for d in decs), len(decs)), "", "## Decisions", ""]
    for n, dec in enumerate(decs, 1):
        lines += decision_notes(n, dec)
    if ctx["derived"]:
        lines += ["## Derived values (flag them in Notes until confirmed)", ""] + ["- " + d for d in ctx["derived"]] + [""]
    corr = plan.get("input_corrections") or {}
    if corr:
        lines += ["## Corrections to what was understood from the files", ""] + ["- `%s`: %s" % kv for kv in corr.items()] + [""]
    if ctx["planned"]:
        lines += ["## Sections to write (not scaffolded)", ""] + ["- `%s`: read `%s`" % kv for kv in sorted(ctx["planned"].items())] + [""]
    qs = [q for q in ctx["questions"]] + ["%s (unanswered)" % q["question"] for q in plan.get("open_questions", []) if not q.get("answer")]
    answered = ["%s -> %s" % (q["question"], q["answer"]) for q in plan.get("open_questions", []) if q.get("answer")]
    lines += ["## Open questions", ""] + (["- " + q for q in dict.fromkeys(qs)] or ["- none"]) + [""]
    if answered:
        lines += ["## Answered questions", ""] + ["- " + a for a in answered] + [""]
    (project / "notes").mkdir(exist_ok=True)
    (project / "notes" / "plan.md").write_text("\n".join(lines), encoding="utf-8")


# --------------------------------------------------------------------------- project
def ensure_project(project: Path, plan: dict, decs: list[dict]) -> None:
    if (project / "ds.config.json").exists():
        return
    meta = plan["project"]
    tok = next((d["tokens"] for d in decs if d["id"] == "languages" and d["tokens"].get("langs")), {})
    langs = tok.get("langs") or meta["langs"]
    extras = []
    for d in decs:
        pal = (d["card"] or {}).get("palette")
        if pal and pal.get("theme") not in (None, "light", "dark"):
            extras.append("%s:%s" % (pal["theme"], pal.get("base", "light")))
    cmd = [sys.executable, str(SKILL / "scripts" / "new_project.py"), str(project), "--name", meta["name"], "--slug", meta["slug"], "--type", meta["type"],
           "--langs", ",".join(langs), "--source", tok.get("source_lang") or meta["source_lang"], "--themes", ",".join(["light", "dark", *extras])]
    done = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if done.returncode:
        sys.exit("new_project.py failed:\n" + done.stderr + done.stdout)
    print("created %s with new_project.py" % project)


def next_commands(project: Path, ctx: dict) -> list[str]:
    s = SKILL / "scripts"
    cmds = []
    if ctx.get("icons"):
        prefix, names = ctx["icons"]
        starter = [n for n in NP.STARTER_ICONS if n not in names] if prefix == "lucide" else []
        cmds.append('python "%s" get "%s" %s %s' % (s / "fetch_icons.py", project, prefix, " ".join(names + starter)))
        if prefix != "lucide":
            cmds.append("# the starter sections use these icon names, not all of which exist in %s: fetch each with an alias (fetch_icons.py search %s <word>, then name=alias): %s"
                        % (prefix, prefix, " ".join(NP.STARTER_ICONS)))
    return cmds + ['python "%s" "%s"' % (s / "palette_check.py", project), 'python "%s" "%s"' % (s / "build.py", project), 'node "%s" "%s"' % (s / "qa.mjs", project)]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("project")
    ap.add_argument("plan")
    ap.add_argument("--proposals")
    a = ap.parse_args()
    project, plan_path = Path(a.project).resolve(), Path(a.plan).resolve()
    raw = plan_path.read_bytes()
    plan = load_json(plan_path, "export")
    if plan.get("plan_version") != 1 or not isinstance(plan.get("answers"), dict) or "project" not in plan:
        sys.exit("%s is not a ds.plan.json (plan_version 1 with project and answers)" % plan_path.name)
    prop_path = Path(a.proposals) if a.proposals else project / "plan" / "proposals.json"
    proposals = load_json(prop_path, "proposals") if prop_path.exists() else None
    if proposals:
        errors = PS.validate(proposals)
        if errors:
            sys.exit("%s is not valid:\n  %s" % (prop_path, "\n  ".join(errors[:10])))
    match = ("matches the proposals" if PS.proposals_hash(proposals) == plan.get("generated_from") else "DIFFERS from the proposals file: check") if proposals else "proposals file not found"
    decs = decisions(plan, proposals)
    ensure_project(project, plan, decs)
    cfg = json.loads((project / "ds.config.json").read_text(encoding="utf-8"))
    ctx = {"questions": [], "derived": [], "planned": {}, "features": {}, "project": project}
    if not proposals:
        ctx["questions"].append("The proposals file was not found: only choice ids were recorded, no values were applied. Pass --proposals.")
    for dec in decs:
        apply_decision(cfg, dec, ctx)
    if not (project / "ds.config.json").exists():
        sys.exit("internal error: project not created")
    if ctx["features"]:
        cfg["features"] = ctx["features"]
    if ctx["planned"]:
        cfg["planned_sections"] = [{"id": k, "reference": v, "status": "to write"} for k, v in sorted(ctx["planned"].items())]
    info = {"when": datetime.date.today().isoformat(), "export_name": plan_path.name, "sha": hashlib.sha256(raw).hexdigest(), "match": match}
    cfg["plan"] = {"export_sha256": info["sha"], "generated_from": plan.get("generated_from"), "applied": info["when"]}
    (project / "ds.config.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_notes(project, plan, decs, ctx, info)
    print("updated %s and %s (%d open questions)" % (project / "ds.config.json", project / "notes" / "plan.md", len(ctx["questions"])))
    print("next:\n  " + "\n  ".join(next_commands(project, ctx)))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
