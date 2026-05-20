var fetchJsonHttps = require("./http-client").fetchJsonHttps;
var buildMargApiUrl = require("./config").buildMargApiUrl;

var MARG_POPULAR_SERVICES_URL =
  process.env.MARG_POPULAR_SERVICES_URL ||
  buildMargApiUrl("/api/services/popular");

function fetchPopularServices() {
  console.log("[landing] popular services request:", MARG_POPULAR_SERVICES_URL);
  return fetchJsonHttps(MARG_POPULAR_SERVICES_URL)
    .then(function (json) {
      if (!json || !json.success || !json.data || !Array.isArray(json.data.items)) {
        return [];
      }
      return json.data.items.filter(function (row) {
        return !row.status || String(row.status).toUpperCase() === "ACTIVE";
      });
    })
    .catch(function (err) {
      console.error("[landing] MARG popular services fetch failed:", err.message);
      return [];
    });
}

module.exports = {
  fetchPopularServices: fetchPopularServices,
};
