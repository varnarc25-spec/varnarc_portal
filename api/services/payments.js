var postJsonHttps = require("../http-client").postJsonHttps;
var fetchJsonHttps = require("../http-client").fetchJsonHttps;
var buildMargApiUrl = require("../config").buildMargApiUrl;

function authHeaders(idToken) {
  return { Authorization: "Bearer " + idToken };
}

function createOrder(idToken, body) {
  return postJsonHttps(buildMargApiUrl("/api/payment/create-order"), body, {
    headers: authHeaders(idToken),
  });
}

function verifyPayment(idToken, orderId) {
  return postJsonHttps(
    buildMargApiUrl("/api/payment/verify"),
    { order_id: orderId },
    { headers: authHeaders(idToken) }
  );
}

function fetchHistory(idToken, query) {
  var qs = new URLSearchParams(query || {}).toString();
  var path = "/api/payment/history" + (qs ? "?" + qs : "");
  return fetchJsonHttps(buildMargApiUrl(path), {
    headers: authHeaders(idToken),
  });
}

function fetchStatus(idToken, orderId) {
  return fetchJsonHttps(buildMargApiUrl("/api/payment/status/" + encodeURIComponent(orderId)), {
    headers: authHeaders(idToken),
  });
}

function requestRefund(idToken, body) {
  return postJsonHttps(buildMargApiUrl("/api/payment/refund"), body, {
    headers: authHeaders(idToken),
  });
}

module.exports = {
  createOrder: createOrder,
  verifyPayment: verifyPayment,
  fetchHistory: fetchHistory,
  fetchStatus: fetchStatus,
  requestRefund: requestRefund,
};
