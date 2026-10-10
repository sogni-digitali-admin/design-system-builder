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

  /* theme */
  var toggle = document.getElementById("theme-toggle");
  function paintToggle() {
    var dark = root.getAttribute("data-theme") === "dark";
    if (!toggle) return;
    toggle.setAttribute("aria-pressed", String(dark));
    toggle.querySelector(".lbl").textContent = window.dsT ? (dark ? DS.labels.dark : DS.labels.light) : "";
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(DS.slug + "-theme", next); } catch (e) { /* not remembered in private mode */ }
      paintToggle();
      document.dispatchEvent(new CustomEvent("ds:theme", { detail: { theme: next } }));
    });
  }
  paintToggle();
  document.addEventListener("ds:theme", paintToggle); // the accessibility panel can change the theme too

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
