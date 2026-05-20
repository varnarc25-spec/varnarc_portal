/**
 * Shared data bundle for landing-style pages (home, dashboardNew, service pages).
 */

var fetchServiceSections = require("../api").fetchServiceSections;
var fetchPopularServices = require("../api").fetchPopularServices;
var fetchPublicFaqs = require("../api").fetchPublicFaqs;
var fetchWebcomponentsRows = require("../api").fetchWebcomponentsRows;
var fetchWebBannersRows = require("../api").fetchWebBannersRows;
var fetchServiceMenuItems = require("../api").fetchServiceMenuItems;
var buildMenuSections = require("./menu-sections-from-tabs").buildMenuSections;
var computeStaticServicePaths = require("./service-leaf-urls-map").computeStaticServicePaths;

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

function fetchLandingBundle() {
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

module.exports = {
  fetchLandingBundle: fetchLandingBundle,
  fetchLandingMenuTabsOnly: fetchLandingMenuTabsOnly,
};
