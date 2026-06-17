var apiConfig = require("../api/config");

function margApiHostname() {
  try {
    return new URL(apiConfig.MARG_API_BASE_URL).hostname;
  } catch (e) {
    return "";
  }
}

/**
 * Whether the portal may proxy this remote asset URL (SVG, images from GCS / Marg API).
 * @param {string} urlStr
 */
function isAllowedAssetUrl(urlStr) {
  try {
    var u = new URL(String(urlStr || "").trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    var host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host === margApiHostname()) return true;
    if (host === "storage.googleapis.com") return true;
    if (host === "firebasestorage.googleapis.com") return true;
    if (host.endsWith(".googleapis.com")) return true;
    if (host.endsWith(".run.app")) return true;
    if (host.endsWith(".firebasestorage.app")) return true;
    return false;
  } catch (e) {
    return false;
  }
}

module.exports = {
  isAllowedAssetUrl: isAllowedAssetUrl,
};
