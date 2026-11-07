/* Page behaviour shared by every design system: theme toggle, copy buttons, toast, active sidebar link.
   Sections add their own behaviour in parts/<part>.js. */
(function () {
  "use strict";
  var DS = window.DS, root = document.documentElement;

  /* toast: one short message at a time */
  var toast = document.getElementById("toast"), toastTimer = 0;
  window.dsToast = function (text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 1600);
  };

  /* theme: a light/dark toggle, or, with more themes in ds.config.json, a picker (Auto + each theme) */
  var THEMES = DS.themes || ["light", "dark"], toggle = document.getElementById("theme-toggle");
  var picker = document.getElementById("theme-picker"), COMPACT = "(max-width: 720px)";
  function systemTheme() { return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; }
  function savedTheme() {
    try { var v = localStorage.getItem(DS.slug + "-theme"); return THEMES.indexOf(v) >= 0 ? v : null; } catch (e) { return null; }
  }
  /* next: a theme id, or null for Auto (nothing saved: follow the system) */
  function setTheme(next) {
    var theme = next || systemTheme();
    root.setAttribute("data-theme", theme);
    try { if (next) localStorage.setItem(DS.slug + "-theme", next); else localStorage.removeItem(DS.slug + "-theme"); } catch (e) { /* not remembered in private mode */ }
    document.dispatchEvent(new CustomEvent("ds:theme", { detail: { theme: theme } }));
  }
  function paintToggle() {
    var dark = root.getAttribute("data-theme") === "dark";
    if (!toggle) return;
    toggle.setAttribute("aria-pressed", String(dark));
    toggle.querySelector(".lbl").textContent = window.dsT ? (dark ? DS.labels.dark : DS.labels.light) : "";
  }
  function labelOf(map) { var l = window.dsLang ? window.dsLang() : DS.source; return (map && (map[l] || map[DS.source])) || ""; }
  function paintPicker() {
    var current = savedTheme() || "auto";
    picker.querySelectorAll("[data-theme-set]").forEach(function (b) {
      var id = b.getAttribute("data-theme-set");
      b.textContent = labelOf(id === "auto" ? DS.labels.auto : DS.labels.themes[id]);
      b.setAttribute("aria-pressed", String(id === current));
    });
  }
  if (toggle) {
    toggle.addEventListener("click", function () { setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"); });
    document.addEventListener("ds:theme", paintToggle); // the accessibility panel can change the theme too
    paintToggle();
  }
  if (picker) {
    picker.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-theme-set]");
      if (!b) return;
      var id = b.getAttribute("data-theme-set"), all = ["auto"].concat(THEMES);
      if (matchMedia(COMPACT).matches && b.getAttribute("aria-pressed") === "true") id = all[(all.indexOf(id) + 1) % all.length]; // narrow: one button, it cycles
      setTheme(id === "auto" ? null : id);
    });
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { if (!savedTheme()) setTheme(null); });
    ["ds:theme", "ds:lang"].forEach(function (name) { document.addEventListener(name, paintPicker); });
    paintPicker();
  }

  /* copy: any element with data-copy="value" */
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-copy]");
    if (!b) return;
    var value = b.getAttribute("data-copy");
    var done = function () { window.dsToast(DS.labels.copied + " · " + value.slice(0, 60)); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(done, done);
    else done();
  });

  /* code blocks: a copy button copies the <pre> next to it */
  document.querySelectorAll(".codewrap").forEach(function (w) {
    var pre = w.querySelector("pre"), btn = w.querySelector("[data-copy-pre]");
    if (pre && btn) btn.addEventListener("click", function () {
      if (navigator.clipboard) navigator.clipboard.writeText(pre.textContent);
      window.dsToast(DS.labels.copied);
    });
  });

  /* sidebar: the section in view is highlighted (aria-current). With groups (sections carrying "group" in
     ds.config.json, rendered as details.side-g), its block opens and the others close, unless the reader
     opened or closed them by hand; the top bar marks its group. Without groups the list is flat and only the highlight runs. */
  var side = document.querySelector(".side"), links = {}, tops = {}, active = null, userOpen = {};
  var groups = [].slice.call(document.querySelectorAll(".side-g"));
  document.querySelectorAll(".side a[href^='#']").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
  document.querySelectorAll(".nav a[data-group]").forEach(function (a) { tops[a.getAttribute("data-group")] = a; });
  function filtering() { return side && side.classList.contains("is-filtering"); }
  /* a change this script makes is not remembered as the reader's wish ("toggle" fires after the change) */
  function setOpen(d, on) { if (d.open !== on) { d.dataset.auto = "1"; d.open = on; } }
  groups.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (d.dataset.auto) { delete d.dataset.auto; return; }
      if (!filtering()) userOpen[d.id] = d.open;
    });
  });
  function revealLink(a) {
    if (!side || side.offsetParent === null) return;
    var sr = side.getBoundingClientRect(), r = a.getBoundingClientRect(), pad = 64;
    if (r.top < sr.top + pad) side.scrollTop -= sr.top + pad - r.top;
    else if (r.bottom > sr.bottom - 24) side.scrollTop += r.bottom - sr.bottom + 24;
  }
  function activate(id) {
    var a = links[id];
    if (!a || a === active) return;
    if (active) { active.classList.remove("is-active"); active.removeAttribute("aria-current"); }
    active = a; a.classList.add("is-active"); a.setAttribute("aria-current", "true");
    var g = a.closest(".side-g");
    groups.forEach(function (d) {
      d.classList.toggle("has-active", d === g);
      if (filtering()) return;
      if (d === g) { if (userOpen[d.id] !== false) setOpen(d, true); }
      else if (!userOpen[d.id]) setOpen(d, false);
    });
    Object.keys(tops).forEach(function (k) {
      if (g && k === g.id) tops[k].setAttribute("aria-current", "true"); else tops[k].removeAttribute("aria-current");
    });
    if (!filtering()) requestAnimationFrame(function () { revealLink(a); });
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting && links[e.target.id]) activate(e.target.id); });
    }, { rootMargin: "-30% 0px -60% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { if (links[s.id]) io.observe(s); });
  }

  /* filter field (grouped navigation only): accent-insensitive, a group label matches all its sections,
     Esc clears, Enter opens the first match; labels come from DS.labels.nav, one string per language */
  var q = document.getElementById("side-q"), none = side && side.querySelector(".side-none");
  function norm(t) { return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function matchLinks(scope, v, whole) {
    var hit = false;
    scope.querySelectorAll("a[href^='#']").forEach(function (a) {
      var m = !v || whole || norm(a.textContent).indexOf(v) >= 0;
      a.classList.toggle("no-match", !m); hit = hit || m;
    });
    return hit;
  }
  function filterNav() {
    var v = norm(q.value.trim()), any = false;
    side.classList.toggle("is-filtering", !!v);
    groups.forEach(function (d) {
      var hit = matchLinks(d, v, v && norm(d.querySelector(".side-gt").textContent).indexOf(v) >= 0);
      d.classList.toggle("has-match", hit); any = any || hit;
      setOpen(d, v ? hit : (!!userOpen[d.id] || d.classList.contains("has-active")));
    });
    side.querySelectorAll("nav > a[href^='#']").forEach(function (a) {
      var m = !v || norm(a.textContent).indexOf(v) >= 0;
      a.classList.toggle("no-match", !m); any = any || m;
    });
    if (none) none.hidden = !v || any;
  }
  function paintFilter() {
    var L = DS.labels.nav, lab = side.querySelector("label[for='side-q']");
    if (!L) return;
    q.placeholder = labelOf(L.filter);
    if (lab) lab.textContent = labelOf(L.filter_label);
    if (none) none.textContent = labelOf(L.no_match);
  }
  if (q && side) {
    q.addEventListener("input", filterNav);
    q.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && q.value) { e.preventDefault(); q.value = ""; filterNav(); }
      if (e.key === "Enter") {
        var first = side.querySelector("nav a[href^='#']:not(.no-match)");
        if (first) { e.preventDefault(); first.click(); first.focus(); }
      }
    });
    document.addEventListener("ds:lang", paintFilter);
  }
})();
