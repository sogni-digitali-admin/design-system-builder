"""Validation and hashing for the plan files, with no dependency (a small JSON Schema subset + the cross-checks).

Supported keywords: type, enum, const, required, properties, additionalProperties, items, minItems, maxItems,
minLength, minimum, maximum, pattern, $ref (#/$defs/...). Used by plan_page.py and apply_plan.py.
"""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "assets" / "plan" / "proposals.schema.json"
TYPES = {"object": dict, "array": list, "string": str, "boolean": bool, "number": (int, float), "integer": int}


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def proposals_hash(data: dict) -> str:
    """sha256 (first 16 hex) of the proposals as Claude wrote them: the key that ties an export to its page."""
    canon = json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return "sha256:" + hashlib.sha256(canon.encode("utf-8")).hexdigest()[:16]


def _type_ok(value, wanted) -> bool:
    for name in wanted if isinstance(wanted, list) else [wanted]:
        py = TYPES[name]
        if isinstance(value, py) and not (name in ("number", "integer") and isinstance(value, bool)):
            return True
    return False


def _resolve(ref: str, root: dict) -> dict:
    node = root
    for part in ref.lstrip("#/").split("/"):
        node = node[part]
    return node


def check(value, schema: dict, root: dict, path: str, errors: list[str]) -> None:
    if "$ref" in schema:
        check(value, {**_resolve(schema["$ref"], root), **{k: v for k, v in schema.items() if k != "$ref"}}, root, path, errors)
        return
    if "const" in schema and value != schema["const"]:
        errors.append("%s: must be %r" % (path, schema["const"]))
    if "enum" in schema and value not in schema["enum"]:
        errors.append("%s: %r is not one of %s" % (path, value, ", ".join(map(str, schema["enum"]))))
    if "type" in schema and not _type_ok(value, schema["type"]):
        errors.append("%s: expected %s" % (path, schema["type"]))
        return
    if isinstance(value, str):
        _check_string(value, schema, path, errors)
    elif isinstance(value, (int, float)) and not isinstance(value, bool):
        for key, bad in (("minimum", lambda v, m: v < m), ("maximum", lambda v, m: v > m)):
            if key in schema and bad(value, schema[key]):
                errors.append("%s: %s %s" % (path, key, schema[key]))
    elif isinstance(value, list):
        _check_array(value, schema, root, path, errors)
    elif isinstance(value, dict):
        _check_object(value, schema, root, path, errors)


def _check_string(value: str, schema: dict, path: str, errors: list[str]) -> None:
    if len(value) < schema.get("minLength", 0):
        errors.append("%s: must not be empty" % path)
    if "pattern" in schema and not re.search(schema["pattern"], value):
        errors.append("%s: %r does not match %s" % (path, value, schema["pattern"]))


def _check_array(value: list, schema: dict, root: dict, path: str, errors: list[str]) -> None:
    if len(value) < schema.get("minItems", 0):
        errors.append("%s: needs at least %d item(s)" % (path, schema["minItems"]))
    if len(value) > schema.get("maxItems", 10 ** 9):
        errors.append("%s: at most %d item(s)" % (path, schema["maxItems"]))
    for i, item in enumerate(value):
        if "items" in schema:
            check(item, schema["items"], root, "%s[%d]" % (path, i), errors)


def _check_object(value: dict, schema: dict, root: dict, path: str, errors: list[str]) -> None:
    props = schema.get("properties", {})
    for key in schema.get("required", []):
        if key not in value:
            errors.append("%s: missing '%s'" % (path, key))
    extra = schema.get("additionalProperties", True)
    for key, item in value.items():
        if key in props:
            check(item, props[key], root, "%s.%s" % (path, key), errors)
        elif extra is False:
            errors.append("%s: unknown key '%s'" % (path, key))
        elif isinstance(extra, dict):
            check(item, extra, root, "%s.%s" % (path, key), errors)


KIND_NEEDS = {"palette": "palette", "typography": "typography", "style": "style", "icons": "icons"}


def cross_checks(data: dict) -> list[str]:
    """What a schema cannot say: unique ids, one recommended card, known input ids, resolvable colour roles."""
    errors: list[str] = []
    inputs = {i["id"] for i in data.get("inputs", [])}
    if len(inputs) != len(data.get("inputs", [])):
        errors.append("inputs: two inputs share an id")
    seen: set[str] = set()
    for t in data.get("topics", []):
        where = "topic '%s'" % t.get("id")
        if t.get("id") in seen:
            errors.append("%s: id used twice" % where)
        seen.add(t.get("id"))
        cards = t.get("proposals", [])
        if len({c.get("id") for c in cards}) != len(cards):
            errors.append("%s: two cards share an id" % where)
        if t.get("kind") != "multi" and sum(bool(c.get("recommended")) for c in cards) != 1:
            errors.append("%s: exactly one card must be recommended" % where)
        for c in cards:
            errors += _card_checks(t, c, where, inputs)
    return errors


def _card_checks(topic: dict, card: dict, where: str, inputs: set[str]) -> list[str]:
    out = ["%s, card '%s': unknown input '%s'" % (where, card.get("id"), i) for i in card.get("input_ids", []) if i not in inputs]
    need = KIND_NEEDS.get(topic.get("kind"))
    wants_data = need and not (topic.get("id") == "extra_themes" and "extra_theme" not in card)
    if wants_data and need not in card and not card.get("tokens", {}).get("none"):
        out.append("%s, card '%s': a %s topic needs a '%s' object" % (where, card.get("id"), topic["kind"], need))
    pal = card.get("palette")
    if pal:
        names = {p["name"] for p in pal["primitives"]}
        out += ["%s, card '%s': role %s = %r is neither a primitive nor a #hex" % (where, card.get("id"), k, v)
                for k, v in pal["roles"].items() if v not in names and not re.fullmatch(r"#[0-9A-Fa-f]{6}", v)]
        out += ["%s, card '%s': primitive '%s' cites unknown input '%s'" % (where, card.get("id"), p["name"], p["input_id"])
                for p in pal["primitives"] if p.get("input_id") and p["input_id"] not in inputs]
    return out


def validate(data: dict) -> list[str]:
    schema = load_schema()
    errors: list[str] = []
    check(data, schema, schema, "$", errors)
    return errors or cross_checks(data)
