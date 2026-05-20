var fetchJsonHttps = require("./http-client").fetchJsonHttps;
var buildMargApiUrl = require("./config").buildMargApiUrl;

var MARG_CATEGORIES_URL =
  process.env.MARG_CATEGORIES_URL ||
  buildMargApiUrl("/api/services/master/categories");

function fetchServiceCategories() {
  console.log("[landing] categories request:", MARG_CATEGORIES_URL);
  return fetchJsonHttps(MARG_CATEGORIES_URL)
    .then(function (json) {
      console.log("[landing] categories raw response:", json);
      if (!json || !json.success || !json.data || !Array.isArray(json.data.items)) {
        console.log("[landing] categories normalized count:", 0);
        return [];
      }
      var rows = json.data.items.filter(function (row) {
        return !row.status || row.status === "ACTIVE";
      });
      console.log("[landing] categories normalized count:", rows.length);
      return rows;
    })
    .catch(function (err) {
      console.error("[landing] MARG categories fetch failed:", err.message);
      return [];
    });
}

module.exports = {
  fetchServiceCategories: fetchServiceCategories,
};
