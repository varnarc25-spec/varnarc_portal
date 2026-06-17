/**
 * Shared data bundle for landing-style pages (home, dashboardNew, service pages).
 * Cached in-process to avoid hitting Marg API rate limits (100 req / 15 min per IP on Cloud Run).
 */

var fetchServiceSections = require("../api").fetchServiceSections;
var fetchPopularServices = require("../api").fetchPopularServices;
var fetchPublicFaqs = require("../api").fetchPublicFaqs;
var fetchWebcomponentsRows = require("../api").fetchWebcomponentsRows;
var fetchWebBannersRows = require("../api").fetchWebBannersRows;
var fetchServiceMenuItems = require("../api").fetchServiceMenuItems;
var buildMenuSections = require("./menu-sections-from-tabs").buildMenuSections;
var computeStaticServicePaths = require("./service-leaf-urls-map").computeStaticServicePaths;

var landingBundleCache = {
  data: null,
  expiresAt: 0,
  inflight: null,
};

function landingBundleCacheTtlMs() {
  var raw = process.env.LANDING_BUNDLE_CACHE_TTL_MS;
  if (raw === "0" || raw === "false") {
    return 0;
  }
  if (raw != null && raw !== "") {
    var n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 0) {
      return n;
    }
  }
  /* Default 5 min — enough for local dev without stale menus for hours */
  return 5 * 60 * 1000;
}

function fetchLandingMenuTabsOnly() {
  return fetchServiceSections().then(function (serviceSections) {
    return Promise.all(
      (serviceSections || []).map(function (section) {
        return fetchServiceMenuItems(section.slug).then(function (items) {
          return {
            section: section,
            items: items || [],
          };
        });
      }),
    );
  });
}

function fetchLandingBundleUncached() {
  return Promise.all([
    fetchServiceSections(),
    fetchPopularServices(),
    fetchPublicFaqs(),
    fetchWebcomponentsRows(),
    fetchWebBannersRows(),
  ]).then(function (result) {
    var serviceSections = result[0];
    var popularServices = result[1];
    var publicFaqs = result[2];
    var webFeaturesRows = result[3];
    var webBannersRows = result[4];

    return Promise.all(
      (serviceSections || []).map(function (section) {
        return fetchServiceMenuItems(section.slug).then(function (items) {
          return {
            section: section,
            items: items || [],
          };
        });
      }),
    ).then(function (landingMenuTabs) {
      var menuSectionsTree = buildMenuSections(landingMenuTabs);
      var staticPaths = computeStaticServicePaths(menuSectionsTree);
      return {
        serviceSections: serviceSections,
        popularServices: popularServices,
        publicFaqs: publicFaqs,
        webFeaturesRows: webFeaturesRows,
        webcomponentsRows: webFeaturesRows,
        webBannersRows: webBannersRows,
        landingMenuTabs: landingMenuTabs,
        menuSectionsTree: menuSectionsTree,
        serviceLeafUrlByItemId: staticPaths.byItemId,
        menuItemsApiDebug: process.env.VARNARC_DEBUG_MENU_ITEMS === "1",
      };
    });
  });
}

function fetchLandingBundle() {
  var ttl = landingBundleCacheTtlMs();
  var now = Date.now();

  if (ttl > 0 && landingBundleCache.data && landingBundleCache.expiresAt > now) {
    return Promise.resolve(landingBundleCache.data);
  }

  if (landingBundleCache.inflight) {
    return landingBundleCache.inflight;
  }

  landingBundleCache.inflight = fetchLandingBundleUncached()
    .then(function (data) {
      if (ttl > 0) {
        landingBundleCache.data = data;
        landingBundleCache.expiresAt = Date.now() + ttl;
      }
      return data;
    })
    .catch(function (err) {
      if (landingBundleCache.data) {
        console.warn(
          "[landing] bundle fetch failed, serving stale cache:",
          err && err.message ? err.message : err,
        );
        return landingBundleCache.data;
      }
      throw err;
    })
    .finally(function () {
      landingBundleCache.inflight = null;
    });

  return landingBundleCache.inflight;
}

module.exports = {
  fetchLandingBundle: fetchLandingBundle,
  fetchLandingMenuTabsOnly: fetchLandingMenuTabsOnly,
  clearLandingBundleCache: function clearLandingBundleCache() {
    landingBundleCache.data = null;
    landingBundleCache.expiresAt = 0;
    landingBundleCache.inflight = null;
  },
};
