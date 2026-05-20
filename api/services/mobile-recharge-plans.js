var postJsonHttps = require("../http-client").postJsonHttps;
var buildMargApiUrl = require("../config").buildMargApiUrl;
var normalizeIndianMobileDigits = require("./mobile-detect-operator").normalizeIndianMobileDigits;

var MARG_MOBILE_PLANS_URL =
  process.env.MARG_MOBILE_PLANS_URL ||
  buildMargApiUrl("/api/recharges/mobile/plans");

/**
 * POST plans for mobile recharge (Marg API; requires Firebase Bearer).
 * @param {{ mobileNumber: string, operatorId: string, type?: string, idToken?: string }} params
 * @returns {Promise<object[]>}
 */
function fetchMobileRechargePlans(params) {
  params = params || {};
  var normalized = normalizeIndianMobileDigits(params.mobileNumber || "");
  if (normalized.length !== 10 || !/^[6-9]\d{9}$/.test(normalized)) {
    return Promise.reject(new Error("Valid 10-digit Indian mobile required (starts with 6–9)."));
  }

  var idToken = params.idToken ? String(params.idToken).trim() : "";
  var postOpts = {};
  if (idToken) postOpts.headers = { Authorization: "Bearer " + idToken };

  console.log("[recharge] mobile plans request:", MARG_MOBILE_PLANS_URL);

  return postJsonHttps(
    MARG_MOBILE_PLANS_URL,
    {
      mobileNumber: normalized,
      operatorId: String(params.operatorId || "jio").toLowerCase(),
      type: params.type || "prepaid",
    },
    postOpts
  ).then(function (json) {
    if (!json || json.success !== true) {
      var msg = json && json.message ? String(json.message) : "Could not load plans.";
      throw new Error(msg);
    }
    var data = json.data;
    return Array.isArray(data) ? data : [];
  });
}

module.exports = {
  fetchMobileRechargePlans: fetchMobileRechargePlans,
  MARG_MOBILE_PLANS_URL: MARG_MOBILE_PLANS_URL,
};
