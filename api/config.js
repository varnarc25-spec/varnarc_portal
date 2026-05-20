/* Upstream Marg calls use api/http-client.js — set MARG_HTTP_TIMEOUT_MS (ms) to override default 120s. */
var PROD_MARG_API = "https://marg-api-548031081093.asia-south1.run.app";
var LOCAL_MARG_API = "http://localhost:3002";
/* Local dev: use LOCAL_MARG_API (marg_api with DISABLE_RATE_LIMIT=true). Avoid prod URL — it rate-limits. */
var MARG_API_BASE_URL =
  process.env.MARG_API_BASE_URL ||
  (process.env.NODE_ENV === "production" ? PROD_MARG_API : LOCAL_MARG_API);

function buildMargApiUrl(pathname) {
  var base = String(MARG_API_BASE_URL || "").replace(/\/+$/, "");
  var path = String(pathname || "").replace(/^\/+/, "");
  return base + "/" + path;
}

module.exports = {
  MARG_API_BASE_URL: MARG_API_BASE_URL,
  buildMargApiUrl: buildMargApiUrl,
};
