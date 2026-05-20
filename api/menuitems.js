var fetchJsonHttps = require("./http-client").fetchJsonHttps;
var buildMargApiUrl = require("./config").buildMargApiUrl;

var MARG_MENU_ITEMS_URL =
  process.env.MARG_MENU_ITEMS_URL ||
  buildMargApiUrl("/api/services/menu-items");

function fetchServiceMenuItems(sectionSlug) {
  if (!sectionSlug) return Promise.resolve([]);

  var url =
    MARG_MENU_ITEMS_URL +
    "?section_slug=" +
    encodeURIComponent(String(sectionSlug).trim());
  console.log("[landing] menuitems request:", url);

  return fetchJsonHttps(url)
    .then(function (json) {
      console.log("[landing] menuitems raw response:", json);
      if (!json || !json.success || !json.data || !Array.isArray(json.data.items)) {
        console.log("[landing] menuitems normalized count:", 0);
        return [];
      }
      var rows = json.data.items.filter(function (row) {
        return !row.status || row.status === "ACTIVE";
      });
      console.log("[landing] menuitems normalized count:", rows.length);
      return rows;
    })
    .catch(function (err) {
      console.error("[landing] MARG menu items fetch failed:", err.message);
      return [];
    });
}

module.exports = {
  fetchServiceMenuItems: fetchServiceMenuItems,
};
