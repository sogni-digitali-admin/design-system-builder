/* Runs in <head> before paint: theme and language from the visitor's last choice or their system,
   the helpers dsLang() / dsT({fr, en, …}) for scripts that build text, and the per-language rule for [data-l]. */
(function () {
  var SLUG = "__SLUG__", SOURCE = "__SOURCE__", LANGS = __LANGS__;
  var root = document.documentElement, theme = "light", lang = SOURCE;
  try {
    theme = localStorage.getItem(SLUG + "-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    lang = localStorage.getItem(SLUG + "-lang") || (navigator.language || SOURCE).slice(0, 2).toLowerCase();
  } catch (e) { /* storage blocked: system theme, source language */ }
  if (LANGS.indexOf(lang) < 0) lang = SOURCE;
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-lang", lang);
  root.lang = lang;
  window.dsLang = function () { return root.getAttribute("data-lang") || SOURCE; };
  window.dsT = function (o) {
    if (o == null) return "";
    if (typeof o === "string") return o;
    var l = window.dsLang();
    return o[l] != null ? o[l] : o[SOURCE];
  };
  var css = LANGS.map(function (l) { return 'html[data-lang="' + l + '"] [data-l="' + l + '"]{display:revert}'; }).join("");
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
})();
