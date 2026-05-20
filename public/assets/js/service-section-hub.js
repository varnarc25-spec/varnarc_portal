/**
 * Section hub — Quickai index-3 vertical tab switching
 */
(function () {
  "use strict";

  function initHub(root) {
    if (!root || root.getAttribute("data-hub-init") === "1") {
      return;
    }
    root.setAttribute("data-hub-init", "1");

    var tabItems = root.querySelectorAll(".resp-tabs-list li[data-hub-nav]");
    var panels = root.querySelectorAll(".hub-tab-panel[data-hub-panel]");
    var mobileSelect = root.querySelector("[data-hub-mobile-select]");

    function activate(panelId) {
      if (!panelId) {
        return;
      }
      tabItems.forEach(function (li) {
        var on = li.getAttribute("data-hub-nav") === panelId;
        li.classList.toggle("resp-tab-active", on);
        li.classList.toggle("is-active", on);
        li.setAttribute("aria-current", on ? "true" : "false");
      });
      panels.forEach(function (panel) {
        var on = panel.getAttribute("data-hub-panel") === panelId;
        panel.classList.toggle("is-active", on);
        panel.hidden = !on;
      });
      if (mobileSelect && mobileSelect.value !== panelId) {
        mobileSelect.value = panelId;
      }
      if (window.history && window.history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set("service", panelId);
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }

    tabItems.forEach(function (li) {
      li.addEventListener("click", function () {
        activate(li.getAttribute("data-hub-nav"));
      });
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate(li.getAttribute("data-hub-nav"));
        }
      });
    });

    if (mobileSelect) {
      mobileSelect.addEventListener("change", function () {
        activate(mobileSelect.value);
      });
    }

    var params = new URLSearchParams(window.location.search);
    var fromQuery = params.get("service");
    var defaultId =
      (fromQuery && root.querySelector('[data-hub-panel="' + fromQuery + '"]') && fromQuery) ||
      (tabItems[0] && tabItems[0].getAttribute("data-hub-nav")) ||
      null;
    if (defaultId) {
      activate(defaultId);
    }
  }

  document.querySelectorAll("[data-service-section-hub]").forEach(initHub);
})();
