var fetchJsonHttps = require("../http-client").fetchJsonHttps;
var buildMargApiUrl = require("../config").buildMargApiUrl;

/** Full URL override, or Marg API `GET /api/recharges/dth/operators` (public). */
var MARG_DTH_OPERATORS_URL =
  process.env.MARG_DTH_OPERATORS_URL ||
  buildMargApiUrl("/api/recharges/dth/operators");

/**
 * @returns {Promise<Array<{ id: string, name: string, code: string, logoUrl: string }>>}
 */
function fetchDthOperators() {
  return fetchJsonHttps(MARG_DTH_OPERATORS_URL).then(function (json) {
    if (!json || json.success !== true || json.data == null) {
      var msg =
        json && json.message ? String(json.message) : "DTH operators request failed.";
      throw new Error(msg);
    }
    return json.data;
  });
}

module.exports = {
  fetchDthOperators: fetchDthOperators,
  MARG_DTH_OPERATORS_URL: MARG_DTH_OPERATORS_URL,
};
