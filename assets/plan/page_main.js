// ---------------------------------------------------------------- inputs, summary, export, boot
function inputEl(i) {
  const ta = h("textarea", { id: "c-" + i.id, "aria-label": tx("inputs_corr") + " " + i.file, placeholder: tx("inputs_corr") });
  ta.value = S.corr[i.id] || "";
  ta.addEventListener("input", () => { S.corr[i.id] = ta.value; changed(); });
  const vec = i.kind === "logo" && i.vector !== undefined ? h("span", { class: "chip" }, tx(i.vector ? "vector_yes" : "vector_no")) : null;
  const list = (title, arr) => (arr && arr.length ? [h("strong", { class: "small" }, title), h("ul", {}, arr.map((x) => h("li", {}, x)))] : []);
  return h("article", { class: "in-card" }, i.preview ? h("img", { src: i.preview, alt: "", loading: "lazy" }) : null,
    h("h3", {}, i.file), h("div", {}, h("span", { class: "chip" }, tx("kind_" + i.kind)), " ", vec), h("p", {}, i.summary),
    i.colours && i.colours.length ? h("div", { class: "dots" }, i.colours.map((c) => h("span", {}, h("i", { style: "background:" + c.hex }), c.hex + (c.share ? " " + c.share + "%" : "")))) : null,
    i.typefaces && i.typefaces.length ? h("p", { class: "small" }, tx("typefaces") + " : " + i.typefaces.join("; ")) : null,
    ...list(tx("implications"), i.implications), ...list(tx("uncertainties"), i.uncertainties),
    h("label", { class: "field", for: ta.id }, h("span", {}, tx("inputs_corr")), ta));
}

function inputsPanel() {
  if (!(P.inputs || []).length) return null;
  return h("section", { class: "panel", id: "inputs", "aria-labelledby": "h-inputs" }, h("h2", { id: "h-inputs" }, tx("inputs_title")),
    h("p", { class: "why" }, tx("inputs_intro")), h("div", { class: "inputs" }, P.inputs.map(inputEl)));
}

function questionsPanel() {
  const qs = P.open_questions || [];
  if (!qs.length) return null;
  return h("section", { class: "panel", id: "questions", "aria-labelledby": "h-q" }, h("h2", { id: "h-q" }, tx("questions_title")),
    qs.map((q, i) => { const ta = h("textarea", { id: "q-" + i, placeholder: tx("answer_ph") }); ta.value = S.q[i] || "";
      ta.addEventListener("input", () => { S.q[i] = ta.value; changed(); }); return h("label", { class: "field", style: "margin-top:12px", for: ta.id }, h("span", {}, q), ta); }));
}

function exportPanel() {
  const out = h("textarea", { id: "out-json", class: "out", readOnly: true, "aria-label": tx("json_label"), spellcheck: "false" });
  const md = h("textarea", { id: "out-md", class: "out", readOnly: true, "aria-label": tx("md_label"), style: "min-height:120px" });
  const imp = h("textarea", { id: "imp", class: "out", placeholder: tx("import_ph"), "aria-label": tx("import_title"), style: "min-height:90px" });
  return h("section", { class: "panel", id: "export", "aria-labelledby": "h-export" }, h("h2", { id: "h-export" }, tx("summary_title")), h("ul", { class: "sum", id: "sum" }),
    h("h2", { style: "margin-top:28px;font-size:1.15rem" }, tx("export_title")), h("p", { class: "why" }, tx("export_intro")),
    h("div", { class: "foot" }, h("button", { type: "button", class: "btn primary", on: { click: downloadPlan } }, tx("dl")), h("button", { type: "button", class: "btn", on: { click: copyPlan } }, tx("copy"))),
    h("p", { class: "status", id: "status", role: "status" }), h("label", { class: "field", for: "out-json" }, h("span", {}, tx("json_label")), out),
    h("label", { class: "field", for: "out-md", style: "margin-top:12px" }, h("span", {}, tx("md_label")), md),
    h("h2", { style: "margin-top:28px;font-size:1.15rem" }, tx("import_title")), h("p", { class: "why" }, tx("import_intro")), imp,
    h("div", { class: "foot" }, h("button", { type: "button", class: "btn", on: { click: importPlan } }, tx("import_btn"))));
}

function downloadPlan() {
  try {
    const url = URL.createObjectURL(new Blob([$("#out-json").value], { type: "application/json" }));
    const a = h("a", { href: url, download: "ds.plan.json" });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
    statusLine(tx("dl_started"));
  } catch (e) { statusLine(tx("copy_failed")); }
}

async function copyPlan() {
  const ta = $("#out-json");
  try { await navigator.clipboard.writeText(ta.value); statusLine(tx("copied")); return; } catch (e) { /* fall back to selection */ }
  ta.focus(); ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
  statusLine(tx(ok ? "copied" : "copy_failed"));
}

function importPlan() {
  try {
    const same = applyImport(JSON.parse($("#imp").value));
    saveDraft(); build(); statusLine(tx(same ? "import_ok" : "import_other"));
    document.getElementById("export").scrollIntoView();
  } catch (e) { statusLine(tx("import_bad")); }
}

function tocEl() {
  const nav = h("nav", { class: "toc", "aria-label": tx("toc") });
  let last = null;
  if ((P.inputs || []).length) nav.append(h("a", { href: "#inputs" }, h("span", { class: "dot" }), tx("inputs_title")));
  topics.forEach((t, n) => {
    if (t.group && t.group !== last) { nav.append(h("h2", {}, t.group)); last = t.group; }
    nav.append(h("a", { href: "#t-" + t.id, "data-toc": t.id }, h("span", { class: "dot" }), (n + 1) + ". " + t.title));
  });
  return nav;
}

function barEl() {
  const sel = h("select", { "aria-label": tx("jump"), on: { change: (e) => { if (e.target.value) document.getElementById(e.target.value).scrollIntoView(); } } },
    h("option", { value: "" }, tx("jump")), topics.map((t, n) => h("option", { value: "t-" + t.id }, (n + 1) + ". " + t.title)));
  return h("div", { class: "bar" }, h("div", { class: "bar-in" }, h("div", { class: "bar-row" }, h("strong", {}, P.project.name),
    h("span", { id: "prog", "aria-live": "polite" }), h("div", { class: "meter", "aria-hidden": "true" }, h("i", { id: "meter" })),
    h("button", { type: "button", class: "btn", on: { click: acceptAll } }, tx("accept_reco")),
    h("a", { class: "btn primary", href: "#export" }, tx("goto_export"))), h("label", { class: "jump" }, h("span", { class: "sr" }, tx("jump")), sel)));
}

function acceptAll() {
  topics.forEach((t) => {
    const a = S.a[t.id];
    if (a.decided || isLocked(t)) return;
    if (t.kind !== "multi") a.choice_id = (t.proposals.find((c) => c.recommended) || t.proposals[0]).id;
    a.other = false; a.decided = true;
  });
  saveDraft(); build();
}

function refresh() {
  topics.forEach((t) => {
    const a = S.a[t.id], done = a.decided || isLocked(t), el = document.getElementById("t-" + t.id);
    if (!el) return;
    el.classList.toggle("is-decided", done);
    $("[data-state='" + t.id + "']", el).textContent = tx(done ? "st_done" : "st_open");
    const d = $("[data-decide]", el);
    if (d) d.textContent = tx(a.decided ? "reopen" : "mark_decided");
    el.querySelectorAll("[data-card]").forEach((c) => {
      const id = c.getAttribute("data-card");
      c.classList.toggle("is-sel", t.kind === "multi" ? a.choice_ids.includes(id) : a.choice_id === id && !a.other);
    });
    const link = $("[data-toc='" + t.id + "']");
    if (link) link.classList.toggle("done", done);
  });
  const n = decidedCount();
  $("#prog").textContent = tx("progress", { n, m: topics.length });
  $("#meter").style.width = Math.round((100 * n) / topics.length) + "%";
  LIVE.forEach((fn) => fn());
  $("#sum").replaceChildren(...topics.map((t, i) => h("li", {}, h("a", { href: "#t-" + t.id }, (i + 1) + ". " + t.title), h("span", {}, titleOf(t)))));
  $("#out-json").value = JSON.stringify(buildExport(), null, 2);
  $("#out-md").value = buildMarkdown();
}

function build() {
  LIVE = [];
  const app = $("#app"), kids = [];
  let last = null;
  topics.forEach((t, n) => {
    if (t.group && t.group !== last) { kids.push(h("p", { class: "grp" }, t.group)); last = t.group; }
    kids.push(topicEl(t, n + 1));
  });
  const hero = h("header", { class: "hero" }, h("h1", {}, tx("title", { name: P.project.name })), h("p", { class: "muted" }, P.project.intro || tx("intro")));
  const old = $(".bar");
  if (old) old.remove();
  document.body.prepend(barEl());
  app.replaceChildren(hero, tocEl(), h("main", { id: "main" }, inputsPanel(), kids, questionsPanel(), exportPanel()));
  refresh();
}

initState();
loadDraft();
build();
