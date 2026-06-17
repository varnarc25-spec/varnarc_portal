/**
 * Build sidebar entries for section index hub pages.
 */

var fs = require("fs");
var path = require("path");
var sectionFolderBaseName = require("./service-static-paths").sectionFolderBaseName;
var buildMenuSections = require("./menu-sections-from-tabs").buildMenuSections;

var generatedLeafPath = path.join(__dirname, "service-leaf-urls.generated.json");

function loadGeneratedLeafMap() {
  try {
    var raw = fs.readFileSync(generatedLeafPath, "utf8");
    var json = JSON.parse(raw);
    return json && json.byItemId ? json.byItemId : {};
  } catch (err) {
    return {};
  }
}

function humanizeSlug(slug) {
  return String(slug || "service")
    .replace(/_/g, " ")
    .replace(/\b\w/g, function (c) {
      return c.toUpperCase();
    });
}

/** Stable id for static form panels (Quickai index-3 style). */
function panelSlugFromLabel(label) {
  var n = String(label || "").toLowerCase();
  var map = [
    ["to mobile", "to_mobile_number"],
    ["to bank", "to_bank_self_a_c"],
    ["check balance", "check_balance"],
    ["mobile", "mobile"],
    ["dth", "dth"],
    ["datacard", "datacard"],
    ["data card", "datacard"],
    ["broadband", "broadband"],
    ["landline", "landline"],
    ["cable", "cabletv"],
    ["electric", "electricity"],
    ["metro", "metro"],
    ["piped", "gas"],
    ["gas", "gas"],
    ["water", "water"],
    ["fastag", "fastag"],
    ["subscription", "subscription"],
    ["ev", "ev-recharge"],
    ["sim", "get-sim"],
    ["apple", "apple-store"],
    ["loan", "loan"],
    ["credit", "credit-card"],
    ["lic", "lic-insurance"],
    ["insurance", "insurance"],
    ["bike", "insurance-bike"],
    ["car", "insurance-car"],
    ["health", "insurance-health"],
    ["term", "insurance-term"],
    ["accident", "insurance-accident"],
    ["flight", "travel-flight"],
    ["hotel", "travel-hotel"],
    ["train", "travel-train"],
    ["bus", "travel-bus"],
    ["transfer", "money-transfer"],
    ["gold", "digigold"],
    ["silver", "digigold"],
    ["budget", "financial"],
    ["invest", "financial"],
    ["education", "education-fee"],
    ["municipal", "municipal-tax"],
    ["echallan", "echallan"],
    ["donation", "donation"],
    ["devotion", "devotion"],
    ["cylinder", "book-cylinder"],
    ["postpaid", "mobile-postpaid"],
    ["nps", "nps"],
    ["portfolio", "portfolio"],
    ["repay", "credit-card"],
  ];
  var i;
  for (i = 0; i < map.length; i++) {
    if (n.indexOf(map[i][0]) !== -1) {
      return map[i][1];
    }
  }
  return String(label || "service")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "generic";
}

function panelSlugFromLeafItem(item, leafMap) {
  if (!item || item.id == null || !leafMap) {
    return null;
  }
  var rel = leafMap[String(item.id)];
  if (!rel) {
    return null;
  }
  var parts = String(rel).split("/");
  return parts[parts.length - 1] || null;
}

function normalizePanelSlug(slug) {
  return String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
}

/** Leaf / API slugs → data-hub-panel ids used in hub form partials */
var HUB_PANEL_SLUG_ALIASES = {
  cable_tv: "cabletv",
  book_cylinder: "book-cylinder",
  piped_gas: "gas",
  loan_repayment: "loan",
  credit_card_bill: "credit-card",
  lic_insurance: "lic-insurance",
  nps_contribution: "nps",
  mobile_postpaid: "mobile-postpaid",
  municipal_tax: "municipal-tax",
  education_fee: "education-fee",
  portfolio_holdings: "portfolio",
  accident_insurance: "insurance-accident",
  bike_insurance: "insurance-bike",
  car_insurance: "insurance-car",
  health_insurance: "insurance-health",
  term_life_insurance: "insurance-term",
};

function applyHubPanelSlugAlias(slug) {
  var key = String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  return HUB_PANEL_SLUG_ALIASES[key] || slug;
}

function hubItemDisplayOrder(entry) {
  if (!entry || entry.type !== "item") {
    return 9999;
  }
  var item = entry.item;
  if (item && Number.isFinite(Number(item.display_order))) {
    return Number(item.display_order);
  }
  return 9999;
}

function sortHubNavEntriesByDisplayOrder(entries) {
  var result = [];
  var itemBuffer = [];

  function flushItems() {
    itemBuffer.sort(function (a, b) {
      var ao = hubItemDisplayOrder(a);
      var bo = hubItemDisplayOrder(b);
      if (ao !== bo) {
        return ao - bo;
      }
      return String(a.label || "").localeCompare(String(b.label || ""));
    });
    result = result.concat(itemBuffer);
    itemBuffer = [];
  }

  entries.forEach(function (entry) {
    if (entry.type === "item") {
      itemBuffer.push(entry);
    } else {
      flushItems();
      result.push(entry);
    }
  });
  flushItems();
  return result;
}

function enrichNavEntry(entry, leafMap) {
  if (!entry || entry.type !== "item") {
    return entry;
  }
  var fromLeaf = panelSlugFromLeafItem(entry.item, leafMap);
  if (fromLeaf) {
    entry.panelSlug = applyHubPanelSlugAlias(fromLeaf);
  } else if (entry.item && entry.item.slug) {
    entry.panelSlug = applyHubPanelSlugAlias(normalizePanelSlug(entry.item.slug));
  } else if (!entry.panelSlug) {
    entry.panelSlug = panelSlugFromLabel(entry.label);
  } else {
    entry.panelSlug = applyHubPanelSlugAlias(entry.panelSlug);
  }
  return entry;
}

function flattenCategoryItems(category) {
  var out = [];
  (category.subcategories || []).forEach(function (sub) {
    (sub.items || []).forEach(function (item) {
      out.push(item);
    });
  });
  (category.items || []).forEach(function (item) {
    out.push(item);
  });
  return out;
}

function buildHubNavEntries(menu, leafMap) {
  var entries = [];
  leafMap = leafMap || {};
  if (!menu || !menu.categories || !menu.categories.length) {
    return entries;
  }

  var singleCategory = menu.categories.length === 1 ? menu.categories[0] : null;

  menu.categories.forEach(function (category) {
    if (!singleCategory && category.name) {
      entries.push({ type: "heading", label: category.name });
    }

    (category.subcategories || []).forEach(function (sub) {
      var subItems = sub.items || [];
      subItems.forEach(function (item) {
        var label = item.name || sub.name || "Untitled";
        entries.push(
          enrichNavEntry(
            {
              type: "item",
              key: "item-" + String(item.id != null ? item.id : label),
              label: label,
              item: item,
              items: [item],
            },
            leafMap,
          ),
        );
      });
    });

    (category.items || []).forEach(function (item) {
      entries.push(
        enrichNavEntry(
          {
            type: "item",
            key: "item-" + String(item.id != null ? item.id : item.name),
            label: item.name || "Untitled",
            item: item,
            items: [item],
          },
          leafMap,
        ),
      );
    });
  });

  if (!entries.some(function (e) {
    return e.type === "item";
  })) {
    menu.categories.forEach(function (category) {
      flattenCategoryItems(category).forEach(function (item) {
        entries.push(
          enrichNavEntry(
            {
              type: "item",
              key: "item-" + String(item.id != null ? item.id : item.name),
              label: item.name || "Untitled",
              item: item,
              items: [item],
            },
            leafMap,
          ),
        );
      });
    });
  }

  return sortHubNavEntriesByDisplayOrder(entries);
}

function buildHubNavFromLeafMap(sectionFolder, leafMapByItemId) {
  var entries = [];
  var prefix = String(sectionFolder || "") + "/";
  var map = leafMapByItemId || {};
  var seen = {};

  Object.keys(map).forEach(function (itemId) {
    var rel = map[itemId];
    if (!rel || rel.indexOf(prefix) !== 0) {
      return;
    }
    var slug = rel.slice(prefix.length).split("/")[0];
    if (!slug || seen[slug]) {
      return;
    }
    seen[slug] = true;
    var label = humanizeSlug(slug);
    entries.push(
      enrichNavEntry(
        {
          type: "item",
          key: "leaf-" + slug,
          panelSlug: slug,
          label: label,
          item: { id: itemId, name: label },
          items: [{ id: itemId, name: label }],
        },
        map,
      ),
    );
  });

  entries.sort(function (a, b) {
    return String(a.label).localeCompare(String(b.label));
  });

  return entries;
}

function resolveSectionMenuForFolder(landingMenuTabs, menuSectionsTree, folder) {
  var want = String(folder || "");
  var tabs = Array.isArray(landingMenuTabs) ? landingMenuTabs : [];
  var i;

  for (i = 0; i < tabs.length; i++) {
    var tab = tabs[i];
    if (sectionFolderBaseName(tab && tab.section) === want) {
      var built = buildMenuSections([tab]);
      if (built[0]) {
        return built[0];
      }
    }
  }

  var sections = menuSectionsTree || [];
  for (i = 0; i < sections.length; i++) {
    if (sectionFolderBaseName(sections[i]) === want) {
      return sections[i];
    }
  }

  return null;
}

function buildHubNavForIndexPage(opts) {
  var folder = opts.sectionFolder;
  var menu = resolveSectionMenuForFolder(opts.landingMenuTabs, opts.menuSectionsTree, folder);
  var leafMap = Object.assign({}, loadGeneratedLeafMap(), opts.serviceLeafUrlByItemId || {});
  var entries = buildHubNavEntries(menu, leafMap);

  if (!entries.some(function (e) {
    return e.type === "item";
  })) {
    entries = buildHubNavFromLeafMap(folder, leafMap);
  }

  var query = String(opts.activeHubNavId || "").trim();
  var queryPanel = query
    ? applyHubPanelSlugAlias(query.replace(/-/g, "_"))
    : "";
  var firstItem = null;
  var match = null;
  entries.forEach(function (e) {
    if (!firstItem && e.type === "item") {
      firstItem = e;
    }
    if (
      !match &&
      e.type === "item" &&
      query &&
      (e.key === query ||
        e.panelSlug === query ||
        e.panelSlug === queryPanel ||
        applyHubPanelSlugAlias(String(query).replace(/-/g, "_")) === e.panelSlug)
    ) {
      match = e;
    }
  });
  if (!match && firstItem) {
    match = firstItem;
  }

  return {
    serviceSectionMenu: menu,
    hubNavEntries: entries,
    activeHubNavId: match ? match.key : "",
    activePanelSlug: match ? match.panelSlug : "",
  };
}

module.exports = {
  buildHubNavEntries: buildHubNavEntries,
  buildHubNavFromLeafMap: buildHubNavFromLeafMap,
  resolveSectionMenuForFolder: resolveSectionMenuForFolder,
  buildHubNavForIndexPage: buildHubNavForIndexPage,
  humanizeSlug: humanizeSlug,
  panelSlugFromLabel: panelSlugFromLabel,
};
