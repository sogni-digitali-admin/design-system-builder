/* splash: replay restarts the SVG's own animation (a new fragment makes the browser load a fresh copy) */
(function () {
  var n = 0;
  document.querySelectorAll("[data-splash-replay]").forEach(function (b) {
    b.addEventListener("click", function () {
      var img = b.closest(".sp-card").querySelector("[data-splash]");
      img.src = img.src.split("#")[0] + "#r" + (++n);
    });
  });
})();
