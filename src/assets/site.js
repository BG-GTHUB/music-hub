// Theme toggle, and "this week" highlighting from the current term's start date.
(function () {
  var root = document.documentElement;
  var btn = document.querySelector(".theme-toggle");
  if (btn) btn.addEventListener("click", function () {
    var dark = root.getAttribute("data-theme")
      ? root.getAttribute("data-theme") === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    var next = dark ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("musichub.theme", next); } catch (e) {}
  });

  var el = document.getElementById("term");
  if (!el) return;
  var term = JSON.parse(el.textContent);
  if (!term.starts) return;
  var start = new Date(term.starts + "T00:00:00");
  var week = Math.floor((Date.now() - start.getTime()) / (7 * 24 * 3600 * 1000)) + 1;
  if (week < 1 || week > term.weeks) return;
  var label = document.querySelector(".this-week");
  if (label) { label.textContent = "· Week " + week; label.hidden = false; }
  document.querySelectorAll('[data-week="' + week + '"]').forEach(function (n) {
    n.classList.add("now");
    var pill = n.querySelector(".now-pill");
    if (pill) pill.hidden = false;
  });
})();
