/**
 * Mobile recharge UX: Indian mobile validation, plan cards, sticky CTA, personalization.
 *
 * Remote operator lookup (optional): set window.VARNARC_RECHARGE_UI.operatorLookupUrlTemplate to a GET URL containing "{mobile}" replaced with 10-digit number — response JSON expects { operator: "airtel"|"jio"|"vi"|"bsnl" }.
 *
 * Fetch button: POSTs to margDetectUrl with plans (includePlans). Plans are grouped by API `category` tabs when multiple categories exist. Requires
 * `varnarc_auth_token` in localStorage (Firebase ID token). API responses are logged to the console.
 */
(function () {
  var STORAGE_RECENT = "varnarc_recharge_recent";
  var STORAGE_SAVED = "varnarc_recharge_saved_numbers";
  var AUTH_USER_KEY = "varnarc_auth_user";
  var AUTH_TOKEN_KEY = "varnarc_auth_token";
  var MAX_RECENT = 4;
  var MAX_SAVED = 6;

  var PREFIX_HINTS = {
    "8100": "airtel",
    "8101": "airtel",
    "8103": "airtel",
    "8112": "airtel",
    "8130": "airtel",
    "6391": "jio",
    "6395": "jio",
    "6399": "jio",
    "6300": "jio",
    "6305": "jio",
    "6200": "jio",
    "8309": "vi",
    "8310": "vi",
    "8369": "vi",
    "9400": "bsnl",
    "9477": "bsnl",
    "9478": "bsnl",
    "9479": "bsnl"
  };

  var PLAN_TEMPLATES = {
    airtel: [
      {
        id: "best",
        badge: "Best Value",
        badgeClass: "",
        price: 349,
        validity: "84 days",
        data: "1.5GB/day",
        benefits: "Unlimited calls"
      },
      {
        id: "popular",
        badge: "Popular",
        badgeClass: "recharge-plan-card__badge--accent",
        price: 289,
        validity: "28 days",
        data: "1.5GB/day",
        benefits: "Weekend bonus data"
      },
      {
        id: "data",
        badge: "Data Pack",
        badgeClass: "recharge-plan-card__badge--muted",
        price: 121,
        validity: "30 days",
        data: "12GB total",
        benefits: "Great for hotspots"
      }
    ],
    jio: [
      {
        id: "best",
        badge: "Best Value",
        badgeClass: "",
        price: 349,
        validity: "84 days",
        data: "1.5GB/day",
        benefits: "Calls + Jio apps"
      },
      {
        id: "popular",
        badge: "Popular",
        badgeClass: "recharge-plan-card__badge--accent",
        price: 399,
        validity: "84 days",
        data: "2GB/day",
        benefits: "Most loved pack"
      },
      {
        id: "data",
        badge: "Data Pack",
        badgeClass: "recharge-plan-card__badge--muted",
        price: 119,
        validity: "base plan",
        data: "Data booster",
        benefits: "Add-on style data"
      }
    ],
    vi: [
      {
        id: "best",
        badge: "Best Value",
        badgeClass: "",
        price: 359,
        validity: "84 days",
        data: "1.5GB/day",
        benefits: "Vi Hero benefits"
      },
      {
        id: "popular",
        badge: "Popular",
        badgeClass: "recharge-plan-card__badge--accent",
        price: 299,
        validity: "28 days",
        data: "1.5GB/day",
        benefits: "Weekend data"
      },
      {
        id: "data",
        badge: "Data Pack",
        badgeClass: "recharge-plan-card__badge--muted",
        price: 118,
        validity: "30 days",
        data: "12GB",
        benefits: "Data packs"
      }
    ],
    bsnl: [
      {
        id: "best",
        badge: "Best Value",
        badgeClass: "",
        price: 239,
        validity: "30 days",
        data: "2GB/day",
        benefits: "BSNL validity plans"
      },
      {
        id: "popular",
        badge: "Popular",
        badgeClass: "recharge-plan-card__badge--accent",
        price: 299,
        validity: "60 days",
        data: "2GB/day",
        benefits: "Longer validity"
      },
      {
        id: "data",
        badge: "Data Pack",
        badgeClass: "recharge-plan-card__badge--muted",
        price: 98,
        validity: "18 days",
        data: "6GB",
        benefits: "Light users"
      }
    ],
    default: [
      {
        id: "best",
        badge: "Best Value",
        badgeClass: "",
        price: 299,
        validity: "28 days",
        data: "1.5GB/day",
        benefits: "Calls + daily data"
      },
      {
        id: "popular",
        badge: "Popular",
        badgeClass: "recharge-plan-card__badge--accent",
        price: 349,
        validity: "84 days",
        data: "1.5GB/day",
        benefits: "Most picked plan"
      },
      {
        id: "data",
        badge: "Data Pack",
        badgeClass: "recharge-plan-card__badge--muted",
        price: 121,
        validity: "30 days",
        data: "12GB total",
        benefits: "Flexible top-ups"
      }
    ]
  };

  function readJson(key, fb) {
    try {
      var r = window.localStorage.getItem(key);
      return r ? JSON.parse(r) : fb;
    } catch (e) {
      return fb;
    }
  }

  function writeJson(key, v) {
    try {
      window.localStorage.setItem(key, JSON.stringify(v));
    } catch (e) {}
  }

  function normalizeIndianMobile(raw) {
    var d = String(raw || "").replace(/\D/g, "");
    if (d.length === 12 && d.slice(0, 2) === "91") return d.slice(2);
    if (d.length === 11 && d.charAt(0) === "0") return d.slice(1);
    return d.slice(0, 10);
  }

  function isValidIndianMobileTen(d) {
    return /^[6-9]\d{9}$/.test(d);
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function hintFromPrefix(d10, selectEl, hintEl) {
    if (!selectEl || d10.length !== 10) return;

    function tryLen(len) {
      return PREFIX_HINTS[d10.slice(0, len)] || null;
    }

    var op = tryLen(5) || tryLen(4);
    if (!op || !selectEl.querySelector('option[value="' + op + '"]')) {
      if (hintEl && (hintEl.textContent || "").indexOf("Detected") === -1)
        hintEl.textContent = "";
      return;
    }

    if (!(hintEl && hintEl.dataset && hintEl.dataset.userPickedOperator === "1"))
      selectEl.value = op;
    if (hintEl)
      hintEl.textContent =
        "Suggested operator (change if ported): " +
        (selectEl.options[selectEl.selectedIndex] &&
          selectEl.options[selectEl.selectedIndex].text.trim());
  }

  function fetchOperator(d10, selectEl, hintEl) {
    var cfg = window.VARNARC_RECHARGE_UI || {};
    var t = cfg.operatorLookupUrlTemplate;
    if (!t || typeof t !== "string") {
      hintFromPrefix(d10, selectEl, hintEl);
      return;
    }

    if (hintEl) hintEl.textContent = "Looking up operator…";
    fetch(t.replace(/\{mobile\}/g, encodeURIComponent(d10)), {
      credentials: "same-origin",
    })
      .then(function (res) {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(function (data) {
        if (!hintEl) return;
        var op = data.operator || data.operatorId;
        var circle = data.circle || "";
        if (op && selectEl.querySelector('option[value="' + op + '"]')) {
          selectEl.value = op;
          delete hintEl.dataset.userPickedOperator;
          hintEl.textContent =
            "Detected operator" +
            (circle ? " • " + circle : "") +
            ". Change if ported.";
          return;
        }
        hintFromPrefix(d10, selectEl, hintEl);
      })
      .catch(function () {
        hintFromPrefix(d10, selectEl, hintEl);
      });
  }

  function getPlansForOperator(opId) {
    return PLAN_TEMPLATES[opId] || PLAN_TEMPLATES.default;
  }

  /**
   * POST JSON; logs full URL, HTTP status, and parsed body to the console as `[recharge API]`.
   */
  function rechargeApiErrorText(parsed) {
    if (!parsed || typeof parsed !== "object") return "";
    if (parsed.message != null && String(parsed.message).trim())
      return String(parsed.message);
    if (typeof parsed.error === "string") return parsed.error;
    if (parsed.error && parsed.error.message) return String(parsed.error.message);
    return "";
  }

  function shouldForceReloginForFirebaseTokenError(messageStr, httpStatus) {
    var lower = String(messageStr || "").toLowerCase();
    if (!lower) return false;
    if (lower.indexOf("sign in required") !== -1) return false;
    if (lower.indexOf("authorization header missing") !== -1) return false;
    if (lower.indexOf("no token provided") !== -1) return false;
    if (lower.indexOf("invalid or expired firebase token") !== -1) return true;
    if (lower.indexOf("firebase") !== -1 && lower.indexOf("token") !== -1) {
      if (
        lower.indexOf("expired") !== -1 ||
        lower.indexOf("invalid") !== -1 ||
        lower.indexOf("revoked") !== -1
      )
        return true;
    }
    if (lower.indexOf("id-token") !== -1 && lower.indexOf("expired") !== -1) return true;
    if (lower.indexOf("id token") !== -1 && lower.indexOf("expired") !== -1)
      return true;
    if (httpStatus === 401 && lower.indexOf("token") !== -1) return true;
    return false;
  }

  /** Works even if dashboard-auth.js did not attach VARNARC_SESSION_EXPIRED */
  function triggerSessionExpiredRedirect(reason) {
    var msg =
      reason && String(reason).trim()
        ? String(reason).trim()
        : "Your session expired. Please sign in again.";
    try {
      if (typeof window.VARNARC_SESSION_EXPIRED === "function") {
        window.VARNARC_SESSION_EXPIRED(msg);
        return;
      }
    } catch (e) {}
    try {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      window.localStorage.removeItem(AUTH_USER_KEY);
    } catch (e2) {}
    try {
      window.sessionStorage.setItem("varnarc_relogin_notice", msg);
    } catch (e3) {}
    setTimeout(function () {
      window.location.replace("/");
    }, 0);
  }

  function postRechargeApi(url, body) {
    var token = "";
    try {
      token = window.localStorage.getItem(AUTH_TOKEN_KEY) || "";
    } catch (e) {}
    var headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = "Bearer " + token;
    return fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: headers,
      body: JSON.stringify(body || {}),
    }).then(function (res) {
      return res.text().then(function (text) {
        var parsed = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch (e) {
          parsed = { _parseError: true, _raw: text };
        }
        console.log("[recharge API]", url, { status: res.status, response: parsed });
        var failMsg =
          rechargeApiErrorText(parsed) ||
          (parsed && parsed.error && String(parsed.error)) ||
          "";
        var notOk = !res.ok || (parsed && parsed.success === false);
        if (notOk) {
          var combinedMsg = failMsg;
          if (
            token &&
            shouldForceReloginForFirebaseTokenError(combinedMsg, res.status)
          ) {
            triggerSessionExpiredRedirect(
              combinedMsg ||
                "Invalid or expired Firebase token. Please sign in again."
            );
          }
          throw new Error(failMsg || "Request failed (" + res.status + ")");
        }
        return parsed;
      });
    });
  }

  function mapDetectedOperatorToFormValue(operator, selectEl) {
    if (!operator || !selectEl) return "";
    var name = String(operator.name || "").toLowerCase();
    var id = String(operator.id || "").toLowerCase();
    var code = String(operator.code || "").toUpperCase();

    if (code === "AIR" || id === "air" || id === "airtel" || name.indexOf("airtel") !== -1)
      return "airtel";
    if (code === "JIO" || id === "jio" || name.indexOf("jio") !== -1) return "jio";
    if (
      code === "VI" ||
      code === "VOD" ||
      id === "vi" ||
      name.indexOf("vodafone") !== -1 ||
      name.indexOf("idea") !== -1
    )
      return "vi";
    if (code === "BSNL" || id === "bsnl" || name.indexOf("bsnl") !== -1) return "bsnl";

    if (selectEl.querySelector('option[value="' + id + '"]')) return id;
    return "";
  }

  function clearPlanCategoryTabs(tabsEl) {
    if (!tabsEl) return;
    tabsEl.innerHTML = "";
    tabsEl.classList.add("d-none");
  }

  function categoryLabelFromPlan(p) {
    var c = p && p.category != null ? String(p.category).trim() : "";
    return c || "Other";
  }

  function groupPlansByCategory(plans) {
    var order = [];
    var byCategory = {};
    (Array.isArray(plans) ? plans : []).forEach(function (p) {
      var key = categoryLabelFromPlan(p);
      if (!byCategory[key]) {
        byCategory[key] = [];
        order.push(key);
      }
      byCategory[key].push(p);
    });
    order.forEach(function (key) {
      byCategory[key].sort(function (a, b) {
        return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      });
    });
    return { order: order, byCategory: byCategory };
  }

  var MAX_PLAN_CARDS_PER_TAB = 80;

  function renderPlanCardsIntoGrid(grid, list, amountEl, cb) {
    if (!grid) return 0;
    grid.innerHTML = "";
    var n = 0;
    (Array.isArray(list) ? list : []).slice(0, MAX_PLAN_CARDS_PER_TAB).forEach(function (p) {
      var amount = Number(p.amount);
      if (isNaN(amount)) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "recharge-plan-card";
      var typeLbl = p.plan_type || p.kwikPlanType || "";
      var badge = p.isBestValue ? "Best value" : String(typeLbl || "Plan").slice(0, 24);
      if (!badge) badge = "Plan";
      var badgeClass = p.isBestValue
        ? "recharge-plan-card__badge--accent"
        : "recharge-plan-card__badge--muted";
      var meta =
        escapeHtml(String(p.name || "")) +
        (p.validity ? "<br>" + escapeHtml(String(p.validity)) : "");
      if (p.dataAllowance)
        meta += "<br>" + escapeHtml(String(p.dataAllowance));
      var desc = p.description ? String(p.description).slice(0, 140) : "";
      if (desc) meta += "<br>" + escapeHtml(desc);
      btn.innerHTML =
        '<span class="recharge-plan-card__badge ' +
        badgeClass +
        '">' +
        escapeHtml(badge) +
        '</span><div class="recharge-plan-card__price">₹<span>' +
        escapeHtml(String(amount)) +
        '</span></div><div class="recharge-plan-card__meta">' +
        meta +
        "</div>";
      btn.addEventListener("click", function () {
        grid.querySelectorAll(".recharge-plan-card").forEach(function (el) {
          el.classList.remove("is-selected");
        });
        btn.classList.add("is-selected");
        amountEl.value = String(amount);
        if (cb) cb(true);
      });
      grid.appendChild(btn);
      n += 1;
    });
    return n;
  }

  /**
   * Renders Marg API plans; if multiple `category` values exist, shows horizontal category tabs.
   */
  function renderApiPlansWithCategoryTabs(tabsEl, grid, plans, amountEl, cb) {
    clearPlanCategoryTabs(tabsEl);
    if (!grid) {
      if (cb) cb(false);
      return;
    }
    grid.innerHTML = "";
    var list = Array.isArray(plans) ? plans : [];
    if (!list.length) {
      if (cb) cb(false);
      return;
    }
    var g = groupPlansByCategory(list);
    function renderOneCategory(catKey) {
      renderPlanCardsIntoGrid(grid, g.byCategory[catKey], amountEl, cb);
    }
    if (!tabsEl || g.order.length <= 1) {
      renderOneCategory(g.order[0]);
      if (cb) cb(true);
      return;
    }
    tabsEl.classList.remove("d-none");
    function activate(idx) {
      var tabs = tabsEl.querySelectorAll(".recharge-plan-tab");
      tabs.forEach(function (t, i) {
        t.setAttribute("aria-selected", i === idx ? "true" : "false");
        t.classList.toggle("is-active", i === idx);
      });
      renderOneCategory(g.order[idx]);
    }
    g.order.forEach(function (cat, idx) {
      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "recharge-plan-tab" + (idx === 0 ? " is-active" : "");
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", idx === 0 ? "true" : "false");
      var count = g.byCategory[cat] ? g.byCategory[cat].length : 0;
      tab.innerHTML =
        '<span class="recharge-plan-tab__label">' +
        escapeHtml(cat) +
        '</span><span class="recharge-plan-tab__count">' +
        count +
        "</span>";
      tab.addEventListener("click", function () {
        activate(idx);
      });
      tabsEl.appendChild(tab);
    });
    activate(0);
    if (cb) cb(true);
  }

  function renderPlans(grid, tabsEl, opId, amountEl, cb) {
    if (!grid) return;
    clearPlanCategoryTabs(tabsEl);
    var cards = getPlansForOperator(opId);
    var selectedPrice = parseFloat(String(amountEl.value || "").trim());
    grid.innerHTML = "";
    cards.forEach(function (c) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "recharge-plan-card";
      if (!isNaN(selectedPrice) && selectedPrice === c.price) btn.classList.add("is-selected");
      btn.setAttribute("data-price", String(c.price));
      btn.innerHTML =
        '<span class="recharge-plan-card__badge ' +
        (c.badgeClass || "") +
        '">' +
        escapeHtml(c.badge) +
        '</span><div class="recharge-plan-card__price">₹<span>' +
        escapeHtml(String(c.price)) +
        '</span></div><div class="recharge-plan-card__meta">' +
        escapeHtml(c.data) +
        "<br>" +
        escapeHtml(c.validity) +
        "<br>" +
        escapeHtml(c.benefits) +
        "</div>";
      btn.addEventListener("click", function () {
        grid.querySelectorAll(".recharge-plan-card").forEach(function (n) {
          n.classList.remove("is-selected");
        });
        btn.classList.add("is-selected");
        amountEl.value = String(c.price);
        cb(true);
      });
      grid.appendChild(btn);
    });
  }

  function updateProgress(detailsOk, amountOk, steps) {
    if (!steps || steps.length < 3) return;
    steps.forEach(function (el) {
      el.classList.remove("is-done", "is-active");
    });
    if (!detailsOk) {
      steps[0].classList.add("is-active");
      return;
    }
    steps[0].classList.add("is-done");
    if (!amountOk) {
      steps[1].classList.add("is-active");
      return;
    }
    steps[1].classList.add("is-done");
    steps[2].classList.add("is-active", "is-done");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var cfg = document.getElementById("varnarc-recharge-ui-config");
    if (cfg) {
      try {
        window.VARNARC_RECHARGE_UI =
          window.VARNARC_RECHARGE_UI ||
          {};
        Object.assign(
          window.VARNARC_RECHARGE_UI,
          JSON.parse(cfg.textContent || "{}")
        );
      } catch (e) {}
    }

    function hasMobileRechargeClientSession() {
      try {
        var t = window.localStorage.getItem(AUTH_TOKEN_KEY);
        var u = window.localStorage.getItem(AUTH_USER_KEY);
        if (!t || !u) return false;
        JSON.parse(u);
        return true;
      } catch (e) {
        return false;
      }
    }

    if (!hasMobileRechargeClientSession()) {
      window.location.replace("/");
      return;
    }

    var form = document.getElementById("mobile-recharge-form");
    if (!form) return;

    var mobileEl = document.getElementById("recharge-mobile");
    var operatorEl = document.getElementById("recharge-operator");
    var amountEl = document.getElementById("recharge-amount");
    var mobileFb = document.getElementById("recharge-mobile-feedback");
    var opHintEl = document.getElementById("operator-hint-text");
    var opLogoWrap = document.getElementById("recharge-operator-logo-wrap");
    var opLogoImg = document.getElementById("recharge-operator-logo");
    var planSection = document.getElementById("recharge-plan-picker");
    var planTabsEl = document.getElementById("recharge-plan-category-tabs");
    var planGrid = document.getElementById("recharge-plan-grid");
    var stickyBtn = document.getElementById("recharge-sticky-submit");
    var mainBtn = document.getElementById("recharge-main-submit");
    var verifyMobileBtn = document.getElementById("recharge-mobile-verify-btn");

    var progressSteps = Array.prototype.slice.call(
      document.querySelectorAll(".recharge-flow-steps__segment")
    );

    var personalizeEl = document.getElementById("recharge-personalized");

    /** When true, grid was filled from Marg API; skip template plan cards until user edits number or operator. */
    var lastPlansFromApi = false;

    function getConnectionPlanType() {
      var post = document.getElementById("recharge-postpaid");
      if (post && post.checked) return "postpaid";
      return "prepaid";
    }

    function clearDetectedOperatorLogo() {
      if (!opLogoWrap || !opLogoImg) return;
      opLogoImg.onerror = null;
      opLogoWrap.classList.add("d-none");
      opLogoImg.removeAttribute("src");
      opLogoImg.alt = "";
    }

    function setDetectedOperatorLogo(operator) {
      if (!opLogoWrap || !opLogoImg) return;
      var raw =
        operator &&
        (operator.logoUrl != null
          ? operator.logoUrl
          : operator.logo_url != null
            ? operator.logo_url
            : "");
      var url = raw != null ? String(raw).trim() : "";
      if (!url) {
        clearDetectedOperatorLogo();
        return;
      }
      opLogoImg.onerror = function () {
        clearDetectedOperatorLogo();
      };
      opLogoImg.src = url;
      opLogoImg.alt =
        operator && operator.name
          ? String(operator.name).trim() + " logo"
          : "Operator logo";
      opLogoWrap.classList.remove("d-none");
    }

    operatorEl.addEventListener("change", function () {
      lastPlansFromApi = false;
      clearDetectedOperatorLogo();
      if (opHintEl) opHintEl.dataset.userPickedOperator = "1";
      syncEverything();
    });

    function syncPlans() {
      var d = normalizeIndianMobile(mobileEl.value);
      var op = operatorEl.value;
      if (planSection && planGrid && isValidIndianMobileTen(d) && op) {
        planSection.classList.remove("d-none");
        if (!lastPlansFromApi) {
          renderPlans(planGrid, planTabsEl, op, amountEl, function () {
            syncEverything();
          });
        }
      } else if (planSection) {
        planSection.classList.add("d-none");
      }
    }

    function syncEverything() {
      var d = normalizeIndianMobile(mobileEl.value);

      mobileEl.value = d;

      mobileEl.classList.toggle("is-valid", isValidIndianMobileTen(d));
      mobileEl.classList.toggle(
        "is-invalid",
        d.length === 10 && !isValidIndianMobileTen(d)
      );

      if (mobileFb) {
        mobileFb.className = "field-feedback";
        mobileFb.textContent = "";
        if (!d.length) ;
        else if (!isValidIndianMobileTen(d)) {
          mobileFb.classList.add("is-invalid");
          mobileFb.textContent = "Enter a valid 10-digit Indian number (starts with 6–9).";
        } else {
          mobileFb.classList.add("is-valid");
          mobileFb.textContent = "Looks good!";
        }
      }

      var detailsOk =
        isValidIndianMobileTen(d) &&
        operatorEl.value &&
        operatorEl.selectedIndex > -1 &&
        !!operatorEl.options[operatorEl.selectedIndex].value;

      var amt = parseFloat(String(amountEl.value || "").trim());
      var amountOk = !isNaN(amt) && amt >= 10 && amt <= 99999;

      var enable = detailsOk && amountOk;
      if (mainBtn) mainBtn.disabled = !enable;
      if (stickyBtn) stickyBtn.disabled = !enable;

      updateProgress(detailsOk, amountOk, progressSteps);

      if (detailsOk) syncPlans();
      else if (planSection) planSection.classList.add("d-none");
    }

    mobileEl.addEventListener("input", function () {
      lastPlansFromApi = false;
      clearDetectedOperatorLogo();
      var d = normalizeIndianMobile(mobileEl.value);
      mobileEl.value = d;
      if (d.length === 10 && isValidIndianMobileTen(d)) {
        if (opHintEl) delete opHintEl.dataset.userPickedOperator;
        fetchOperator(d, operatorEl, opHintEl);
      } else if (opHintEl) opHintEl.textContent = "";
      syncEverything();
    });

    ["recharge-prepaid", "recharge-postpaid"].forEach(function (rid) {
      var r = document.getElementById(rid);
      if (r)
        r.addEventListener("change", function () {
          lastPlansFromApi = false;
          clearDetectedOperatorLogo();
          syncEverything();
        });
    });

    if (verifyMobileBtn) {
      var fetchBtnDefaultLabel = verifyMobileBtn.textContent || "Fetch";
      verifyMobileBtn.addEventListener("click", function () {
        var d = normalizeIndianMobile(mobileEl.value);
        mobileEl.value = d;
        if (!isValidIndianMobileTen(d)) {
          syncEverything();
          mobileEl.focus();
          return;
        }

        try {
          if (!window.localStorage.getItem(AUTH_TOKEN_KEY)) {
            console.warn(
              "[recharge API] No varnarc_auth_token in localStorage — sign in via phone OTP first. Requests may return 401."
            );
          }
        } catch (e) {}

        var uiCfg = window.VARNARC_RECHARGE_UI || {};
        var detectUrl =
          uiCfg.margDetectUrl || "/api/recharges/mobile/detect-operator";

        verifyMobileBtn.disabled = true;
        verifyMobileBtn.textContent = "Fetching…";
        clearDetectedOperatorLogo();
        if (opHintEl) opHintEl.textContent = "Calling API for operator and plans…";

        postRechargeApi(detectUrl, {
          mobileNumber: d,
          includePlans: true,
          type: getConnectionPlanType(),
        })
          .then(function (detectJson) {
            var data = detectJson && detectJson.data;
            if (!data || !data.operator)
              throw new Error("Unexpected detect-operator response.");

            if (opHintEl) delete opHintEl.dataset.userPickedOperator;
            var mapped = mapDetectedOperatorToFormValue(
              data.operator,
              operatorEl
            );
            if (mapped) operatorEl.value = mapped;

            if (opHintEl) {
              var op = data.operator;
              var circle = data.circle || {};
              var bits = [];
              if (op.name) bits.push(op.name);
              if (circle.name) bits.push(circle.name);
              opHintEl.textContent =
                bits.join(" · ") || "Operator received from API.";
            }

            setDetectedOperatorLogo(data.operator);

            var rawPlans = Array.isArray(data.plans) ? data.plans : [];
            if (planSection) planSection.classList.remove("d-none");
            if (rawPlans.length > 0) {
              lastPlansFromApi = true;
              renderApiPlansWithCategoryTabs(
                planTabsEl,
                planGrid,
                rawPlans,
                amountEl,
                function () {
                  syncEverything();
                }
              );
            } else {
              lastPlansFromApi = false;
              if (planGrid) {
                renderPlans(
                  planGrid,
                  planTabsEl,
                  operatorEl.value,
                  amountEl,
                  function () {
                    syncEverything();
                  }
                );
              }
            }
            syncEverything();
            try {
              if (planSection) {
                planSection.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                });
              }
            } catch (e2) {}
          })
          .catch(function (err) {
            lastPlansFromApi = false;
            clearDetectedOperatorLogo();
            console.warn("[recharge API] Fetch flow:", err.message || err);
            if (opHintEl)
              opHintEl.textContent =
                (err && err.message) ||
                "Could not load operator. Try signing in.";
          })
          .finally(function () {
            verifyMobileBtn.disabled = false;
            verifyMobileBtn.textContent = fetchBtnDefaultLabel;
            syncEverything();
          });
      });
    }

    amountEl.addEventListener("input", function () {
      if (planGrid) {
        planGrid.querySelectorAll(".recharge-plan-card").forEach(function (n) {
          n.classList.remove("is-selected");
        });
      }
      syncEverything();
    });

    form.addEventListener("submit", function () {
      var d = normalizeIndianMobile(mobileEl.value);
      if (!isValidIndianMobileTen(d) || !operatorEl.value) return;
      var list = readJson(STORAGE_RECENT, []);
      list.unshift({
        mobile: d,
        operator: operatorEl.value,
        amount: amountEl.value,
        at: Date.now(),
      });
      var seen = {};
      list = list
        .filter(function (x) {
          var k = x.mobile + "|" + x.operator;
          if (seen[k]) return false;
          seen[k] = true;
          return true;
        })
        .slice(0, MAX_RECENT);
      writeJson(STORAGE_RECENT, list);

      if (readJson(AUTH_USER_KEY, null)) {
        var saved = readJson(STORAGE_SAVED, []);
        if (saved.indexOf(d) === -1) {
          saved.unshift(d);
          writeJson(STORAGE_SAVED, saved.slice(0, MAX_SAVED));
        }
      }
    });

    function wireQuick() {
      document.querySelectorAll("[data-quick-recharge]").forEach(function (b) {
        b.addEventListener("click", function () {
          lastPlansFromApi = false;
          clearDetectedOperatorLogo();
          mobileEl.value = normalizeIndianMobile(b.getAttribute("data-mobile") || "");
          operatorEl.value = b.getAttribute("data-operator") || "";
          if (opHintEl) delete opHintEl.dataset.userPickedOperator;
          if (isValidIndianMobileTen(mobileEl.value))
            fetchOperator(mobileEl.value, operatorEl, opHintEl);
          syncEverything();
          try {
            planSection &&
              planSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
          } catch (e) {}
        });
      });
      document.querySelectorAll("[data-quick-number]").forEach(function (b) {
        b.addEventListener("click", function () {
          lastPlansFromApi = false;
          clearDetectedOperatorLogo();
          mobileEl.value = normalizeIndianMobile(b.getAttribute("data-quick-number") || "");
          if (isValidIndianMobileTen(mobileEl.value))
            fetchOperator(mobileEl.value, operatorEl, opHintEl);
          syncEverything();
        });
      });
    }

    function renderPersonalization() {
      if (!personalizeEl) return;
      var auth = readJson(AUTH_USER_KEY, null);
      var recent = readJson(STORAGE_RECENT, []);
      var saved = readJson(STORAGE_SAVED, []);
      var recentHost = document.getElementById("recharge-recent-list");
      var savedHost = document.getElementById("recharge-saved-list");
      var ownRow = document.getElementById("recharge-again-own");
      var ownBtn = document.getElementById("recharge-again-own-btn");

      personalizeEl.classList.add("d-none");
      if (recentHost) recentHost.innerHTML = "";
      if (savedHost) savedHost.innerHTML = "";

      function phoneFromAuth() {
        if (!auth || !auth.phoneNumber) return "";
        return normalizeIndianMobile(auth.phoneNumber);
      }

      var selfNum = phoneFromAuth();
      if (ownBtn && ownRow) {
        if (selfNum.length === 10 && isValidIndianMobileTen(selfNum)) {
          ownRow.classList.remove("d-none");
          ownBtn.setAttribute("data-quick-number", selfNum);
        } else ownRow.classList.add("d-none");
      }

      var showPersonal =
        !!(recentHost && recent.length) ||
        !!(auth && savedHost && saved.length) ||
        (ownRow && !ownRow.classList.contains("d-none"));

      if (!showPersonal) return;

      personalizeEl.classList.remove("d-none");

      if (recentHost && recent.length) {
        recent.slice(0, MAX_RECENT).forEach(function (r) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "recharge-personalized-pill";
          b.setAttribute("data-quick-recharge", "1");
          b.setAttribute("data-mobile", r.mobile || "");
          b.setAttribute("data-operator", r.operator || "");

          var opText = "";
          try {
            var opt = operatorEl.querySelector('[value="' + String(r.operator) + '"]');
            opText = opt ? opt.textContent.trim() + " · " : "";
          } catch (e) {}

          b.textContent = opText + "+91 " + String(r.mobile) + " · ₹" + String(r.amount || "—");
          recentHost.appendChild(b);
        });
      }

      if (savedHost && auth && saved.length) {
        saved.forEach(function (num) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "recharge-personalized-pill";
          b.setAttribute("data-quick-number", num);
          b.textContent = "+91 " + num;
          savedHost.appendChild(b);
        });
      }

      wireQuick();
    }

    document.querySelectorAll("[data-promo-code]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var code = btn.getAttribute("data-promo-code") || "";
        var stack = btn.closest(".promo-apply-stack");
        var toast = stack ? stack.querySelector('[role="status"]') : null;

        function showToast(ok) {
          if (!toast) return;
          toast.textContent = ok ? "Code copied!" : "Code: " + code;
          toast.classList.add("is-show");
          setTimeout(function () {
            toast.classList.remove("is-show");
          }, 1700);
        }

        if (!code) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(
            function () {
              showToast(true);
            },
            function () {
              try {
                window.prompt("Promo code", code);
              } catch (err) {}
            }
          );
        } else {
          try {
            window.prompt("Promo code", code);
          } catch (e2) {}
        }
      });
    });

    syncEverything();
    renderPersonalization();
  });
})();
