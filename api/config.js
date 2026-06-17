/* Upstream API — default is deployed Cloud Run, not local marg_api. */
var PROD_MARG_API = "https://marg-api-548031081093.asia-south1.run.app";
var LOCAL_MARG_API = "http://localhost:3002";

function resolveMargApiBaseUrl() {
  if (process.env.MARG_API_BASE_URL) {
    return String(process.env.MARG_API_BASE_URL).trim();
  }
  if (process.env.USE_LOCAL_MARG_API === "1" || process.env.USE_LOCAL_MARG_API === "true") {
    return LOCAL_MARG_API;
  }
  return PROD_MARG_API;
}

var MARG_API_BASE_URL = resolveMargApiBaseUrl();

function buildMargApiUrl(pathname) {
  var base = String(MARG_API_BASE_URL || "").replace(/\/+$/, "");
  var path = String(pathname || "").replace(/^\/+/, "");
  return base + "/" + path;
}

module.exports = {
  MARG_API_BASE_URL: MARG_API_BASE_URL,
  PROD_MARG_API: PROD_MARG_API,
  LOCAL_MARG_API: LOCAL_MARG_API,
  buildMargApiUrl: buildMargApiUrl,
};
