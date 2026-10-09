/* Hairline figures in the page.
 *   <div class="hl-stage" data-kind="pkg" data-fig="loupe"></div>      one of the package's figures
 *   <div class="hl-stage" data-kind="custom" data-fig="casier"></div>  a figure from hairline/figures/
 * The read-out goes to [data-read-for="<fig>"] or the .fig-read of the enclosing .card.
 * A button [data-tour] inside the same .card plays a custom figure's tour (its pointer lap).
 * Colours come from the --hairline-* properties, which base.css maps to the tokens.
 */
(function () {
  "use strict";
  var mounted = new WeakMap();

  function readOut(stage) {
    var id = stage.getAttribute("data-fig");
    var card = stage.closest(".card");
    return document.querySelector('[data-read-for="' + id + '"]') || (card && card.querySelector(".fig-read"));
  }

  function mountCustom(stage) {
    var HL = window.HL, fig = (window.__hlFigs || {})[stage.getAttribute("data-fig")];
    if (!HL || !fig || mounted.has(stage)) return;
    stage.setAttribute("data-hairline", fig.name);
    stage.setAttribute("role", "img");
    if (!stage.hasAttribute("aria-label")) stage.setAttribute("aria-label", fig.means);
    var svg = HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);
    var out = readOut(stage);
    var read = { _t: "", get textContent() { return this._t; }, set textContent(v) { this._t = v == null ? "" : String(v); if (out) out.textContent = this._t; } };
    var handle = fig.mount({ stage: stage, svg: svg, read: read }, fig.range[1]);
    mounted.set(stage, { handle: handle, fig: fig });
  }

  function mountPkg(stage) {
    var make = window.Hairline && window.Hairline[stage.getAttribute("data-fig")];
    if (!make || mounted.has(stage)) return;
    var out = readOut(stage);
    var opts = { intensity: 0.5, theme: "auto", onRead: function (t) { if (out) out.textContent = t; } };
    if (stage.hasAttribute("aria-label")) opts.label = stage.getAttribute("aria-label");
    mounted.set(stage, { handle: make(stage, opts) });
  }

  if (window.HL) {
    window.HL.inject(document);
    document.querySelectorAll('.hl-stage[data-kind="custom"]').forEach(mountCustom);
  }
  function mountAllPkg() { document.querySelectorAll('.hl-stage[data-kind="pkg"]').forEach(mountPkg); }
  if (window.Hairline) mountAllPkg(); else window.addEventListener("hairline-ready", mountAllPkg);

  document.querySelectorAll("[data-tour]").forEach(function (b) {
    var tour = null;
    b.addEventListener("click", function () {
      var stage = b.closest(".card").querySelector(".hl-stage"), m = mounted.get(stage);
      if (!m || !m.fig || !window.HL) return;
      if (tour) { tour.stop(); tour = null; b.classList.remove("is-on"); return; }
      tour = window.HL.tour(stage, m.fig.tour || window.HL.LAP, function () {});
      b.classList.add("is-on");
    });
  });
  window.DSHairline = { mount: function (stage) { (stage.getAttribute("data-kind") === "custom" ? mountCustom : mountPkg)(stage); } };
})();
