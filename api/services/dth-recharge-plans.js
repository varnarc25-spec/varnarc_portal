var postJsonHttps = require("../http-client").postJsonHttps;
var buildMargApiUrl = require("../config").buildMargApiUrl;

/** Full URL override, or defaults to Marg API `POST /api/recharges/dth/plans`. */
var MARG_DTH_PLANS_URL =
  process.env.MARG_DTH_PLANS_URL ||
  buildMargApiUrl("/api/recharges/dth/plans");

/**
 * Fetch DTH plans from Marg (which will resolve catalog first, then provider sync).
 *
 * @param {{ operatorId: string|number, subscriberId?: string, idToken?: string }} options
 * @returns {Promise<Array>}
 */
function fetchDthRechargePlans(options) {
  options = options || {};
  var operatorId =
    options.operatorId != null ? String(options.operatorId).trim() : "";
  if (!operatorId) {
    return Promise.reject(new Error("operatorId is required."));
  }

  var idToken = options.idToken ? String(options.idToken).trim() : "";
  var postOpts = {};
  if (idToken) {
    postOpts.headers = { Authorization: "Bearer " + idToken };
  }

  var body = { operatorId: operatorId };
  if (options.subscriberId != null && String(options.subscriberId).trim() !== "") {
    body.subscriberId = String(options.subscriberId).trim();
  }

  return postJsonHttps(MARG_DTH_PLANS_URL, body, postOpts).then(function (json) {
    if (!json || json.success !== true || json.data == null) {
      var msg =
        json && json.message ? String(json.message) : "DTH plans request failed.";
      throw new Error(msg);
    }
    return Array.isArray(json.data) ? json.data : [];
  });
}

module.exports = {
  fetchDthRechargePlans: fetchDthRechargePlans,
  MARG_DTH_PLANS_URL: MARG_DTH_PLANS_URL,
};
