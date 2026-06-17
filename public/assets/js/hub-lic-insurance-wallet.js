/**
 * Saved insurance policies + premium bills (localStorage until API is wired).
 * Pay step supports full premium or a specific (partial) amount.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "varnarc_lic_policies_v1";
  var AUTH_USER_KEY = "varnarc_auth_user";
  var MIN_PARTIAL = 100;

  function readJson(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function uid() {
    return "pol_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }

  function formatInr(n) {
    var num = Number(n);
    if (!Number.isFinite(num)) return "—";
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(num);
    } catch (e) {
      return "₹" + Math.round(num);
    }
  }

  function formatDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return iso;
    }
  }

  function addDays(base, days) {
    var d = new Date(base);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  function isSignedIn() {
    return !!readJson(AUTH_USER_KEY, null);
  }

  function loadPolicies() {
    return readJson(STORAGE_KEY, []);
  }

  function savePolicies(list) {
    writeJson(STORAGE_KEY, list);
  }

  function maskPolicyNo(no) {
    var s = String(no || "").replace(/\s/g, "");
    if (s.length <= 4) return s || "----";
    return "•••• " + s.slice(-4);
  }

  function parseAmountInput(v) {
    var s = String(v || "").replace(/[^\d.]/g, "");
    var n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }

  function normalizeMobile(v) {
    var d = String(v || "").replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
    return d.slice(0, 10);
  }

  function isValidMobileTen(d) {
    return /^[6-9]\d{9}$/.test(String(d || ""));
  }

  function isValidDob(v) {
    return /^(0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])-(19|20)\d{2}$/.test(String(v || "").trim());
  }

  function getIdMode(root) {
    var mode = "policy";
    root.querySelectorAll("[data-lic-id-mode-input]").forEach(function (inp) {
      if (inp.checked) mode = inp.value;
    });
    return mode;
  }

  function seedDemoPolicies() {
    var now = new Date();
    var gen = now.toISOString();
    return [
      {
        id: uid(),
        insurerKey: "lic of india",
        insurerName: "LIC of India",
        initials: "LI",
        color: "c0",
        idMode: "policy",
        policyNo: "123456789",
        dob: "",
        mobile: "9876543210",
        bill: {
          amount: 12450,
          generatedAt: gen,
          dueAt: addDays(now, 12),
          status: "ready",
        },
      },
      {
        id: uid(),
        insurerKey: "hdfc life insurance",
        insurerName: "HDFC Life Insurance",
        initials: "HL",
        color: "c1",
        idMode: "dob",
        policyNo: "",
        dob: "15-08-1985",
        mobile: "9123456789",
        bill: {
          amount: 5820,
          generatedAt: addDays(now, -2),
          dueAt: addDays(now, 6),
          status: "ready",
        },
      },
    ];
  }

  function ensurePolicies() {
    var list = loadPolicies();
    if (!list.length && isSignedIn()) {
      list = seedDemoPolicies();
      savePolicies(list);
    }
    return list;
  }

  function findProviderMeta(key, root) {
    var btn = root.querySelector('[data-lic-provider="' + key + '"]');
    if (!btn) return { initials: "IN", color: "c0", name: key };
    var logo = btn.querySelector(".electricity-hub-provider-logo");
    var nameEl = btn.querySelector(".electricity-hub-provider-name");
    var color = "c0";
    if (logo) {
      logo.classList.forEach(function (c) {
        if (c.indexOf("electricity-hub-provider-logo--") === 0) {
          color = c.replace("electricity-hub-provider-logo--", "");
        }
      });
    }
    return {
      initials: logo ? logo.textContent.trim() : "IN",
      color: color,
      name: nameEl ? nameEl.textContent.trim() : key,
    };
  }

  function policySubtitle(pol) {
    if (pol.idMode === "dob" && pol.dob) return "DOB " + pol.dob;
    if (pol.policyNo) return "Policy " + maskPolicyNo(pol.policyNo);
    return "Policy linked";
  }

  function initLicInsuranceHub(root) {
    if (!root || root.getAttribute("data-lic-wallet-init") === "1") return;
    root.setAttribute("data-lic-wallet-init", "1");

    var stepPolicies = root.querySelector('[data-lic-step="policies"]');
    var stepPick = root.querySelector('[data-lic-step="pick"]');
    var stepDetails = root.querySelector('[data-lic-step="details"]');
    var stepPay = root.querySelector('[data-lic-step="pay"]');
    var listEl = root.querySelector("[data-lic-wallet-list]");
    var addBtn = root.querySelector("[data-lic-add-policy]");
    var browseAllBtn = root.querySelector("[data-lic-browse-all]");
    var walletWrap = root.querySelector("[data-lic-wallet]");

    var selectedNameEl = root.querySelector("[data-lic-selected-name]");
    var consentInsurerEl = root.querySelector("[data-lic-consent-insurer]");
    var detailsForm = root.querySelector("[data-lic-details-form]");
    var policyNoInput = root.querySelector("[data-lic-policy-no]");
    var dobInput = root.querySelector("[data-lic-dob]");
    var mobileInput = root.querySelector("[data-lic-mobile]");
    var consentInput = root.querySelector("[data-lic-consent]");
    var fetchBtn = root.querySelector("[data-lic-fetch]");
    var fetchStatus = root.querySelector("[data-lic-fetch-status]");
    var searchInput = root.querySelector("[data-lic-provider-search]");
    var clearBtn = root.querySelector("[data-lic-search-clear]");
    var lists = root.querySelectorAll("[data-lic-provider-list]");
    var policyFields = root.querySelector("[data-lic-policy-fields]");
    var dobFields = root.querySelector("[data-lic-dob-fields]");
    var idModeInputs = root.querySelectorAll("[data-lic-id-mode-input]");

    var payFullEl = root.querySelector("[data-lic-pay-full-amount]");
    var payMetaEl = root.querySelector("[data-lic-pay-meta]");
    var specificWrap = root.querySelector("[data-lic-specific-wrap]");
    var specificInput = root.querySelector("[data-lic-specific-amount]");
    var maxAmountEl = root.querySelector("[data-lic-max-amount]");
    var summaryAmountEl = root.querySelector("[data-lic-pay-summary-amount]");
    var fullHintEl = root.querySelector("[data-lic-full-hint]");
    var payConfirmBtn = root.querySelector("[data-lic-pay-confirm]");
    var amountTypeInputs = root.querySelectorAll("[data-lic-amount-type]");

    var activePolicyId = null;
    var pendingProvider = null;
    var payFullAmount = 0;

    function showStep(step) {
      if (stepPolicies) stepPolicies.hidden = step !== "policies";
      if (stepPick) stepPick.hidden = step !== "pick";
      if (stepDetails) stepDetails.hidden = step !== "details";
      if (stepPay) stepPay.hidden = step !== "pay";
    }

    function syncIdModeFields() {
      var mode = getIdMode(root);
      if (policyFields) policyFields.hidden = mode !== "policy";
      if (dobFields) dobFields.hidden = mode !== "dob";
      setFetchEnabled();
    }

    function renderWallet() {
      if (!listEl) return;
      var policies = ensurePolicies();
      listEl.innerHTML = "";

      var guestLead = root.querySelector(".hub-quick-access__lead");
      if (guestLead) guestLead.hidden = isSignedIn();

      if (walletWrap) walletWrap.hidden = !isSignedIn();
      if (!isSignedIn()) return;

      policies.forEach(function (pol) {
        var li = document.createElement("li");
        var bill = pol.bill || {};
        var hasBill = bill.status === "ready" && bill.amount > 0;
        var bannerClass = "ccb-card-tile__banner ccb-card-tile__banner--" + (pol.color || "c0");

        li.innerHTML =
          '<article class="ccb-card-tile" data-lic-policy-id="' +
          pol.id +
          '">' +
          '<div class="' +
          bannerClass +
          '">' +
          '<div class="ccb-card-tile__issuer-row">' +
          '<span class="ccb-card-tile__logo" aria-hidden="true">' +
          (pol.initials || "IN") +
          "</span>" +
          "<div>" +
          '<p class="ccb-card-tile__issuer-name">' +
          (pol.insurerName || "Insurance") +
          "</p>" +
          '<span class="ccb-card-tile__mask">' +
          policySubtitle(pol) +
          "</span>" +
          "</div></div></div>" +
          '<div class="ccb-card-tile__body">' +
          (hasBill
            ? '<p class="ccb-card-tile__amount-label">Premium due</p>' +
              '<p class="ccb-card-tile__amount">' +
              formatInr(bill.amount) +
              "</p>" +
              '<dl class="ccb-card-tile__meta">' +
              "<dt>Due date</dt><dd>" +
              formatDate(bill.dueAt) +
              "</dd>" +
              "<dt>Bill generated</dt><dd>" +
              formatDate(bill.generatedAt) +
              "</dd></dl>" +
              '<p class="ccb-card-tile__status lr-tile-note">Pay full premium or choose a specific amount.</p>'
            : '<p class="ccb-card-tile__status">No bill fetched yet. Link your policy to fetch the latest premium.</p>') +
          '<div class="ccb-card-tile__actions">' +
          (hasBill
            ? '<button type="button" class="ccb-card-tile__pay" data-lic-action="pay">Pay premium</button>' +
              '<button type="button" class="ccb-card-tile__secondary" data-lic-action="pay-partial">Specific amount</button>'
            : "") +
          '<button type="button" class="ccb-card-tile__secondary" data-lic-action="fetch">' +
          (hasBill ? "Refresh bill" : "Fetch bill") +
          "</button></div></div></article>";
        listEl.appendChild(li);
      });

      listEl.querySelectorAll("[data-lic-action]").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var tile = btn.closest("[data-lic-policy-id]");
          if (!tile) return;
          var id = tile.getAttribute("data-lic-policy-id");
          var action = btn.getAttribute("data-lic-action");
          if (action === "pay") openPay(id, "full");
          else if (action === "pay-partial") openPay(id, "specific");
          else openDetailsForPolicy(id);
        });
      });

      listEl.querySelectorAll(".ccb-card-tile").forEach(function (tile) {
        tile.addEventListener("click", function () {
          var id = tile.getAttribute("data-lic-policy-id");
          var pol = ensurePolicies().find(function (p) {
            return p.id === id;
          });
          if (pol && pol.bill && pol.bill.status === "ready") openPay(id, "full");
          else openDetailsForPolicy(id);
        });
      });
    }

    function getSelectedPayAmount() {
      var useSpecific = false;
      amountTypeInputs.forEach(function (inp) {
        if (inp.checked && inp.value === "specific") useSpecific = true;
      });
      if (!useSpecific) return payFullAmount;
      return parseAmountInput(specificInput ? specificInput.value : "");
    }

    function syncPayStep() {
      var useSpecific = false;
      amountTypeInputs.forEach(function (inp) {
        if (inp.checked && inp.value === "specific") useSpecific = true;
      });

      if (specificWrap) specificWrap.hidden = !useSpecific;

      var amount = getSelectedPayAmount();
      var valid =
        payFullAmount > 0 &&
        (!useSpecific || (amount >= MIN_PARTIAL && amount <= payFullAmount));

      if (summaryAmountEl) summaryAmountEl.textContent = formatInr(valid ? amount : 0);
      if (payConfirmBtn) payConfirmBtn.disabled = !valid;

      if (specificInput && useSpecific) {
        specificInput.classList.toggle("is-invalid", amount > 0 && !valid);
      }
    }

    function openPay(policyId, amountMode) {
      var pol = ensurePolicies().find(function (p) {
        return p.id === policyId;
      });
      if (!pol || !pol.bill) return;

      activePolicyId = policyId;
      payFullAmount = Number(pol.bill.amount) || 0;

      if (payFullEl) payFullEl.textContent = formatInr(payFullAmount);
      if (fullHintEl) fullHintEl.textContent = "Pay " + formatInr(payFullAmount) + " (complete premium due)";
      if (maxAmountEl) maxAmountEl.textContent = formatInr(payFullAmount);
      if (payMetaEl) {
        payMetaEl.innerHTML =
          "<strong>" +
          pol.insurerName +
          "</strong> · " +
          policySubtitle(pol) +
          "<br>Due by <strong>" +
          formatDate(pol.bill.dueAt) +
          "</strong> · Bill generated <strong>" +
          formatDate(pol.bill.generatedAt) +
          "</strong>";
      }

      amountTypeInputs.forEach(function (inp) {
        inp.checked = inp.value === (amountMode === "specific" ? "specific" : "full");
      });
      if (specificInput) specificInput.value = "";
      syncPayStep();
      showStep("pay");
    }

    function fillDetailsFromPolicy(pol) {
      if (selectedNameEl) selectedNameEl.textContent = pol.insurerName;
      if (consentInsurerEl) consentInsurerEl.textContent = pol.insurerName;
      idModeInputs.forEach(function (inp) {
        inp.checked = inp.value === (pol.idMode || "policy");
      });
      syncIdModeFields();
      if (policyNoInput) policyNoInput.value = pol.policyNo || "";
      if (dobInput) dobInput.value = pol.dob || "";
      if (mobileInput) mobileInput.value = pol.mobile || "";
      if (consentInput) consentInput.checked = false;
      if (fetchStatus) fetchStatus.textContent = "";
    }

    function openDetailsForPolicy(policyId) {
      var pol = ensurePolicies().find(function (p) {
        return p.id === policyId;
      });
      if (!pol) return;
      activePolicyId = policyId;
      pendingProvider = pol.insurerKey;
      fillDetailsFromPolicy(pol);
      setFetchEnabled();
      showStep("details");
    }

    function openDetailsForProvider(providerKey, providerName) {
      pendingProvider = providerKey;
      activePolicyId = null;
      if (selectedNameEl) selectedNameEl.textContent = providerName;
      if (consentInsurerEl) consentInsurerEl.textContent = providerName;
      idModeInputs.forEach(function (inp) {
        if (inp.value === "policy") inp.checked = true;
      });
      syncIdModeFields();
      if (policyNoInput) policyNoInput.value = "";
      if (dobInput) dobInput.value = "";
      if (mobileInput) mobileInput.value = "";
      if (consentInput) consentInput.checked = false;
      if (fetchStatus) fetchStatus.textContent = "";
      setFetchEnabled();
      showStep("details");
    }

    function openPick() {
      showStep("pick");
    }

    function openPolicies() {
      activePolicyId = null;
      pendingProvider = null;
      renderWallet();
      showStep("policies");
    }

    function detailsValid() {
      if (!(consentInput && consentInput.checked)) return false;
      var mob = normalizeMobile(mobileInput ? mobileInput.value : "");
      if (!isValidMobileTen(mob)) return false;
      var mode = getIdMode(root);
      if (mode === "policy") {
        var pno = policyNoInput ? String(policyNoInput.value || "").replace(/\s/g, "") : "";
        return pno.length >= 6;
      }
      return isValidDob(dobInput ? dobInput.value : "");
    }

    function setFetchEnabled() {
      if (!fetchBtn) return;
      fetchBtn.disabled = !detailsValid();
    }

    if (addBtn) addBtn.addEventListener("click", openPick);
    if (browseAllBtn) browseAllBtn.addEventListener("click", openPick);

    root.querySelectorAll("[data-lic-back]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (stepPay && !stepPay.hidden) openPolicies();
        else if (stepDetails && !stepDetails.hidden) {
          if (activePolicyId) openPolicies();
          else openPick();
        } else openPolicies();
      });
    });

    idModeInputs.forEach(function (inp) {
      inp.addEventListener("change", syncIdModeFields);
    });

    if (policyNoInput) {
      policyNoInput.addEventListener("input", function () {
        policyNoInput.value = String(policyNoInput.value || "").replace(/\s/g, "").slice(0, 20);
        setFetchEnabled();
      });
    }
    if (dobInput) {
      dobInput.addEventListener("input", function () {
        var v = String(dobInput.value || "").replace(/[^\d-]/g, "");
        if (v.length > 10) v = v.slice(0, 10);
        dobInput.value = v;
        setFetchEnabled();
      });
    }
    if (mobileInput) {
      mobileInput.addEventListener("input", function () {
        mobileInput.value = normalizeMobile(mobileInput.value);
        setFetchEnabled();
      });
    }
    if (consentInput) consentInput.addEventListener("change", setFetchEnabled);

    amountTypeInputs.forEach(function (inp) {
      inp.addEventListener("change", syncPayStep);
    });
    if (specificInput) specificInput.addEventListener("input", syncPayStep);

    if (detailsForm) {
      detailsForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (fetchBtn && fetchBtn.disabled) return;

        if (!detailsValid()) {
          if (fetchStatus) fetchStatus.textContent = "Please complete all required fields correctly.";
          return;
        }

        var meta = findProviderMeta(pendingProvider || "", root);
        var mode = getIdMode(root);
        var policyNo = policyNoInput ? String(policyNoInput.value || "").replace(/\s/g, "") : "";
        var dob = dobInput ? String(dobInput.value || "").trim() : "";
        var mobile = normalizeMobile(mobileInput ? mobileInput.value : "");
        var now = new Date();
        var bill = {
          amount: Math.floor(1500 + Math.random() * 18000),
          generatedAt: now.toISOString(),
          dueAt: addDays(now, 14),
          status: "ready",
        };

        var policies = loadPolicies();
        var existing = activePolicyId
          ? policies.find(function (p) {
              return p.id === activePolicyId;
            })
          : null;

        if (existing) {
          existing.idMode = mode;
          existing.policyNo = mode === "policy" ? policyNo : "";
          existing.dob = mode === "dob" ? dob : "";
          existing.mobile = mobile;
          existing.bill = bill;
        } else {
          policies.push({
            id: uid(),
            insurerKey: pendingProvider || meta.name,
            insurerName: meta.name,
            initials: meta.initials,
            color: meta.color,
            idMode: mode,
            policyNo: mode === "policy" ? policyNo : "",
            dob: mode === "dob" ? dob : "",
            mobile: mobile,
            bill: bill,
          });
        }
        savePolicies(policies);
        if (fetchStatus) fetchStatus.textContent = "Bill fetched successfully.";
        window.setTimeout(openPolicies, 600);
      });
    }

    if (payConfirmBtn) {
      payConfirmBtn.addEventListener("click", function () {
        var pol = ensurePolicies().find(function (p) {
          return p.id === activePolicyId;
        });
        if (!pol) return;
        var amount = getSelectedPayAmount();
        var mode = "full";
        amountTypeInputs.forEach(function (inp) {
          if (inp.checked && inp.value === "specific") mode = "specific";
        });
        if (!window.VarnarcCheckout) {
          window.alert("Payment module is loading. Please refresh and try again.");
          return;
        }
        payConfirmBtn.disabled = true;
        window.VarnarcCheckout.start({
          amount: amount,
          menuItemSlug: "lic-insurance",
          sectionSlug: "bill-payments",
          orderNote:
            (mode === "full" ? "Full" : "Partial") + " LIC premium — " + pol.insurerName,
        })
          .then(function (result) {
            var st = (result.verify && result.verify.status) || "";
            window.alert(
              st === "SUCCESS"
                ? "Premium payment successful"
                : "Payment status: " + (st || "pending")
            );
          })
          .catch(function (err) {
            window.alert(err.message || "Payment failed");
          })
          .finally(function () {
            payConfirmBtn.disabled = false;
          });
      });
    }

    function filterProviders() {
      if (!searchInput) return;
      var q = String(searchInput.value || "").trim().toLowerCase();
      if (clearBtn) clearBtn.hidden = !q;
      lists.forEach(function (list) {
        list.querySelectorAll("li[data-biller]").forEach(function (li) {
          var key = (li.getAttribute("data-biller") || li.textContent || "").toLowerCase();
          li.hidden = !!(q && key.indexOf(q) === -1);
        });
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", filterProviders);
      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          searchInput.value = "";
          filterProviders();
          searchInput.focus();
        });
      }
    }

    root.querySelectorAll("[data-lic-provider]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var nameEl = btn.querySelector(".electricity-hub-provider-name");
        var key = btn.getAttribute("data-lic-provider");
        openDetailsForProvider(key, nameEl ? nameEl.textContent.trim() : "Insurer");
      });
    });

    if (isSignedIn()) showStep("policies");
    else showStep("pick");

    syncIdModeFields();
    renderWallet();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-lic-insurance-hub]").forEach(initLicInsuranceHub);
  });

  document.addEventListener("hub-panel-activated", function (ev) {
    if (
      ev.detail &&
      ev.detail.panelId !== "lic-insurance" &&
      ev.detail.panelId !== "lic_insurance"
    )
      return;
    document.querySelectorAll("[data-lic-insurance-hub]").forEach(function (root) {
      root.removeAttribute("data-lic-wallet-init");
      initLicInsuranceHub(root);
    });
  });
})();
