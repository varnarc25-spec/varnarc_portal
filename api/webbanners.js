var fetchJsonHttps = require("./http-client").fetchJsonHttps;
var buildMargApiUrl = require("./config").buildMargApiUrl;

var MARG_WEB_BANNERS_URL =
  process.env.MARG_WEB_BANNERS_URL ||
  buildMargApiUrl("/api/web-banners?page_slug=landing");

function fetchWebBannersRows() {
  return fetchJsonHttps(MARG_WEB_BANNERS_URL)
    .then(function (json) {
      if (!json || !json.success || !json.data || !Array.isArray(json.data.items)) return [];
      return json.data.items;
    })
    .catch(function () {
      return [];
    });
}

module.exports = {
  fetchWebBannersRows: fetchWebBannersRows,
};
