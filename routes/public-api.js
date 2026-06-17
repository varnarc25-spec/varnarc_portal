var express = require("express");
var { buildMargApiUrl } = require("../api/config");
var { fetchJsonHttps, fetchTextHttps } = require("../api/http-client");
var { isAllowedAssetUrl } = require("../lib/allowed-asset-url");

var router = express.Router();

/** Same-origin proxy for Marg public company info (avoids browser CORS). */
router.get("/api/company-info", function (req, res) {
  fetchJsonHttps(buildMargApiUrl("/api/company-info"))
    .then(function (json) {
      res.json(json);
    })
    .catch(function (error) {
      res.status(502).json({
        success: false,
        message: (error && error.message) || "Failed to load company info.",
        data: null,
        error: (error && error.message) || "upstream_error",
      });
    });
});

/** Same-origin proxy for remote SVG icons (GCS / Marg) used on the landing page. */
router.get("/api/proxy/svg", function (req, res) {
  var target = req.query && req.query.url ? String(req.query.url).trim() : "";
  if (!target) {
    return res.status(400).send("url query parameter is required.");
  }
  if (!isAllowedAssetUrl(target)) {
    return res.status(403).send("URL not allowed.");
  }

  fetchTextHttps(target, { accept: "image/svg+xml,text/plain,*/*" })
    .then(function (result) {
      res.setHeader("Content-Type", result.contentType || "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=300");
      res.send(result.body);
    })
    .catch(function (error) {
      res.status(502).send((error && error.message) || "Failed to load SVG.");
    });
});

module.exports = router;
