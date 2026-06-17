/**
 * Quick access for mobile recharge hub (pick + recharge steps).
 */
(function () {
  "use strict";

  var STORAGE_RECENT = "varnarc_recharge_recent";
  var STORAGE_SAVED = "varnarc_recharge_saved_numbers";
  var AUTH_USER_KEY = "varnarc_auth_user";
  var MAX_RECENT = 4;
  var MAX_SAVED = 6;

  function readJson(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function normalizeIndianMobile(v) {
    var d = String(v || "").replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
    return d.slice(0, 10);
  }

  function isValidIndianMobileTen(d) {
    return /^[6-9]\d{9}$/.test(String(d || ""));
  }

  function mountQuickAccess(root, options) {
    if (!root) return;
    options = options || {};

    var wrap = root.querySelector("[data-mobile-quick-access]");
    if (!wrap) return;

    var ownRow = wrap.querySelector("[data-mr-quick-own]");
    var ownBtn = wrap.querySelector("[data-mr-quick-own-btn]");
    var recentHost = wrap.querySelector("[data-mr-quick-recent]");
    var savedHost = wrap.querySelector("[data-mr-quick-saved]");

    var auth = readJson(AUTH_USER_KEY, null);
    var recent = readJson(STORAGE_RECENT, []);
    var saved = readJson(STORAGE_SAVED, []);

    if (recentHost) recentHost.innerHTML = "";
    if (savedHost) savedHost.innerHTML = "";

    var selfNum = auth && auth.phoneNumber ? normalizeIndianMobile(auth.phoneNumber) : "";
    var hasOwn = selfNum.length === 10 && isValidIndianMobileTen(selfNum);

    if (ownRow) ownRow.hidden = !hasOwn;
    if (ownBtn && hasOwn) ownBtn.setAttribute("data-quick-number", selfNum);

    var show = !!auth;

    wrap.hidden = !show;
    if (!show) return;

    if (recentHost && recent.length) {
      recent.slice(0, MAX_RECENT).forEach(function (r) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "hub-quick-access__pill";
        b.setAttribute("data-quick-recharge", "1");
        b.setAttribute("data-mobile", r.mobile || "");
        b.setAttribute("data-operator", r.operator || "");
        var op = r.operator ? String(r.operator).toUpperCase() + " · " : "";
        b.textContent = op + "+91 " + String(r.mobile) + " · ₹" + String(r.amount || "—");
        recentHost.appendChild(b);
      });
    } else if (recentHost) {
      recentHost.innerHTML = '<p class="hub-quick-access__empty">No recent recharges yet.</p>';
    }

    if (savedHost && auth && saved.length) {
      saved.slice(0, MAX_SAVED).forEach(function (num) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "hub-quick-access__pill";
        b.setAttribute("data-quick-number", num);
        b.textContent = "+91 " + num;
        savedHost.appendChild(b);
      });
    } else if (savedHost && auth) {
      savedHost.innerHTML = '<p class="hub-quick-access__empty">Save numbers after your first recharge.</p>';
    }
  }

  function wireQuickActions(hubRoot, options) {
    if (!hubRoot || hubRoot.getAttribute("data-mr-quick-wired") === "1") return;
    hubRoot.setAttribute("data-mr-quick-wired", "1");

    var mobileEl = document.getElementById("recharge-mobile");
    var operatorEl = document.getElementById("recharge-operator");
    var onAfterPick = options && options.onAfterPick;

    hubRoot.addEventListener("click", function (e) {
      var quickRecharge = e.target.closest("[data-quick-recharge]");
      if (quickRecharge) {
        if (mobileEl) mobileEl.value = normalizeIndianMobile(quickRecharge.getAttribute("data-mobile") || "");
        if (operatorEl) {
          operatorEl.value = quickRecharge.getAttribute("data-operator") || "";
          try {
            operatorEl.dispatchEvent(new Event("change", { bubbles: true }));
          } catch (err) {}
        }
        if (typeof onAfterPick === "function") onAfterPick();
        return;
      }

      var quickNumber = e.target.closest("[data-quick-number]");
      if (quickNumber) {
        if (mobileEl) mobileEl.value = normalizeIndianMobile(quickNumber.getAttribute("data-quick-number") || "");
        if (typeof onAfterPick === "function") onAfterPick();
      }
    });
  }

  function initMobileRechargeQuickAccess(hubRoot) {
    if (!hubRoot) return;

    var rechargeStep = hubRoot.querySelector('[data-mobile-recharge-step="recharge"]');
    var pickStep = hubRoot.querySelector('[data-mobile-recharge-step="pick"]');

    function goToRecharge() {
      if (pickStep) pickStep.hidden = true;
      if (rechargeStep) rechargeStep.hidden = false;
      var mobileEl = document.getElementById("recharge-mobile");
      if (mobileEl) mobileEl.focus();
    }

    wireQuickActions(hubRoot, { onAfterPick: goToRecharge });

    [pickStep, rechargeStep].forEach(function (step) {
      if (!step) return;
      mountQuickAccess(step, { onAfterPick: step === pickStep ? goToRecharge : function () {} });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-mobile-recharge-hub]").forEach(initMobileRechargeQuickAccess);
  });

  document.addEventListener("hub-panel-activated", function (ev) {
    if (ev.detail && ev.detail.panelId !== "mobile_recharge" && ev.detail.panelId !== "mobile") return;
    document.querySelectorAll("[data-mobile-recharge-hub]").forEach(function (hubRoot) {
      hubRoot.removeAttribute("data-mr-quick-wired");
      initMobileRechargeQuickAccess(hubRoot);
    });
  });

  window.VARNARC_MOUNT_MOBILE_QUICK_ACCESS = mountQuickAccess;
})();
