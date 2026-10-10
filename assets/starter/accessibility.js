/* accessibility: the live panel on this page. The page keeps its own light/dark toggle (theme="none"); a theme
   chosen in the panel is applied here and remembered like the toggle's. */
(function () {
  if (!window.customElements || document.querySelector("ds-a11y")) return;
  var el = document.createElement("ds-a11y");
  el.setAttribute("position", "right");
  el.setAttribute("theme", "none");
  el.setAttribute("font-base", "fonts/");
  document.body.insertBefore(el, document.body.firstChild);
  document.addEventListener("ds-a11y:change", function (e) {
    var changed = e.detail && e.detail.changed;
    if (changed !== "theme" && changed !== "reset") return;
    var pref = e.detail.prefs.theme, slug = (window.DS && window.DS.slug) || "ds";
    var dark = pref === "dark" || (pref === "system" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try { if (pref === "system") localStorage.removeItem(slug + "-theme"); else localStorage.setItem(slug + "-theme", pref); } catch (err) { /* not remembered in private mode */ }
    document.dispatchEvent(new CustomEvent("ds:theme", { detail: { theme: dark ? "dark" : "light" } }));
  });
})();
