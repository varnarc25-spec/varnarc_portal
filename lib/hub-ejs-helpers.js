/**
 * Hub page template locals (panelIsActive, hubHrefForPanel, …).
 * Passed from renderServicePage so EJS includes share the same functions.
 */

var hubPanelIconUrlForSection = require("./hub-panel-icons").hubPanelIconUrl;

function buildHubTemplateLocals(opts) {
  var navEntries =
    opts.hubNavEntries && Array.isArray(opts.hubNavEntries) ? opts.hubNavEntries : [];
  var secMenu = opts.serviceSectionMenu || null;
  var secFolder = opts.serviceSectionFolder ? String(opts.serviceSectionFolder) : "";
  var secTitle =
    opts.secTitle ||
    (secMenu && secMenu.name
      ? secMenu.name
      : secFolder.replace(/([A-Z])/g, " $1").trim() || "Services");
  var activePanelSlug = opts.activePanelSlug ? String(opts.activePanelSlug) : "";
  var activeHubNavId = opts.activeHubNavId ? String(opts.activeHubNavId) : "";
  var serviceLeafUrlByItemId = opts.serviceLeafUrlByItemId || {};

  if (!activePanelSlug && activeHubNavId) {
    navEntries.forEach(function (e) {
      if (e.type === "item" && e.key === activeHubNavId) {
        activePanelSlug = e.panelSlug || "";
      }
    });
  }

  function itemHref(item) {
    if (item && item.id != null && serviceLeafUrlByItemId[String(item.id)]) {
      return "/services/" + serviceLeafUrlByItemId[String(item.id)];
    }
    return "#";
  }

  function hubHrefForPanel(slug) {
    var i;
    for (i = 0; i < navEntries.length; i++) {
      var e = navEntries[i];
      if (e.type === "item" && e.panelSlug === slug) {
        return itemHref(e.item);
      }
    }
    return "#";
  }

  function panelIsActive(slug) {
    return activePanelSlug === String(slug);
  }

  function hubIconSuffix(label, item) {
    var iconName = item && item.icon_name ? String(item.icon_name).trim() : "";
    var faSuffix = iconName.replace(/^fa-/, "").replace(/^fa\s+/i, "");
    if (faSuffix && /^[a-z0-9\-]+$/i.test(faSuffix)) {
      return faSuffix;
    }
    var n = String(label || "").toLowerCase();
    var map = [
      ["mobile", "mobile-alt"],
      ["dth", "tv"],
      ["datacard", "sim-card"],
      ["data", "sim-card"],
      ["broadband", "wifi"],
      ["landline", "phone"],
      ["cable", "plug"],
      ["electric", "lightbulb"],
      ["metro", "subway"],
      ["gas", "flask"],
      ["water", "tint"],
      ["fastag", "car"],
      ["subscription", "play-circle"],
      ["insurance", "shield-alt"],
      ["travel", "plane"],
      ["flight", "plane"],
      ["hotel", "hotel"],
      ["loan", "hand-holding-usd"],
      ["credit", "credit-card"],
      ["gold", "coins"],
      ["transfer", "exchange-alt"],
      ["bank", "university"],
      ["invest", "chart-line"],
    ];
    var i;
    for (i = 0; i < map.length; i++) {
      if (n.indexOf(map[i][0]) !== -1) {
        return map[i][1];
      }
    }
    return "circle";
  }

  function hubPanelIconUrl(panelSlug) {
    return hubPanelIconUrlForSection(secFolder, panelSlug);
  }

  function navItemIsActive(entry, tabIndex) {
    if (!entry || entry.type !== "item") {
      return false;
    }
    if (activeHubNavId && entry.key === activeHubNavId) {
      return true;
    }
    if (typeof tabIndex === "number" && entry._hubTabIndex === tabIndex) {
      return true;
    }
    return panelIsActive(entry.panelSlug);
  }

  return {
    navEntries: navEntries,
    secTitle: secTitle,
    activePanelSlug: activePanelSlug,
    activeHubNavId: activeHubNavId,
    panelIsActive: panelIsActive,
    navItemIsActive: navItemIsActive,
    hubHrefForPanel: hubHrefForPanel,
    hubIconSuffix: hubIconSuffix,
    hubPanelIconUrl: hubPanelIconUrl,
    serviceSectionFolder: secFolder,
    itemHref: itemHref,
  };
}

module.exports = {
  buildHubTemplateLocals: buildHubTemplateLocals,
};
