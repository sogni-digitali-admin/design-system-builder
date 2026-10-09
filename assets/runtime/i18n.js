/* Languages. The page is written in the source language (DS.source). For any other language, every visible
 * text node and the attributes aria-label, title, placeholder and alt are looked up in a dictionary keyed by
 * the source text, whitespace collapsed (window.DSI18n[lang][source]). Text added later by scripts is translated
 * as it appears. Amounts and percentages are re-formatted for the language with Intl.
 * Scripts that build their own strings use dsT({fr: "…", en: "…"}) and listen to the "ds:lang" event.
 * Opt out with data-i18n-skip (code, names, client content); give whole sentences per language with data-l.
 */
(function () {
  "use strict";
  var DS = window.DS, DICT = window.DSI18n || {};
  var SKIP = { SCRIPT: 1, STYLE: 1, CODE: 1, PRE: 1, TEXTAREA: 1, TEMPLATE: 1, NOSCRIPT: 1, SVG: 1 };
  var ATTRS = ["aria-label", "title", "placeholder", "alt"];
  var textOrig = new WeakMap(), attrOrig = new WeakMap(), mine = new WeakSet();
  var root = document.documentElement, lang = root.getAttribute("data-lang") || DS.source;

  function norm(s) { return s.replace(/\s+/g, " ").trim(); }
  function lookup(src) { var m = DICT[lang]; return m ? m[norm(src)] : undefined; }
  function skipped(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentNode) {
      if (SKIP[e.tagName.toUpperCase()] || e.hasAttribute("data-i18n-skip")) return true;
    }
    return false;
  }

  /* numbers written in the source language's format, e.g. "4 800 €", "1,2 %", "€4,800", "12%" */
  var sep = (function () {
    var parts = new Intl.NumberFormat(DS.source, { useGrouping: true }).formatToParts(12345.6);
    var g = "", d = ".";
    parts.forEach(function (p) { if (p.type === "group") g = p.value; if (p.type === "decimal") d = p.value; });
    return { group: g, decimal: d };
  })();
  var CUR = { "€": "EUR", "$": "USD", "£": "GBP", "CHF": "CHF", "¥": "JPY" };
  var NUM = /^([−-]?)(€|\$|£|CHF\s?)?(\d{1,3}(?:[\s  .,'’]\d{3})+|\d+)(?:([.,])(\d{1,2}))?\s?(€|%|\$|£|CHF|k€)?$/;
  function number(src) {
    var m = norm(src).match(NUM);
    if (!m) return undefined;
    var unit = (m[2] || m[6] || "").trim(), grouped = /\D/.test(m[3]);
    if (m[4] && m[4] !== sep.decimal) return undefined; // not written in the source format
    if (!unit && !grouped && !m[5]) return undefined;    // a bare integer is not touched
    var n = parseFloat(m[3].replace(/\D/g, "") + (m[5] ? "." + m[5] : "")) * (m[1] ? -1 : 1);
    var dec = m[5] ? m[5].length : 0, base = { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: "always" };
    try {
      if (unit === "%") return new Intl.NumberFormat(lang, Object.assign(base, { style: "percent" })).format(n / 100);
      if (unit === "k€") return new Intl.NumberFormat(lang, Object.assign(base, { style: "currency", currency: "EUR", notation: "compact" })).format(n * 1000);
      if (CUR[unit]) return new Intl.NumberFormat(lang, Object.assign(base, { style: "currency", currency: CUR[unit] })).format(n);
      return new Intl.NumberFormat(lang, base).format(n);
    } catch (e) { return undefined; }
  }

  function doText(node) {
    var o = textOrig.get(node);
    if (o === undefined) { o = node.nodeValue; textOrig.set(node, o); }
    if (!/[A-Za-zÀ-ÿ0-9]/.test(o)) return;
    var v = o;
    if (lang !== DS.source) {
      var t = lookup(o);
      if (t === undefined) t = number(o);
      if (t === undefined) return;
      var lead = /^[:;?!,.]/.test(t) ? "" : o.match(/^\s*/)[0]; // French spaces before ":" are not kept elsewhere
      v = lead + t + o.match(/\s*$/)[0];
    }
    if (node.nodeValue !== v) { mine.add(node); node.nodeValue = v; }
  }

  function doAttrs(el) {
    var store = attrOrig.get(el);
    var list = el.tagName === "INPUT" && /^(text|search|email)?$/.test(el.getAttribute("type") || "") ? ATTRS.concat("value") : ATTRS;
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      if (!el.hasAttribute(a)) continue;
      if (!store) { store = {}; attrOrig.set(el, store); }
      if (store[a] === undefined) store[a] = el.getAttribute(a);
      var v = store[a];
      if (lang !== DS.source) { var t = lookup(v); if (t === undefined) continue; v = t; }
      if (el.getAttribute(a) !== v) el.setAttribute(a, v);
    }
  }

  function walk(node) {
    if (!node || (node.nodeType === 1 && skipped(node))) return;
    if (node.nodeType === 3) { doText(node); return; }
    var w = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (n.nodeType === 1 && (SKIP[n.tagName.toUpperCase()] || n.hasAttribute("data-i18n-skip"))) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    if (node.nodeType === 1) doAttrs(node);
    for (var n = w.nextNode(); n; n = w.nextNode()) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }

  /* scripts change texts too: a change this file did not make becomes the new source text */
  var obs = new MutationObserver(function (list) {
    list.forEach(function (m) {
      if (m.type === "characterData") {
        if (mine.has(m.target)) { mine.delete(m.target); return; }
        textOrig.set(m.target, m.target.nodeValue);
        if (lang !== DS.source && !skipped(m.target.parentNode)) doText(m.target);
      } else {
        for (var k = 0; k < m.addedNodes.length; k++) {
          var n = m.addedNodes[k];
          if (n.nodeType === 3 && !skipped(n.parentNode)) doText(n);
          else if (n.nodeType === 1) walk(n);
        }
      }
    });
  });

  function setLang(next, quiet) {
    lang = next;
    root.setAttribute("data-lang", lang);
    root.lang = lang;
    try { localStorage.setItem(DS.slug + "-lang", lang); } catch (e) { /* not remembered in private mode */ }
    obs.disconnect();
    walk(document.body);
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    document.querySelectorAll("[data-lang-set]").forEach(function (b) {
      var on = b.getAttribute("data-lang-set") === lang;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (!quiet) document.dispatchEvent(new CustomEvent("ds:lang", { detail: { lang: lang } }));
  }
  document.querySelectorAll("[data-lang-set]").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-lang-set")); });
  });
  window.DSLang = { set: setLang, get: function () { return lang; } };
  setLang(lang, lang === DS.source);
})();
