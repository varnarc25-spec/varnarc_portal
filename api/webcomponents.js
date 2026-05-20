var fetchJsonHttps = require("./http-client").fetchJsonHttps;
var buildMargApiUrl = require("./config").buildMargApiUrl;

var MARG_WEB_FEATURES_URL =
  process.env.MARG_WEB_FEATURES_URL ||
  process.env.MARG_WEBCOMPONENTS_URL ||
  process.env.MARG_SECTION11_URL ||
  buildMargApiUrl("/api/web-features");

function fetchWebcomponentsRows() {
  return fetchJsonHttps(MARG_WEB_FEATURES_URL)
    .then(function (json) {
      if (!json || !json.success || !json.data || !Array.isArray(json.data.items)) return [];
      return json.data.items;
    })
    .catch(function () {
      return [];
    });
}

module.exports = {
  fetchWebcomponentsRows: fetchWebcomponentsRows,
};
