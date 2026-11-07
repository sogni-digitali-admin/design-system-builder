/* Deferred section scripts. A long page opens fast when each section's script starts only when the section comes
 * near the screen (within 1.5 screens), when an anchor inside it is opened, or when the phone runtime shows it
 * (window.dsStart). A section nobody reaches never starts: starting them all at load kept the browser busy for
 * seconds on a thirty-section page. A script that starts late still gets its "DOMContentLoaded" / "load" listeners
 * called once, since those events have already passed. The build (parts_js) wraps every section script in dsDefer,
 * except the first two sections and those listed in ds.config.json → eager_sections (others depend on them). */
(function () {
  "use strict";
  var queue = {}, started = {};

  /* while a deferred script runs, a listener for an event that already fired is called once instead */
  function shim(target, orig) {
    return function (type, cb, opts) {
      var passed = (type === "DOMContentLoaded" && document.readyState !== "loading") ||
                   (type === "load" && document.readyState === "complete");
      if (!passed || !cb) return orig.call(this, type, cb, opts);
      setTimeout(function () {
        var ev = new Event(type);
        try { if (typeof cb === "function") cb.call(target, ev); else cb.handleEvent(ev); } catch (e) { console.error(e); }
      }, 0);
    };
  }
  function run(id) {
    var fn = queue[id];
    if (!fn || started[id]) return;
    started[id] = true; delete queue[id];
    var dAdd = document.addEventListener, wAdd = window.addEventListener;
    document.addEventListener = shim(document, dAdd); window.addEventListener = shim(window, wAdd);
    try { fn(); } catch (e) { console.error(e); } finally { document.addEventListener = dAdd; window.addEventListener = wAdd; }
  }
  window.dsDefer = function (id, fn) {
    queue[id] = fn;
    var el = document.getElementById(id);
    if (!el || !("IntersectionObserver" in window)) { run(id); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); run(id); }
    }, { rootMargin: "150% 0px" });
    io.observe(el);
  };
  window.dsStart = run;
  /* for the checks: which deferred scripts have started, which still wait */
  window.dsDeferState = function () { return { started: Object.keys(started), pending: Object.keys(queue) }; };

  function fromHash() {
    var t = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    var s = t && t.closest("#main > section");
    if (s) run(s.id);
  }
  window.addEventListener("hashchange", fromHash);
  document.addEventListener("DOMContentLoaded", fromHash);
})();
