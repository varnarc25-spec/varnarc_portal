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
    ["flight", "travel-flight"],
    ["hotel", "travel-hotel"],
    ["train", "travel-train"],
    ["bus", "travel-bus"],
    ["transfer", "money-transfer"],
    ["bank", "money-transfer"],
    ["balance", "money-transfer"],
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

function enrichNavEntry(entry) {
  if (!entry || entry.type !== "item") {
    return entry;
  }
  entry.panelSlug = panelSlugFromLabel(entry.label);
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

function buildHubNavEntries(menu) {
  var entries = [];
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
      if (!subItems.length) {
        return;
      }
      var label = sub.name || subItems[0].name || "Untitled";
      entries.push(
        enrichNavEntry({
          type: "item",
          key: "sub-" + String(sub.key || sub.slug || sub.id || label).replace(/[^a-z0-9]+/gi, "-"),
          label: label,
          item: subItems[0],
          items: subItems,
        }),
      );
    });

    (category.items || []).forEach(function (item) {
      entries.push(
        enrichNavEntry({
          type: "item",
          key: "item-" + String(item.id != null ? item.id : item.name),
          label: item.name || "Untitled",
          item: item,
          items: [item],
        }),
      );
    });
  });

  if (!entries.some(function (e) {
    return e.type === "item";
  })) {
    menu.categories.forEach(function (category) {
      flattenCategoryItems(category).forEach(function (item) {
        entries.push({
          type: "item",
          key: "item-" + String(item.id != null ? item.id : item.name),
          label: item.name || "Untitled",
          item: item,
          items: [item],
        });
      });
    });
  }

  return entries;
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
      enrichNavEntry({
        type: "item",
        key: "leaf-" + slug,
        label: label,
        item: { id: itemId, name: label },
        items: [{ id: itemId, name: label }],
      }),
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
  var entries = buildHubNavEntries(menu);

  if (!entries.some(function (e) {
    return e.type === "item";
  })) {
    var leafMap = Object.assign(
      {},
      loadGeneratedLeafMap(),
      opts.serviceLeafUrlByItemId || {},
    );
    entries = buildHubNavFromLeafMap(folder, leafMap);
  }

  var query = String(opts.activeHubNavId || "").trim();
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
      (e.key === query || e.panelSlug === query)
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
