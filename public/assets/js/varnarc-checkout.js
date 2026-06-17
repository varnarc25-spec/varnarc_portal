/**
 * Shared Cashfree checkout for Varnarc portal hub pages.
 * Requires: https://sdk.cashfree.com/js/v3/cashfree.js (loaded on demand)
 * Auth: localStorage varnarc_auth_token (Firebase ID token)
 */
(function (global) {
  var SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";
  var AUTH_TOKEN_KEY = "varnarc_auth_token";
  var AUTH_USER_KEY = "varnarc_auth_user";

  function getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY) || "";
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function loadSdk() {
    return new Promise(function (resolve, reject) {
      if (global.Cashfree) return resolve(global.Cashfree);
      var s = document.createElement("script");
      s.src = SDK_URL;
      s.async = true;
      s.onload = function () {
        resolve(global.Cashfree);
      };
      s.onerror = function () {
        reject(new Error("Cashfree SDK failed to load"));
      };
      document.head.appendChild(s);
    });
  }

  function apiPost(path, body) {
    var token = getToken();
    if (!token) {
      return Promise.reject(new Error("Please sign in to continue."));
    }
    return fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(body || {}),
    }).then(function (res) {
      return res.json().then(function (json) {
        if (!res.ok || json.success === false) {
          throw new Error(json.message || "Payment API error");
        }
        return json;
      });
    });
  }

  function resolveMode() {
    var cfg = global.VARNARC_CHECKOUT_CONFIG || {};
    return (cfg.cashfreeMode || "sandbox").toLowerCase();
  }

  /**
   * @param {Object} opts
   * @param {number} opts.amount
   * @param {string} [opts.phone]
   * @param {string} [opts.name]
   * @param {string} [opts.email]
   * @param {string} [opts.menuItemSlug]
   * @param {string} [opts.sectionSlug]
   * @param {string} [opts.orderNote]
   */
  function startCheckout(opts) {
    var user = getUser();
    var phone = (opts.phone || user.phone || "")
      .replace(/\D/g, "")
      .slice(-10);
    if (!phone || phone.length !== 10) {
      return Promise.reject(new Error("Valid 10-digit phone required for payment."));
    }

    var payload = {
      amount: Number(opts.amount),
      phone: phone,
      name: opts.name || user.displayName || user.name || "Customer",
      email: opts.email || user.email || undefined,
      menu_item_slug: opts.menuItemSlug || opts.menu_item_slug || undefined,
      section_slug: opts.sectionSlug || opts.section_slug || undefined,
      order_note: opts.orderNote || undefined,
    };

    return apiPost("/api/payments/create-order", payload).then(function (createRes) {
      var data = createRes.data || {};
      var sessionId = data.payment_session_id;
      var orderId = data.order_id;
      if (!sessionId) throw new Error("Missing payment session");

      return loadSdk().then(function (Cashfree) {
        var cf = Cashfree({ mode: resolveMode() });
        return cf
          .checkout({ paymentSessionId: sessionId, redirectTarget: "_modal" })
          .then(function () {
            return apiPost("/api/payments/verify", { order_id: orderId }).then(function (verifyRes) {
              return {
                orderId: orderId,
                verify: verifyRes.data || verifyRes,
                create: data,
              };
            });
          });
      });
    });
  }

  global.VarnarcCheckout = {
    start: startCheckout,
    getToken: getToken,
  };
})(window);
