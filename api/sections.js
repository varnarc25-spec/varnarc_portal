var fetchJsonHttps = require("./http-client").fetchJsonHttps;
var buildMargApiUrl = require("./config").buildMargApiUrl;

var MARG_SECTIONS_URL =
  process.env.MARG_SECTIONS_URL ||
  buildMargApiUrl("/api/services/master/sections");

function fetchServiceSections() {
  console.log("[landing] sections request:", MARG_SECTIONS_URL);
  return fetchJsonHttps(MARG_SECTIONS_URL)
    .then(function (json) {
      try {
        console.log("[landing] sections raw response:", JSON.stringify(json, null, 2));
      } catch (e) {
        console.log("[landing] sections raw response (object):", json);
      }
      if (!json || !json.success || !json.data || !Array.isArray(json.data.items)) {
        console.log("[landing] sections normalized count:", 0);
        return [];
      }
      var rows = json.data.items.filter(function (row) {
        return !row.status || row.status === "ACTIVE";
      });
      console.log("[landing] sections normalized count:", rows.length);
      return rows;
    })
    .catch(function (err) {
      console.error("[landing] MARG sections fetch failed:", err && err.message ? err.message : err);
      if (err && err.stack) console.error(err.stack);
      return [];
    });
}

module.exports = {
  fetchServiceSections: fetchServiceSections,
};
