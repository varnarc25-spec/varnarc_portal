var postJsonHttps = require("../http-client").postJsonHttps;
var buildMargApiUrl = require("../config").buildMargApiUrl;

/** Full URL override, or defaults to Marg API `/api/recharges/mobile/detect-operator`. */
var MARG_MOBILE_DETECT_OPERATOR_URL =
  process.env.MARG_MOBILE_DETECT_OPERATOR_URL ||
  buildMargApiUrl("/api/recharges/mobile/detect-operator");

/**
 * Normalize Indian mobile to 10 digits (strip +91 / leading 0).
 * @param {string} raw
 * @returns {string}
 */
function normalizeIndianMobileDigits(raw) {
  var d = String(raw || "").replace(/\D/g, "");
  if (d.length === 12 && d.slice(0, 2) === "91") return d.slice(2);
  if (d.length === 11 && d.charAt(0) === "0") return d.slice(1);
  return d.slice(0, 10);
}

/**
 * POST `{ mobileNumber }` to Marg recharge API.
 * On success resolves with `data` from API: `{ operator: { id, name, code }, circle: { code, name } }`.
 *
 * Marg API requires a Firebase ID token on this route. Pass `options.idToken` (or set
 * `MARG_RECHARGE_FIREBASE_ID_TOKEN` for server-only scripts).
 *
 * @param {string} mobileNumber 10-digit (or messy) Indian mobile
 * @param {{ idToken?: string, includePlans?: boolean|string }} [options]  includePlans defaults true when omitted.
 * @returns {Promise<object>}
 */
function detectMobileOperator(mobileNumber, options) {
  options = options || {};
  var normalized = normalizeIndianMobileDigits(mobileNumber);
  if (normalized.length !== 10 || !/^[6-9]\d{9}$/.test(normalized)) {
    return Promise.reject(new Error("Valid 10-digit Indian mobile required (starts with 6–9)."));
  }

  var idToken =
    options.idToken ||
    (process.env.MARG_RECHARGE_FIREBASE_ID_TOKEN
      ? String(process.env.MARG_RECHARGE_FIREBASE_ID_TOKEN).trim()
      : "");
  var postOpts = {};
  if (idToken) {
    postOpts.headers = { Authorization: "Bearer " + idToken };
  }

  var wantPlans =
    options.includePlans !== false && options.includePlans !== "false";

  console.log("[recharge] detect operator request:", MARG_MOBILE_DETECT_OPERATOR_URL);

  var body = {
    mobileNumber: normalized,
    includePlans: wantPlans,
  };
  if (options.type != null && String(options.type).trim() !== "") {
    body.type = options.type;
  }
  if (options.planLimit != null && options.planLimit !== "") {
    body.planLimit = options.planLimit;
  }

  return postJsonHttps(MARG_MOBILE_DETECT_OPERATOR_URL, body, postOpts).then(function (json) {
    if (!json || json.success !== true || json.data == null) {
      var msg = json && json.message ? String(json.message) : "Operator detection failed.";
      throw new Error(msg);
    }
    return json.data;
  });
}

module.exports = {
  detectMobileOperator: detectMobileOperator,
  normalizeIndianMobileDigits: normalizeIndianMobileDigits,
  MARG_MOBILE_DETECT_OPERATOR_URL: MARG_MOBILE_DETECT_OPERATOR_URL,
};
