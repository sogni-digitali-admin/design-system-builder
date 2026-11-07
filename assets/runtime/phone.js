/* Reading on a phone (up to 760 px): one section at a time, a real menu, previous and next. A design system runs
 * to hundreds of thousands of pixels: scrolling through it on a phone is not reading, and it can crash the browser.
 * Sections keep their markup and their anchors; only one is displayed (html.ds-one, section.is-one). The menu is
 * the side navigation shown as a sheet (html.ds-menu), with the language and theme controls moved into it.
 * Labels come from DS.labels.phone (one string per language, from tokens.py). Above 760 px nothing changes. */
(function () {
  "use strict";
  var mq = window.matchMedia("(max-width: 760px)"), root = document.documentElement, DS = window.DS || {};
  var main = document.getElementById("main"), side = document.querySelector(".side"), bar = document.querySelector(".topbar-in");
  if (!main || !side || !bar) return;
  var sections = [].slice.call(main.children).filter(function (s) { return s.tagName === "SECTION" && s.id; });
  if (sections.length < 2) return;
  var cur = null, opened = null;
  var L = function (key) { var o = (DS.labels || {}).phone; return o && o[key] ? (window.dsT ? window.dsT(o[key]) : "") : key; };
  var el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
  var ICON = function (d) { return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="' + d + '"/></svg>'; };

  /* top bar: the section you are in, and the menu button */
  var title = el("span", "top-title");
  var menuBtn = el("button", "top-menu", ICON("M4 7h16M4 12h16M4 17h16"));
  menuBtn.type = "button"; menuBtn.setAttribute("aria-expanded", "false");
  if (!side.id) side.id = "side-sheet";
  menuBtn.setAttribute("aria-controls", side.id);
  var brand = bar.querySelector(".brand");
  if (brand && brand.nextSibling) bar.insertBefore(title, brand.nextSibling); else bar.appendChild(title);
  bar.appendChild(menuBtn);

  /* the sheet: languages, themes, design.md, what is in this section, every section */
  var head = el("div", "side-sheet-h"), sheetTitle = el("p", "side-sheet-t");
  var closeBtn = el("button", "top-menu side-sheet-x", ICON("M6 6l12 12M18 6L6 18"));
  closeBtn.type = "button";
  head.appendChild(sheetTitle); head.appendChild(closeBtn);
  var tools = el("div", "side-sheet-tools"), subs = el("nav", "side-subs");
  subs.hidden = true;
  side.insertBefore(subs, side.firstChild); side.insertBefore(tools, subs); side.insertBefore(head, tools);
  var lang = bar.querySelector(".lang-sw"), theme = bar.querySelector(".theme-sw, .theme-toggle"), dl = bar.querySelector(".top-dl");
  var anchorLang = lang ? lang.nextSibling : null, anchorTheme = theme ? theme.nextSibling : null;
  var dlCopy = dl ? dl.cloneNode(true) : null;
  if (dlCopy) { dlCopy.classList.remove("top-dl"); dlCopy.classList.add("side-sheet-dl"); tools.appendChild(dlCopy); }

  /* previous and next, under the section */
  var pn = el("nav", "ds-pn"), foot = main.querySelector(":scope > footer");
  main.insertBefore(pn, foot || null);

  function linkOf(s) { return side.querySelector('nav a[href="#' + s.id + '"]'); }
  function nameOf(s) {
    var a = linkOf(s), spans = a ? a.querySelectorAll("span") : [], last = spans.length ? spans[spans.length - 1] : null;
    if (last) return last.textContent.trim();
    var h = s.querySelector("h2, h1");
    return h ? h.textContent.trim() : s.id;
  }
  function paintLabels() {
    menuBtn.setAttribute("aria-label", L("menu"));
    closeBtn.setAttribute("aria-label", L("close_menu"));
    sheetTitle.textContent = L("sections");
    pn.setAttribute("aria-label", L("prev_next"));
    subs.setAttribute("aria-label", L("in_section"));
    if (cur) paintSection();
  }
  function pnLink(s, cls, key) {
    var a = el("a", cls); a.href = "#" + s.id;
    a.appendChild(el("small")).textContent = L(key);
    a.appendChild(el("b")).textContent = nameOf(s);
    return a;
  }
  function paintSection() {
    var i = sections.indexOf(cur), a = sections[i - 1], b = sections[i + 1];
    title.textContent = nameOf(cur);
    pn.innerHTML = "";
    if (a) pn.appendChild(pnLink(a, "ds-pn-a", "previous"));
    if (b) pn.appendChild(pnLink(b, "ds-pn-a ds-pn-next", "next"));
  }

  /* Several icons share one mask or gradient id. When the first copy sits in a hidden section, url(#id) paints
     nothing in the open one: every SVG of the open section gets its own ids. */
  var uid = 0, DEFS = "mask[id],linearGradient[id],radialGradient[id],clipPath[id],filter[id],pattern[id]";
  function renameRefs(e, map) {
    [].forEach.call(e.attributes, function (a) {
      if (a.value.indexOf("#") < 0) return;
      var v = a.value.replace(/url\(\s*['"]?#([^'")\s]+)['"]?\s*\)/g, function (m, id) { return map[id] ? "url(#" + map[id] + ")" : m; });
      if ((a.name === "href" || a.name === "xlink:href") && map[v.slice(1)]) v = "#" + map[v.slice(1)];
      if (v !== a.value) a.value = v;
    });
  }
  function ownIds(scope) {
    [].forEach.call(scope.querySelectorAll("svg"), function (svg) {
      var defs = svg.querySelectorAll(DEFS), map = {};
      if (!defs.length || svg.hasAttribute("data-own-ids")) return;
      svg.setAttribute("data-own-ids", "");
      [].forEach.call(defs, function (d) { var n = d.id + "-p" + (++uid); map[d.id] = n; d.id = n; });
      [svg].concat([].slice.call(svg.querySelectorAll("*"))).forEach(function (e) { renameRefs(e, map); });
    });
  }
  var ownTimer = 0, ownObs = window.MutationObserver ? new MutationObserver(function () { clearTimeout(ownTimer); ownTimer = setTimeout(function () { if (cur) ownIds(cur); }, 60); }) : null;

  function show(s) {
    if (cur === s) return;
    sections.forEach(function (x) { x.classList.toggle("is-one", x === s); });
    cur = s;
    if (window.dsStart) window.dsStart(s.id);
    paintSection();
    ownIds(s);
    if (ownObs) { ownObs.disconnect(); ownObs.observe(s, { childList: true, subtree: true }); }
    /* what was measured while the section was hidden (width 0) measures itself again */
    requestAnimationFrame(function () { window.dispatchEvent(new Event("resize")); });
    document.dispatchEvent(new CustomEvent("ds:section", { detail: { id: s.id } }));
  }
  function sectionOf(id) {
    if (!id || id === "top") return sections[0];
    var t = document.getElementById(id);
    return t ? t.closest("#main > section") : null;
  }
  function jump(behind) {
    var id = location.hash.length > 1 ? decodeURIComponent(location.hash.slice(1)) : "";
    var s = sectionOf(id), changed = s && s !== cur, t = id && document.getElementById(id);
    if (!s) { if (!cur) show(sections[0]); return; }
    show(s);
    /* "instant": the section was hidden when the browser tried its own hash scroll; this one must land, not glide */
    if (t && t !== s && id !== "top") requestAnimationFrame(function () { t.scrollIntoView({ block: "start", behavior: "instant" }); });
    else if (changed || behind) window.scrollTo({ top: 0, behavior: "instant" });
  }

  function buildSubs() {
    var heads = [].slice.call(cur.querySelectorAll("h3.sub")).filter(function (h) { return !h.closest("[inert],[aria-hidden='true']"); });
    subs.innerHTML = ""; subs.hidden = heads.length < 2;
    if (subs.hidden) return;
    subs.appendChild(el("p", "side-subs-t")).textContent = L("in_section");
    heads.forEach(function (h, n) {
      if (!h.id) h.id = cur.id + "-part-" + (n + 1);
      var a = el("a"); a.href = "#" + h.id; a.textContent = h.textContent.trim(); subs.appendChild(a);
    });
  }
  function openMenu() {
    buildSubs(); opened = document.activeElement;
    root.classList.add("ds-menu"); menuBtn.setAttribute("aria-expanded", "true");
    side.setAttribute("role", "dialog"); side.setAttribute("aria-modal", "true"); side.setAttribute("aria-label", L("menu"));
    main.inert = true;
    closeBtn.focus({ preventScroll: true });
    var on = side.querySelector("nav a.is-active");
    if (on && !subs.hidden) side.scrollTop = 0; else if (on) on.scrollIntoView({ block: "center", behavior: "auto" });
  }
  function closeMenu(refocus) {
    if (!root.classList.contains("ds-menu")) return;
    root.classList.remove("ds-menu"); menuBtn.setAttribute("aria-expanded", "false");
    side.removeAttribute("role"); side.removeAttribute("aria-modal"); side.removeAttribute("aria-label");
    main.inert = false;
    if (refocus && opened && opened.focus) opened.focus({ preventScroll: true });
  }
  menuBtn.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", function () { closeMenu(true); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(true); });

  /* a link to an anchor: open its section; the same hash twice fires no hashchange */
  document.addEventListener("click", function (e) {
    if (!mq.matches || e.defaultPrevented) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = decodeURIComponent(a.getAttribute("href").slice(1));
    if (!sectionOf(id)) return;
    closeMenu(false);
    if (location.hash === "#" + id) jump(true);
  });
  window.addEventListener("hashchange", function () { if (mq.matches) { closeMenu(false); jump(false); } });
  document.addEventListener("ds:lang", paintLabels);

  function apply() {
    var on = mq.matches;
    root.classList.toggle("ds-one", on);
    if (on) {
      if (lang) tools.insertBefore(lang, tools.firstChild);
      if (theme) tools.insertBefore(theme, lang ? lang.nextSibling : tools.firstChild);
      paintLabels(); jump(false);
    } else {
      closeMenu(false);
      if (lang) bar.insertBefore(lang, anchorLang && anchorLang.parentNode === bar ? anchorLang : menuBtn);
      if (theme) bar.insertBefore(theme, anchorTheme && anchorTheme.parentNode === bar ? anchorTheme : menuBtn);
      sections.forEach(function (x) { x.classList.remove("is-one"); });
      if (ownObs) ownObs.disconnect();
      cur = null;
    }
  }
  if (mq.addEventListener) mq.addEventListener("change", apply); else if (mq.addListener) mq.addListener(apply);
  apply();
})();
