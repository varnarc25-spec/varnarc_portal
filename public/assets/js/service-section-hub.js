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

    var panelAliases = {
      mobile: "to_mobile_number",
      bike_insurance: "insurance-bike",
      car_insurance: "insurance-car",
      health_insurance: "insurance-health",
      term_life_insurance: "insurance-term",
      accident_insurance: "insurance-accident",
    };

    function resolvePanelId(navId) {
      if (!navId) {
        return null;
      }
      if (root.querySelector('[data-hub-panel="' + navId + '"]')) {
        return navId;
      }
      if (panelAliases[navId] && root.querySelector('[data-hub-panel="' + panelAliases[navId] + '"]')) {
        return panelAliases[navId];
      }
      /* Legacy / API hyphen slugs → hub panel ids (underscores) */
      var hyphenAliases = {
        mobile: "mobile_recharge",
        "mobile-recharge": "mobile_recharge",
        "fastag-recharge": "fastag_recharge",
        "ev-recharge": "ev_recharge",
        "get-sim": "get_sim",
        "apple-store": "apple_store",
        broadband: "broadband_landline",
        electric: "electricity",
      };
      if (hyphenAliases[navId]) {
        var aliasPanel = hyphenAliases[navId];
        if (root.querySelector('[data-hub-panel="' + aliasPanel + '"]')) {
          return aliasPanel;
        }
      }
      var normalized = String(navId || "").replace(/-/g, "_");
      if (normalized !== navId && root.querySelector('[data-hub-panel="' + normalized + '"]')) {
        return normalized;
      }
      return navId;
    }

    function panelIdForTabIndex(tabIndex) {
      if (tabIndex < 0 || !panels[tabIndex]) {
        return null;
      }
      return panels[tabIndex].getAttribute("data-hub-panel");
    }

    function tabIndexForLi(li) {
      if (!li) {
        return -1;
      }
      var raw = li.getAttribute("data-hub-tab-index");
      if (raw !== null && raw !== "") {
        return parseInt(raw, 10);
      }
      return Array.prototype.indexOf.call(tabItems, li);
    }

    /** Sidebar tab index for a panel id (nav order, not panel DOM order). */
    function tabIndexForPanelId(panelId) {
      if (!panelId) {
        return -1;
      }
      var idx = -1;
      tabItems.forEach(function (li, i) {
        var nav = li.getAttribute("data-hub-nav");
        if (resolvePanelId(nav) === panelId || nav === panelId) {
          idx = i;
        }
      });
      return idx;
    }

    /**
     * @param {string} navId
     * @param {{ tabIndex?: number, clickedLi?: Element }} [opts]
     */
    function activate(navId, opts) {
      opts = opts || {};
      var tabIndex =
        typeof opts.tabIndex === "number" && opts.tabIndex >= 0
          ? opts.tabIndex
          : opts.clickedLi
            ? tabIndexForLi(opts.clickedLi)
            : -1;

      var panelId = resolvePanelId(navId);
      if (!panelId || !root.querySelector('[data-hub-panel="' + panelId + '"]')) {
        if (tabIndex >= 0) {
          panelId = panelIdForTabIndex(tabIndex);
        }
        if (!panelId) {
          tabItems.forEach(function (li, i) {
            if (li.getAttribute("data-hub-nav") === navId && tabIndex < 0) {
              tabIndex = i;
            }
          });
          panelId = panelIdForTabIndex(tabIndex);
        }
      }
      if (!panelId) {
        return;
      }
      var navTabIndex = tabIndexForPanelId(panelId);
      if (navTabIndex >= 0) {
        tabIndex = navTabIndex;
      } else if (opts.clickedLi) {
        tabIndex = tabIndexForLi(opts.clickedLi);
      } else if (tabIndex < 0) {
        tabItems.forEach(function (li, i) {
          if (li.getAttribute("data-hub-nav") === navId) {
            tabIndex = i;
          }
        });
      }

      tabItems.forEach(function (li, i) {
        var on = i === tabIndex;
        li.classList.toggle("resp-tab-active", on);
        li.classList.toggle("is-active", on);
        li.setAttribute("aria-current", on ? "true" : "false");
      });
      panels.forEach(function (panel) {
        var on = panel.getAttribute("data-hub-panel") === panelId;
        panel.classList.toggle("is-active", on);
        if (on) {
          panel.removeAttribute("hidden");
        } else {
          panel.setAttribute("hidden", "");
        }
      });
      if (mobileSelect && tabIndex >= 0 && String(mobileSelect.value) !== String(tabIndex)) {
        mobileSelect.value = String(tabIndex);
      }
      if (window.history && window.history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set("service", panelId);
        window.history.replaceState({}, "", url.pathname + url.search);
      }
      try {
        root.dispatchEvent(
          new CustomEvent("hub-panel-activated", {
            detail: { panelId: panelId, navId: navId, tabIndex: tabIndex },
          }),
        );
      } catch (e) {}
    }

    tabItems.forEach(function (li) {
      li.addEventListener("click", function () {
        activate(li.getAttribute("data-hub-nav"), { clickedLi: li });
      });
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate(li.getAttribute("data-hub-nav"), { clickedLi: li });
        }
      });
    });

    if (mobileSelect) {
      mobileSelect.addEventListener("change", function () {
        var idx = parseInt(mobileSelect.value, 10);
        var opt = mobileSelect.options[mobileSelect.selectedIndex];
        var panelFromOpt = opt && opt.getAttribute("data-hub-panel");
        activate(panelFromOpt || "", { tabIndex: idx });
      });
    }

    var params = new URLSearchParams(window.location.search);
    var fromQuery = params.get("service");
    var panelId = fromQuery ? resolvePanelId(fromQuery) || fromQuery : null;
    var tabIndex = -1;
    if (panelId) {
      tabIndex = tabIndexForPanelId(panelId);
      if (tabIndex < 0) {
        panels.forEach(function (panel, i) {
          if (panel.getAttribute("data-hub-panel") === panelId) {
            tabIndex = i;
          }
        });
      }
    }
    if (tabIndex < 0 && tabItems[0]) {
      tabIndex = 0;
      panelId = panelIdForTabIndex(0);
    }
    if (tabIndex >= 0 && panelId) {
      activate(panelId, { tabIndex: tabIndex });
    }
  }

  document.querySelectorAll("[data-service-section-hub]").forEach(initHub);
})();
