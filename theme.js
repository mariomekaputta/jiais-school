/* Tombol tema terang / gelap — vanilla JS.
 * Tanpa pilihan tersimpan, halaman mengikuti pengaturan sistem (prefers-color-scheme).
 * Setelah tombol diklik, pilihan disimpan dan dipasang di <html data-theme="light|dark">.
 * Pemasangan awal (sebelum halaman tampil) dilakukan script kecil di <head> index.html.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "jiais-theme";
  var btn = document.getElementById("theme-toggle");
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  if (!btn) return;

  function t(key) {
    return window.JIAIS_I18N ? window.JIAIS_I18N.t(key) : key;
  }

  function effectiveTheme() {
    var forced = document.documentElement.getAttribute("data-theme");
    if (forced === "light" || forced === "dark") return forced;
    return media && media.matches ? "dark" : "light";
  }

  function updateButton() {
    var dark = effectiveTheme() === "dark";
    btn.setAttribute("aria-pressed", String(dark));
    var label = dark ? t("theme.toLight") : t("theme.toDark");
    btn.setAttribute("aria-label", label);
    btn.title = label;
  }

  btn.addEventListener("click", function () {
    var next = effectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      /* abaikan: tema tetap berlaku sampai halaman ditutup */
    }
    updateButton();
  });

  // Ikuti perubahan tema sistem selama pengunjung belum memilih sendiri.
  if (media && media.addEventListener) media.addEventListener("change", updateButton);
  if (window.JIAIS_I18N) window.JIAIS_I18N.onChange(updateButton);

  updateButton();
})();
