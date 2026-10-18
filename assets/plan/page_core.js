"use strict";
const D = JSON.parse(document.getElementById("plan-data").textContent);
const P = D.proposals, T = D.ui;
const tx = (k, p) => Object.entries(p || {}).reduce((s, [a, b]) => s.split("{" + a + "}").join(b), T[k] === undefined ? k : T[k]);
const $ = (sel, root) => (root || document).querySelector(sel);

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k === "on") for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
    else if (k === "value" || k === "checked" || k === "disabled" || k === "readOnly") el[k] = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
}

// ---------------------------------------------------------------- colour maths (WCAG 2.x)
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = (hex) => { const [r, g, b] = rgb(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const toHex = (v) => "#" + v.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("").toUpperCase();
const composite = (fg, alpha, bg) => toHex(rgb(bg).map((b, i) => b + (rgb(fg)[i] - b) * alpha));
const validHex = (s) => /^#[0-9a-fA-F]{6}$/.test(s);

const PAIRS = [["text", "bg", 4.5], ["text", "surface", 4.5], ["text-muted", "bg", 4.5], ["primary", "bg", 4.5],
  ["on-primary", "primary", 4.5], ["on-accent", "accent", 4.5], ["focus", "bg", 3]];

function paletteChecks(card, prim) {
  const roles = card.palette.roles, hex = (v) => prim[v] || v;
  return PAIRS.filter(([f, b]) => roles[f] && roles[b]).map(([f, b, need]) => {
    const fg = hex(roles[f]), bg = hex(roles[b]), r = ratio(fg, bg);
    return { fg, bg, need, ratio: r, ok: r >= need, label: f + " / " + b };
  });
}

// ---------------------------------------------------------------- state
const S = { a: {}, v: {}, corr: {}, q: {} };
const topics = P.topics;
const topicOf = (id) => topics.find((t) => t.id === id);
const cardOf = (t, id) => t.proposals.find((c) => c.id === id);
const isLocked = (t) => t.kind === "splash" && !!D.splashLock;

function cardVals(tid, cid) {
  S.v[tid] = S.v[tid] || {};
  if (!S.v[tid][cid]) {
    const c = cardOf(topicOf(tid), cid), v = { fields: {} };
    (c.fields || []).forEach((f) => { v.fields[f.key] = f.value; });
    if (c.palette) v.primitives = Object.fromEntries(c.palette.primitives.map((p) => [p.name, p.hex]));
    if (c.typography) v.fonts = { heading: c.typography.heading, body: c.typography.body, accent: c.typography.accent || "" };
    if (c.icons) { v.icon_names = c.icons.names.join(", "); v.motion = !!c.icons.motion; }
    S.v[tid][cid] = v;
  }
  return S.v[tid][cid];
}

function initState() {
  for (const t of topics) {
    const a = { choice_id: null, choice_ids: [], custom: "", notes: "", other: false, decided: false, accent_style: "", surfaces: "" };
    if (t.kind === "multi") a.choice_ids = t.proposals.filter((c) => c.recommended || c.locked).map((c) => c.id);
    if (t.preselected) { a.choice_id = t.preselected; a.decided = true; }
    if (isLocked(t)) a.decided = true;
    S.a[t.id] = a;
  }
  (P.inputs || []).forEach((i) => { S.corr[i.id] = ""; });
  (P.open_questions || []).forEach((_, i) => { S.q[i] = ""; });
}

const draftKey = () => "dsplan:" + D.hash;
function saveDraft() { try { localStorage.setItem(draftKey(), JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
function loadDraft() {
  try {
    const raw = localStorage.getItem(draftKey());
    if (raw) Object.assign(S, JSON.parse(raw));
  } catch (e) { /* no draft */ }
}

// ---------------------------------------------------------------- export
function chosenValues(t, a) {
  if (t.kind === "multi" || a.other || !a.choice_id) return {};
  const v = JSON.parse(JSON.stringify(cardVals(t.id, a.choice_id)));
  if (v.icon_names !== undefined) v.icon_names = v.icon_names.split(/[\s,]+/).filter(Boolean);
  if (t.kind === "style") { v.accent_style = a.accent_style || null; v.surfaces = a.surfaces; }
  return v;
}

function answerOf(t) {
  const a = S.a[t.id];
  const out = { choice_id: t.kind === "multi" || a.other ? null : a.choice_id, custom: a.other || a.custom ? a.custom : "", notes: a.notes,
    values: chosenValues(t, a), decided: a.decided || isLocked(t) };
  if (t.kind === "multi") out.choice_ids = a.choice_ids.slice();
  if (isLocked(t)) Object.assign(out, { choice_id: null, available: false, reason: "logo-not-svg", format: D.splashLock });
  return out;
}

function buildExport() {
  const answers = {};
  topics.forEach((t) => { answers[t.id] = answerOf(t); });
  return { plan_version: 1, project: P.project, generated_from: D.hash, answers, input_corrections: Object.fromEntries(Object.entries(S.corr).filter(([, v]) => v.trim())),
    open_questions: (P.open_questions || []).map((q, i) => ({ question: q, answer: S.q[i] || "" })), exported_at: new Date().toISOString() };
}

function titleOf(t) {
  const a = S.a[t.id];
  if (isLocked(t)) return tx("locked_short", { format: D.splashLock });
  if (t.kind === "multi") return t.proposals.filter((c) => a.choice_ids.includes(c.id)).map((c) => c.title).join(", ") || tx("none_chosen");
  if (a.other) return tx("other_prefix") + (a.custom.trim() || "...");
  const c = a.choice_id && cardOf(t, a.choice_id);
  return c ? c.title : tx("not_decided");
}

function buildMarkdown() {
  const lines = ["# " + tx("md_title", { name: P.project.name }), ""];
  topics.forEach((t) => {
    const a = S.a[t.id];
    lines.push("- **" + t.title + "** : " + titleOf(t) + (a.decided || isLocked(t) ? "" : " (" + tx("not_decided") + ")") + (a.notes.trim() ? " | " + a.notes.trim().replace(/\n+/g, " ") : ""));
  });
  const corr = Object.entries(S.corr).filter(([, v]) => v.trim());
  if (corr.length) lines.push("", "## " + tx("inputs_title"), ...corr.map(([k, v]) => "- " + k + " : " + v.replace(/\n+/g, " ")));
  const qs = (P.open_questions || []).map((q, i) => "- " + q + (S.q[i] ? " -> " + S.q[i] : ""));
  if (qs.length) lines.push("", "## " + tx("questions_title"), ...qs);
  return lines.join("\n");
}

// ---------------------------------------------------------------- import
function applyValues(t, a, ans) {
  const id = ans.choice_id;
  if (!id || !cardOf(t, id) || !ans.values) return;
  const v = cardVals(t.id, id), src = ans.values;
  if (src.primitives && v.primitives) Object.keys(v.primitives).forEach((k) => { if (validHex(src.primitives[k] || "")) v.primitives[k] = src.primitives[k]; });
  if (src.fonts && v.fonts) Object.assign(v.fonts, src.fonts);
  if (src.fields) Object.assign(v.fields, src.fields);
  if (Array.isArray(src.icon_names)) v.icon_names = src.icon_names.join(", ");
  if (src.motion !== undefined) v.motion = !!src.motion;
  if (t.kind === "style") { a.accent_style = src.accent_style || ""; a.surfaces = src.surfaces || ""; }
}

function applyImport(obj) {
  if (!obj || obj.plan_version !== 1 || typeof obj.answers !== "object") throw new Error("format");
  topics.forEach((t) => {
    const ans = obj.answers[t.id], a = S.a[t.id];
    if (!ans) return;
    a.notes = ans.notes || ""; a.custom = ans.custom || ""; a.decided = !!ans.decided;
    a.other = !ans.choice_id && t.kind !== "multi" && !!ans.custom;
    if (t.kind === "multi") a.choice_ids = (ans.choice_ids || []).filter((id) => cardOf(t, id));
    else a.choice_id = ans.choice_id && cardOf(t, ans.choice_id) ? ans.choice_id : null;
    applyValues(t, a, ans);
  });
  Object.keys(S.corr).forEach((k) => { S.corr[k] = (obj.input_corrections || {})[k] || ""; });
  (obj.open_questions || []).forEach((q, i) => { if (i in S.q) S.q[i] = q.answer || ""; });
  return obj.generated_from === D.hash;
}

const decidedCount = () => topics.filter((t) => S.a[t.id].decided || isLocked(t)).length;
