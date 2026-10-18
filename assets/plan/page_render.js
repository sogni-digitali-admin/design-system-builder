// ---------------------------------------------------------------- rendering
let LIVE = [];
let timer = 0;
const statusLine = (msg) => { const s = $("#status"); if (s) s.textContent = msg; };

function changed() { saveDraft(); clearTimeout(timer); timer = setTimeout(refresh, 120); }
function pick(t, cid) { const a = S.a[t.id]; if (t.kind === "multi") return; a.choice_id = cid; a.other = false; a.decided = true; changed(); }

function detailsView(c) {
  if (!c.details) return null;
  const rows = Object.entries(c.details).flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, Array.isArray(v) ? h("ul", {}, v.map((x) => h("li", {}, x))) : v)]);
  return h("dl", { class: "det" }, rows);
}

function fieldsView(t, c) {
  const vals = cardVals(t.id, c.id).fields;
  return (c.fields || []).map((f) => {
    const type = f.type || "text", id = "f-" + t.id + "-" + c.id + "-" + f.key;
    const ctl = type === "textarea" ? h("textarea", { id }, "") : type === "select" ? h("select", { id }, (f.options || []).map((o) => h("option", { value: o }, o))) : h("input", { id, type: "text" });
    ctl.value = vals[f.key] === undefined ? f.value : vals[f.key];
    ctl.addEventListener("input", () => { vals[f.key] = ctl.value; pick(t, c.id); changed(); });
    return h("label", { class: "field", for: id }, h("span", {}, f.label), ctl, f.hint ? h("small", { class: "muted" }, f.hint) : null);
  });
}

function tokensView(c) {
  const flat = (o, p) => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? flat(v, p + k + ".") : [p + k + ": " + (Array.isArray(v) ? v.join(", ") : v)]));
  const items = c.tokens ? flat(c.tokens, "").filter((x) => !x.startsWith("none")) : [];
  return items.length ? h("div", { class: "names" }, items.map((x) => h("span", {}, x))) : null;
}

function paletteView(t, c) {
  const vals = cardVals(t.id, c.id), prim = vals.primitives, body = h("tbody"), badge = h("span", { class: "chip" });
  const rows = c.palette.primitives.map((p) => {
    const col = h("input", { type: "color", value: prim[p.name], "aria-label": p.name });
    const txt = h("input", { type: "text", value: prim[p.name], maxlength: 7, "aria-label": p.name + " hex" });
    const set = (hex, from) => { prim[p.name] = hex.toUpperCase(); if (from !== col) col.value = hex; if (from !== txt) txt.value = hex.toUpperCase(); pick(t, c.id); changed(); refresh(); };
    col.addEventListener("input", () => set(col.value, col));
    txt.addEventListener("input", () => { if (validHex(txt.value)) set(txt.value, txt); });
    return h("div", { class: "sw-row" }, col, txt, h("div", {}, h("b", {}, p.name), " ", h("span", { class: "chip", title: p.input_id || null }, tx("src_" + p.source))));
  });
  const pv = h("div", { class: "pv-pal" }, h("div", { class: "c" }, "Aa"), h("div", { class: "c" }, h("span", { class: "b" }, "Button"), " ", h("span", { class: "b" }, "Accent")));
  const table = h("table", { class: "ct" }, h("caption", { class: "sr" }, tx("contrast_title")), body);
  LIVE.push(() => paletteUpdate(c, prim, body, badge, pv));
  return h("div", { class: "sw" }, rows, pv, h("div", {}, h("strong", { class: "small" }, tx("contrast_title") + " "), badge), table);
}

function paletteUpdate(c, prim, body, badge, pv) {
  const checks = paletteChecks(c, prim), r = c.palette.roles, hex = (k) => prim[r[k]] || r[k];
  body.replaceChildren(...checks.map((k) => h("tr", {}, h("td", {}, h("span", { class: "aa", style: "background:" + k.bg + ";color:" + k.fg }, "Aa")),
    h("td", {}, k.label), h("td", {}, k.ratio.toFixed(2) + ":1"), h("td", { class: k.ok ? "pass" : "fail" }, tx(k.ok ? "pass" : "fail") + " (" + k.need + ")"))));
  badge.textContent = tx("ok_count", { n: checks.filter((k) => k.ok).length, m: checks.length });
  pv.style.background = hex("bg"); pv.style.color = hex("text");
  const [a, b] = pv.children;
  a.style.background = hex("surface"); a.style.border = "1px solid " + hex("border");
  const [btn, acc] = b.children;
  btn.style.cssText = "background:" + hex("primary") + ";color:" + hex("on-primary");
  acc.style.cssText = "background:" + hex("accent") + ";color:" + (r["on-accent"] ? hex("on-accent") : hex("text"));
}

function typoView(t, c) {
  const f = cardVals(t.id, c.id).fonts, ty = c.typography;
  const stack = (k, fb) => '"' + (f[k] || "").replace(/"/g, "") + '", ' + (fb || "system-ui, sans-serif");
  const title = h("h4", {}, ty.sample_title || "Aa"), body = h("p", {}, ty.sample_body || ""), acc = h("p", { class: "acc" }, "Bon voyage");
  const ins = ["heading", "body", "accent"].filter((k) => k !== "accent" || ty.accent).map((k) => {
    const inp = h("input", { type: "text", value: f[k], id: "ft-" + t.id + "-" + c.id + "-" + k });
    inp.addEventListener("input", () => { f[k] = inp.value; pick(t, c.id); changed(); refresh(); });
    return h("label", { class: "field", for: inp.id }, h("span", {}, tx("font_" + k)), inp);
  });
  LIVE.push(() => {
    title.style.fontFamily = stack("heading", ty.fallback_heading); body.style.fontFamily = stack("body", ty.fallback_body);
    acc.style.fontFamily = stack("accent", ty.fallback_accent);
  });
  return h("div", { class: "typo" }, ins, title, body, ty.accent ? acc : null, h("p", { class: "small muted" }, tx("licence") + " : " + ty.licence + ". " + tx("font_note")));
}

function styleChecks(s) {
  const surf = composite(s.surface, s.surface_alpha === undefined ? 1 : s.surface_alpha, s.bg_worst);
  return { solid: surf, text: ratio(s.ink, surf), button: ratio(s.btn_fg, s.btn_bg) };
}

function styleView(t, c) {
  const s = c.style, k = styleChecks(s), css = { "--r": s.radius.md, "--b": s.border, "--sh": s.shadow, "--blur": s.blur || "0px", "--ink": s.ink, "--surf": s.surface,
    "--alpha": s.surface_alpha === undefined ? 1 : s.surface_alpha, "--bgw": s.bg_worst, "--btn": s.btn_bg, "--btnfg": s.btn_fg, "--solid": k.solid };
  const style = Object.entries(css).map(([a, b]) => a + ":" + b).join(";");
  const line = (label, r) => h("span", {}, label + " " + r.toFixed(2) + ":1 ", h("b", { class: r >= 4.5 ? "pass" : "fail" }, tx(r >= 4.5 ? "pass" : "fail")));
  return h("div", {}, h("div", { class: "pv pv-" + s.family, style }, h("div", { class: "pv-card" }, h("strong", {}, c.title),
    h("span", { class: "t" }, c.summary), h("div", { class: "pv-row" }, h("button", { type: "button", class: "pv-btn" }, "Button"), h("span", { class: "pv-chip" }, "Chip")))),
  h("div", { class: "checks" }, line(tx("st_text_surface"), k.text), line(tx("st_button"), k.button),
    h("span", { class: "muted" }, "radius " + s.radius.sm + " / " + s.radius.md + " / " + s.radius.lg + " | border " + s.border + " | " + s.density + (s.blur ? " | blur " + s.blur : "")),
    s.blur ? h("span", { class: "muted" }, tx("glass_rule")) : null));
}

function iconsView(t, c) {
  const v = cardVals(t.id, c.id), ic = c.icons, ta = h("textarea", { "aria-label": tx("icons_names") }), cmd = h("pre", { class: "cmd" });
  ta.value = v.icon_names;
  const mo = h("input", { type: "checkbox", checked: !!v.motion, id: "mo-" + t.id + "-" + c.id });
  const names = () => v.icon_names.split(/[\s,]+/).filter(Boolean);
  ta.addEventListener("input", () => { v.icon_names = ta.value; pick(t, c.id); changed(); refresh(); });
  mo.addEventListener("change", () => { v.motion = mo.checked; pick(t, c.id); changed(); });
  LIVE.push(() => { cmd.textContent = "python scripts/fetch_icons.py get <project_dir> " + ic.set + " " + names().join(" "); });
  return h("div", { class: "sw" }, h("div", { class: "names" }, h("span", {}, ic.set), h("span", {}, ic.licence), h("span", {}, ic.style)),
    h("label", { class: "field" }, h("span", {}, tx("icons_names")), ta), h("label", { class: "small" }, mo, " " + tx("icons_motion")), cmd);
}

function extrasView(t, c) {
  const parts = [fieldsView(t, c), c.palette && paletteView(t, c), c.typography && typoView(t, c), c.style && styleView(t, c), c.icons && iconsView(t, c), tokensView(c)];
  return parts.flat().filter(Boolean);
}

function cardEl(t, c) {
  const multi = t.kind === "multi", id = "i-" + t.id + "-" + c.id;
  const a = S.a[t.id], on = multi ? a.choice_ids.includes(c.id) : a.choice_id === c.id && !a.other;
  const input = h("input", { type: multi ? "checkbox" : "radio", name: "t-" + t.id, id, checked: on, disabled: !!c.locked, "aria-describedby": id + "-s" });
  input.addEventListener("change", () => {
    if (multi) { a.choice_ids = input.checked ? [...new Set([...a.choice_ids, c.id])] : a.choice_ids.filter((x) => x !== c.id); a.decided = true; changed(); } else pick(t, c.id);
  });
  const el = h("div", { class: "pc", "data-card": c.id }, input,
    h("h3", {}, h("label", { for: id }, c.title), c.recommended && !c.locked ? h("span", { class: "badge" }, tx("recommended")) : null, c.locked ? h("span", { class: "chip" }, tx("always")) : null,
      c.maps && c.maps.kind === "module" ? h("span", { class: "chip" }, c.maps.value) : null),
    h("p", { id: id + "-s" }, c.summary), c.why ? h("p", { class: "fit" }, c.why) : null, detailsView(c),
    c.input_ids && c.input_ids.length ? h("p", { class: "small muted" }, tx("from_inputs") + " " + c.input_ids.join(", ")) : null, ...extrasView(t, c));
  el.addEventListener("click", (e) => { if (!e.target.closest("input,select,textarea,button,a,label,summary")) input.click(); });
  el.addEventListener("focusin", (e) => { if (!multi && e.target !== input && e.target.matches("input,select,textarea")) pick(t, c.id); });
  return el;
}

function otherBlock(t) {
  const a = S.a[t.id], multi = t.kind === "multi", id = "o-" + t.id;
  const ta = h("textarea", { id: id + "-t", placeholder: tx("other_ph"), "aria-label": tx(multi ? "other_multi" : "other_title") });
  ta.value = a.custom;
  const radio = multi ? null : h("input", { type: "radio", name: "t-" + t.id, id, checked: a.other, "aria-label": tx("other_title") });
  if (radio) radio.addEventListener("change", () => { a.other = true; a.decided = true; changed(); });
  ta.addEventListener("input", () => { a.custom = ta.value; if (!multi) { a.other = true; if (radio) radio.checked = true; } a.decided = true; changed(); });
  return h("div", { class: "other" }, h("div", { class: "pc" + (multi ? "" : " other-pc"), style: multi ? "padding-left:16px" : null }, radio, h("h3", {}, tx(multi ? "other_multi" : "other_title")), ta));
}

function styleExtra(t) {
  const a = S.a[t.id], sel = h("select", { id: "acc-" + t.id }, h("option", { value: "" }, tx("accent_none")), t.proposals.map((c) => h("option", { value: c.id }, c.title)));
  const sf = h("input", { type: "text", id: "sf-" + t.id, placeholder: tx("surfaces_ph") });
  sel.value = a.accent_style; sf.value = a.surfaces;
  sel.addEventListener("change", () => { a.accent_style = sel.value; changed(); });
  sf.addEventListener("input", () => { a.surfaces = sf.value; changed(); });
  return h("div", { class: "notes" }, h("label", { class: "field", for: sel.id }, h("span", {}, tx("accent_style")), sel), h("label", { class: "field", for: sf.id }, h("span", {}, tx("surfaces")), sf));
}

function topicEl(t, n) {
  const a = S.a[t.id], multi = t.kind === "multi";
  const decide = h("button", { type: "button", class: "btn", "data-decide": t.id, on: { click: () => { a.decided = !a.decided; changed(); refresh(); } } });
  const head = h("header", {}, h("span", { class: "num" }, n), h("h2", { id: "h-" + t.id }, t.title), h("span", { class: "state", "data-state": t.id }));
  const sec = h("section", { class: "topic", id: "t-" + t.id, "aria-labelledby": "h-" + t.id }, head, h("p", { class: "why" }, t.why));
  if (isLocked(t)) sec.append(h("div", { class: "lock", role: "note" }, tx("locked_msg", { format: D.splashLock })));
  else {
    const main = t.proposals.filter((c) => c.shortlist !== false), rest = t.proposals.filter((c) => c.shortlist === false);
    sec.append(h("div", { class: "cards", role: multi ? "group" : "radiogroup", "aria-labelledby": "h-" + t.id }, main.map((c) => cardEl(t, c))));
    if (rest.length) sec.append(h("details", { class: "more" }, h("summary", {}, tx("more_options", { n: rest.length })), h("div", { class: "cards", style: "margin-top:10px" }, rest.map((c) => cardEl(t, c)))));
    if (t.kind === "style") sec.append(styleExtra(t));
    if (t.allow_other !== false) sec.append(otherBlock(t));
  }
  if (t.notes !== false) sec.append(notesBlock(t));
  sec.append(h("div", { class: "foot" }, isLocked(t) ? null : decide));
  return sec;
}

function notesBlock(t) {
  const ta = h("textarea", { id: "n-" + t.id, placeholder: tx("notes_ph") });
  ta.value = S.a[t.id].notes;
  ta.addEventListener("input", () => { S.a[t.id].notes = ta.value; changed(); });
  return h("label", { class: "field notes", for: ta.id }, h("span", {}, tx("notes_label")), ta);
}
