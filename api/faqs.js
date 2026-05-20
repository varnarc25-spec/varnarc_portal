var fetchJsonHttps = require("./http-client").fetchJsonHttps;
var buildMargApiUrl = require("./config").buildMargApiUrl;

var MARG_PUBLIC_FAQS_URL =
  process.env.MARG_PUBLIC_FAQS_URL ||
  buildMargApiUrl("/api/public/faqs");

function fetchPublicFaqs() {
  console.log("[landing] public faqs request:", MARG_PUBLIC_FAQS_URL);
  return fetchJsonHttps(MARG_PUBLIC_FAQS_URL)
    .then(function (json) {
      if (!json || !json.success || !Array.isArray(json.data)) {
        return [];
      }
      return json.data;
    })
    .catch(function (err) {
      console.error("[landing] MARG public FAQs fetch failed:", err && err.message ? err.message : err);
      return [];
    });
}

module.exports = {
  fetchPublicFaqs: fetchPublicFaqs,
};
