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

  /* sidebar: highlight the section in view */
  var links = {};
  document.querySelectorAll(".side a[href^='#']").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting || !links[e.target.id]) return;
        Object.keys(links).forEach(function (k) { links[k].classList.toggle("is-active", k === e.target.id); });
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { io.observe(s); });
  }
})();
