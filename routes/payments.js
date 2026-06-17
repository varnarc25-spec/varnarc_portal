var express = require("express");
var paymentsApi = require("../api/services/payments");

var router = express.Router();

function readBearer(req) {
  var h = req.get("authorization") || req.get("Authorization") || "";
  var m = /^Bearer\s+(.+)$/i.exec(String(h));
  return m && m[1] ? String(m[1]).trim() : "";
}

function forward(handler) {
  return function (req, res) {
    var token = readBearer(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Sign in required. Use a Firebase ID token in the Authorization header.",
        data: null,
      });
    }
    handler(token, req, res).catch(function (err) {
      var msg = err && err.message ? String(err.message) : "Payment request failed.";
      var status = err && err.statusCode ? err.statusCode : 400;
      res.status(status).json({ success: false, message: msg, data: null });
    });
  };
}

router.post(
  "/api/payments/create-order",
  forward(function (token, req, res) {
    return paymentsApi.createOrder(token, req.body || {}).then(function (json) {
      res.status(json && json.success === false ? 400 : 201).json(json);
    });
  })
);

router.post(
  "/api/payments/verify",
  forward(function (token, req, res) {
    var orderId = (req.body && (req.body.order_id || req.body.orderId)) || "";
    return paymentsApi.verifyPayment(token, orderId).then(function (json) {
      res.json(json);
    });
  })
);

router.get(
  "/api/payments/history",
  forward(function (token, req, res) {
    return paymentsApi
      .fetchHistory(token, {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        search: req.query.search,
        menu_item_slug: req.query.menu_item_slug,
      })
      .then(function (json) {
        res.json(json);
      });
  })
);

router.get(
  "/api/payments/status/:order_id",
  forward(function (token, req, res) {
    return paymentsApi.fetchStatus(token, req.params.order_id).then(function (json) {
      res.json(json);
    });
  })
);

router.post(
  "/api/payments/refund",
  forward(function (token, req, res) {
    return paymentsApi.requestRefund(token, req.body || {}).then(function (json) {
      res.status(202).json(json);
    });
  })
);

module.exports = router;
