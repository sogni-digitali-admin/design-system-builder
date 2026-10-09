/* components: the segmented control demo */
(function () {
  var seg = document.getElementById("cp-seg");
  if (!seg) return;
  seg.addEventListener("click", function (ev) {
    var b = ev.target.closest("button");
    if (!b) return;
    seg.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
  });
})();
