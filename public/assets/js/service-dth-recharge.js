/**
 * DTH recharge:
 * 1) load operators from `/api/recharges/dth/operators`
 * 2) on operator change, fetch plans from `/api/recharges/dth/plans`
 *
 * Server flow behind `/api/recharges/dth/plans`:
 * - checks DB catalog first
 * - if empty for operator, fetches provider plans and stores in DB
 * - returns plans to UI
 */
(function () {
  var AUTH_USER_KEY = "varnarc_auth_user";
  var AUTH_TOKEN_KEY = "varnarc_auth_token";

  function hasClientSession() {
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

  function clearOperatorLogo(wrap, img) {
    if (!wrap || !img) return;
    img.onerror = null;
    wrap.classList.add("d-none");
    img.removeAttribute("src");
    img.alt = "";
  }

  function setOperatorLogo(wrap, img, op) {
    if (!wrap || !img) return;
    var raw =
      op &&
      (op.logoUrl != null
        ? op.logoUrl
        : op.logo_url != null
          ? op.logo_url
          : "");
    var url = raw != null ? String(raw).trim() : "";
    if (!url) {
      clearOperatorLogo(wrap, img);
      return;
    }
    img.onerror = function () {
      clearOperatorLogo(wrap, img);
    };
    img.src = url;
    img.alt =
      op && op.name ? String(op.name).trim() + " logo" : "Operator logo";
    wrap.classList.remove("d-none");
  }

  function readAuthToken() {
    try {
      return String(window.localStorage.getItem(AUTH_TOKEN_KEY) || "").trim();
    } catch (e) {
      return "";
    }
  }

  function postAuthedJson(url, body) {
    var token = readAuthToken();
    var headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers.Authorization = "Bearer " + token;
    return fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: headers,
      body: JSON.stringify(body || {}),
    }).then(function (r) {
      return r.json().then(function (json) {
        if (!r.ok) {
          throw new Error((json && json.message) || "HTTP " + r.status);
        }
        return json;
      });
    });
  }

  function runAfterServicesAuthReady(fn) {
    var p = window.VARNARC_servicesAuthReady;
    if (p && typeof p.then === "function") {
      return p.then(fn).catch(function () {});
    }
    return fn();
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function categoryLabelFromPlan(p) {
    var c = p && p.category != null ? String(p.category).trim() : "";
    return c || "Other";
  }

  function languageLabelFromPlan(p) {
    var l = p && p.language != null ? String(p.language).trim() : "";
    return l || "";
  }

  function groupPlansByLanguage(plans) {
    var order = [];
    var byLanguage = {};
    (Array.isArray(plans) ? plans : []).forEach(function (p) {
      var key = languageLabelFromPlan(p);
      if (!key) return;
      if (!byLanguage[key]) {
        byLanguage[key] = [];
        order.push(key);
      }
      byLanguage[key].push(p);
    });
    order.forEach(function (key) {
      byLanguage[key].sort(function (a, b) {
        return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      });
    });
    return { order: order, byLanguage: byLanguage };
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

  function clearPlans(planSection, tabsEl, gridEl) {
    if (tabsEl) {
      tabsEl.innerHTML = "";
      tabsEl.classList.add("d-none");
    }
    if (gridEl) gridEl.innerHTML = "";
    if (planSection) planSection.classList.add("d-none");
  }

  function renderPlanCards(gridEl, plans, amountEl) {
    if (!gridEl) return 0;
    gridEl.innerHTML = "";
    var n = 0;
    (Array.isArray(plans) ? plans : []).slice(0, 36).forEach(function (p) {
      var amount = Number(p.amount);
      if (!isFinite(amount)) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "recharge-plan-card";
      var typeLbl = p.plan_type || p.planType || "";
      var badge = p.isBestValue ? "Best value" : String(typeLbl || "Plan").slice(0, 24);
      if (!badge) badge = "Plan";
      var badgeClass = p.isBestValue
        ? "recharge-plan-card__badge--accent"
        : "recharge-plan-card__badge--muted";
      var meta =
        escapeHtml(String(p.name || "")) +
        (p.validity ? "<br>" + escapeHtml(String(p.validity)) : "");
      if (p.description) meta += "<br>" + escapeHtml(String(p.description).slice(0, 120));
      btn.innerHTML =
        '<span class="recharge-plan-card__badge ' +
        badgeClass +
        '">' +
        escapeHtml(badge) +
        '</span><div class="recharge-plan-card__price">Rs.<span>' +
        escapeHtml(String(amount)) +
        '</span></div><div class="recharge-plan-card__meta">' +
        meta +
        "</div>";
      btn.addEventListener("click", function () {
        gridEl.querySelectorAll(".recharge-plan-card").forEach(function (el) {
          el.classList.remove("is-selected");
        });
        btn.classList.add("is-selected");
        if (amountEl) amountEl.value = String(amount);
      });
      gridEl.appendChild(btn);
      n += 1;
    });
    return n;
  }

  function renderPlansWithTabs(planSection, tabsEl, gridEl, plans, amountEl) {
    if (!planSection || !tabsEl || !gridEl) return;
    var groupedByLang = groupPlansByLanguage(plans);
    var langs = groupedByLang.order;
    var groupedByCategory = langs.length > 0 ? null : groupPlansByCategory(plans);
    var grouped =
      langs.length > 0
        ? { order: langs, entries: groupedByLang.byLanguage, keyName: "data-language" }
        : {
            order: groupedByCategory.order,
            entries: groupedByCategory.byCategory,
            keyName: "data-category",
          };
    var tabs = grouped.order;
    if (!tabs.length) {
      clearPlans(planSection, tabsEl, gridEl);
      return;
    }
    planSection.classList.remove("d-none");
    tabsEl.innerHTML = "";
    var activeTab = tabs[0];
    if (tabs.length <= 1) {
      tabsEl.classList.add("d-none");
      renderPlanCards(gridEl, grouped.entries[activeTab] || [], amountEl);
      return;
    }
    tabsEl.classList.remove("d-none");
    function drawTab(tabKey) {
      renderPlanCards(gridEl, grouped.entries[tabKey] || [], amountEl);
      tabsEl.querySelectorAll(".recharge-plan-tab").forEach(function (el) {
        if (el.getAttribute(grouped.keyName) === tabKey) el.classList.add("is-active");
        else el.classList.remove("is-active");
      });
    }
    tabs.forEach(function (tabKey) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "recharge-plan-tab" + (tabKey === activeTab ? " is-active" : "");
      b.setAttribute(grouped.keyName, tabKey);
      b.innerHTML =
        '<span class="recharge-plan-tab__label">' +
        escapeHtml(tabKey) +
        '</span><span class="recharge-plan-tab__count">' +
        escapeHtml(String((grouped.entries[tabKey] || []).length)) +
        "</span>";
      b.addEventListener("click", function () {
        activeTab = tabKey;
        drawTab(activeTab);
      });
      tabsEl.appendChild(b);
    });
    drawTab(activeTab);
  }

  document.addEventListener("DOMContentLoaded", function () {
    runAfterServicesAuthReady(function () {
    if (!hasClientSession()) {
      window.location.replace("/");
      return;
    }

    var select = document.getElementById("dth-operator");
    var hint = document.getElementById("dth-operator-hint-text");
    var logoWrap = document.getElementById("dth-operator-logo-wrap");
    var logoImg = document.getElementById("dth-operator-logo");
    var cardInput = document.getElementById("dth-card");
    var amountEl = document.getElementById("dth-amount");
    var planSection = document.getElementById("dth-plan-picker");
    var planTabsEl = document.getElementById("dth-plan-category-tabs");
    var planGridEl = document.getElementById("dth-plan-grid");
    var sectionLoader = document.getElementById("dth-section-loader");

    if (!select) return;

    var byCode = {};

    function setSectionLoading(isLoading, text) {
      if (!sectionLoader) return;
      sectionLoader.classList.toggle("d-none", !isLoading);
      sectionLoader.setAttribute("aria-hidden", isLoading ? "false" : "true");
      var textEl = sectionLoader.querySelector(".dth-section-loader__text");
      if (textEl && text) textEl.textContent = text;
    }

    select.addEventListener("change", function () {
      var code = select.value;
      setOperatorLogo(logoWrap, logoImg, code ? byCode[code] : null);
      clearPlans(planSection, planTabsEl, planGridEl);
      if (!code) return;
      if (hint) hint.textContent = "Loading plans for selected operator...";
      setSectionLoading(true, "Loading plans...");
      postAuthedJson("/api/recharges/dth/plans", {
        operatorId: code,
        subscriberId:
          cardInput && String(cardInput.value || "").trim()
            ? String(cardInput.value || "").trim()
            : undefined,
      })
        .then(function (json) {
          var data = json && Array.isArray(json.data) ? json.data : [];
          if (!data.length) {
            if (hint) hint.textContent = "No plans available right now. Enter amount manually.";
            return;
          }
          renderPlansWithTabs(planSection, planTabsEl, planGridEl, data, amountEl);
          if (hint) hint.textContent = "Plans loaded.";
        })
        .catch(function (err) {
          if (hint) {
            hint.textContent =
              (err && err.message) || "Could not load plans. Enter amount manually.";
          }
        })
        .then(function () {
          setSectionLoading(false);
        });
    });

    select.disabled = true;
    select.setAttribute("aria-busy", "true");
    if (hint) hint.textContent = "Loading operators…";
    setSectionLoading(true, "Loading operators...");

    fetch("/api/recharges/dth/operators", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    })
      .then(function (r) {
        return r.json().then(function (json) {
          if (!r.ok) {
            throw new Error(
              (json && json.message) || "HTTP " + r.status
            );
          }
          return json;
        });
      })
      .then(function (json) {
        if (!json || json.success !== true || !Array.isArray(json.data)) {
          throw new Error(
            (json && json.message) || "Invalid operators response."
          );
        }
        var list = json.data.slice().sort(function (a, b) {
          var na = (a && a.name) || "";
          var nb = (b && b.name) || "";
          return String(na).localeCompare(String(nb), undefined, {
            sensitivity: "base",
          });
        });

        select.textContent = "";
        var placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.disabled = true;
        placeholder.selected = true;
        placeholder.textContent = "Select your operator";
        select.appendChild(placeholder);

        list.forEach(function (op) {
          if (!op || !op.code) return;
          var code = String(op.code).trim();
          if (!code) return;
          byCode[code] = op;
          var opt = document.createElement("option");
          opt.value = code;
          opt.textContent = op.name ? String(op.name).trim() : code;
          select.appendChild(opt);
        });

        if (hint) hint.textContent = "Select operator to load plans.";
      })
      .catch(function (err) {
        if (hint) {
          hint.textContent =
            (err && err.message) ||
            "Could not load operators. Please refresh and try again.";
        }
      })
      .then(function () {
        select.disabled = false;
        select.removeAttribute("aria-busy");
        setSectionLoading(false);
      });
    });
  });
})();
