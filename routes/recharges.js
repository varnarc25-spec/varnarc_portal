var express = require("express");
var detectMobileOperator = require("../api/services/mobile-detect-operator").detectMobileOperator;
var fetchMobileRechargePlans = require("../api/services/mobile-recharge-plans").fetchMobileRechargePlans;
var fetchDthOperators = require("../api/services/dth-operators").fetchDthOperators;
var fetchDthRechargePlans = require("../api/services/dth-recharge-plans").fetchDthRechargePlans;

var router = express.Router();

function readBearer(req) {
  var h = req.get("authorization") || req.get("Authorization") || "";
  var m = /^Bearer\s+(.+)$/i.exec(String(h));
  return m && m[1] ? String(m[1]).trim() : "";
}

router.post("/api/recharges/mobile/detect-operator", function (req, res) {
  var token = readBearer(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Sign in required. Use a Firebase ID token in the Authorization header.",
      data: null,
    });
  }

  var mobileNumber = req.body && req.body.mobileNumber;
  var body = req.body || {};
  var includePlans =
    !(body.includePlans === false || body.includePlans === "false");
  detectMobileOperator(mobileNumber, {
    idToken: token,
    includePlans: includePlans,
    type: body.type,
    planLimit: body.planLimit,
  })
    .then(function (data) {
      res.json({
        success: true,
        message: "Operator detected",
        data: data,
      });
    })
    .catch(function (err) {
      var msg =
        err && err.message ? String(err.message) : "Operator detection failed.";
      res.status(400).json({ success: false, message: msg, data: null });
    });
});

router.get("/api/recharges/dth/operators", function (req, res) {
  fetchDthOperators()
    .then(function (items) {
      res.json({
        success: true,
        message: "DTH operators fetched",
        data: items,
      });
    })
    .catch(function (err) {
      var msg =
        err && err.message ? String(err.message) : "DTH operators request failed.";
      res.status(502).json({ success: false, message: msg, data: null });
    });
});

router.post("/api/recharges/dth/plans", function (req, res) {
  var token = readBearer(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Sign in required. Use a Firebase ID token in the Authorization header.",
      data: null,
    });
  }

  var body = req.body || {};
  fetchDthRechargePlans({
    operatorId: body.operatorId,
    subscriberId: body.subscriberId,
    idToken: token,
  })
    .then(function (plans) {
      res.json({
        success: true,
        message: "DTH plans fetched",
        data: plans,
      });
    })
    .catch(function (err) {
      var msg = err && err.message ? String(err.message) : "DTH plans request failed.";
      res.status(400).json({ success: false, message: msg, data: null });
    });
});

router.post("/api/recharges/mobile/plans", function (req, res) {
  var token = readBearer(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Sign in required. Use a Firebase ID token in the Authorization header.",
      data: null,
    });
  }

  var body = req.body || {};
  fetchMobileRechargePlans({
    mobileNumber: body.mobileNumber,
    operatorId: body.operatorId,
    type: body.type,
    idToken: token,
  })
    .then(function (plans) {
      res.json({
        success: true,
        message: "Plans fetched",
        data: plans,
      });
    })
    .catch(function (err) {
      var msg = err && err.message ? String(err.message) : "Plans request failed.";
      res.status(400).json({ success: false, message: msg, data: null });
    });
});

module.exports = router;
