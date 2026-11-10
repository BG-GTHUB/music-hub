// Light and dark mode. Follows the device unless the toggle has been used.
(function () {
  var saved = null;
  try { saved = localStorage.getItem("musichub.theme"); } catch (e) {}
  if (saved === "light" || saved === "dark") document.documentElement.setAttribute("data-theme", saved);
})();
