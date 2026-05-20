// Landing sticky JS — toggles body.scrolled so .topbar collapses (see landing-header.css) and only .branding stays visible.
// Also sets --landing-mega-top to #header bottom so the signed-in mega menu aligns under the bar (fixed centered panel).

(function ($) {
  function syncLandingMegaTop() {
    var body = document.body;
    if (!body || !body.classList.contains("landing-page")) return;
    if (window.matchMedia("(max-width: 991.98px)").matches) {
      body.style.removeProperty("--landing-mega-top");
      return;
    }
    var header = document.getElementById("header");
    if (!header) return;
    var bottom = header.getBoundingClientRect().bottom;
    body.style.setProperty("--landing-mega-top", bottom + "px");
  }

  function syncHeaderScrollState() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    document.body.classList.toggle("scrolled", y > 0);
    requestAnimationFrame(syncLandingMegaTop);
  }

  $(window).on("scroll", syncHeaderScrollState);
  $(window).on("resize", syncLandingMegaTop);
  $(function () {
    syncHeaderScrollState();
    var header = document.getElementById("header");
    if (header && typeof ResizeObserver !== "undefined") {
      new ResizeObserver(syncLandingMegaTop).observe(header);
    }
  });

  new WOW().init();
})(jQuery);
