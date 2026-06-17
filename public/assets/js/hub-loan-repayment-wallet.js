/**
 * Saved loans + EMI bills (localStorage until API is wired).
 * Pay step supports full amount or a specific (partial) amount.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "varnarc_loans_v1";
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
    return "loan_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
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

  function loadLoans() {
    return readJson(STORAGE_KEY, []);
  }

  function saveLoans(list) {
    writeJson(STORAGE_KEY, list);
  }

  function maskLoanNo(no) {
    var s = String(no || "");
    if (s.length <= 4) return s || "----";
    return "•••• " + s.slice(-4);
  }

  function parseAmountInput(v) {
    var s = String(v || "").replace(/[^\d.]/g, "");
    var n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }

  function seedDemoLoans() {
    var now = new Date();
    var gen = now.toISOString();
    return [
      {
        id: uid(),
        lenderKey: "hdfc bank loan",
        lenderName: "HDFC Bank",
        initials: "HD",
        color: "c1",
        loanNo: "12345678901234567890",
        bill: {
          amount: 18500,
          generatedAt: gen,
          dueAt: addDays(now, 8),
          status: "ready",
        },
      },
      {
        id: uid(),
        lenderKey: "bajaj finance ltd",
        lenderName: "Bajaj Finance Ltd",
        initials: "BF",
        color: "c1",
        loanNo: "98765432109876543210",
        bill: {
          amount: 7420,
          generatedAt: addDays(now, -1),
          dueAt: addDays(now, 4),
          status: "ready",
        },
      },
    ];
  }

  function ensureLoans() {
    var list = loadLoans();
    if (!list.length && isSignedIn()) {
      list = seedDemoLoans();
      saveLoans(list);
    }
    return list;
  }

  function findProviderMeta(key, root) {
    var btn = root.querySelector('[data-loan-provider="' + key + '"]');
    if (!btn) return { initials: "LN", color: "c0", name: key };
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
      initials: logo ? logo.textContent.trim() : "LN",
      color: color,
      name: nameEl ? nameEl.textContent.trim() : key,
    };
  }

  function initLoanRepaymentHub(root) {
    if (!root || root.getAttribute("data-lr-wallet-init") === "1") return;
    root.setAttribute("data-lr-wallet-init", "1");

    var stepLoans = root.querySelector('[data-loan-step="loans"]');
    var stepPick = root.querySelector('[data-loan-step="pick"]');
    var stepDetails = root.querySelector('[data-loan-step="details"]');
    var stepPay = root.querySelector('[data-loan-step="pay"]');
    var listEl = root.querySelector("[data-lr-wallet-list]");
    var addBtn = root.querySelector("[data-lr-add-loan]");
    var browseAllBtn = root.querySelector("[data-lr-browse-all]");
    var walletWrap = root.querySelector("[data-lr-wallet]");

    var selectedNameEl = root.querySelector("[data-loan-selected-name]");
    var consentLenderEl = root.querySelector("[data-loan-consent-lender]");
    var detailsForm = root.querySelector("[data-loan-details-form]");
    var loanNoInput = root.querySelector("[data-loan-number]");
    var consentInput = root.querySelector("[data-loan-consent]");
    var fetchBtn = root.querySelector("[data-loan-fetch]");
    var fetchStatus = root.querySelector("[data-loan-fetch-status]");
    var searchInput = root.querySelector("[data-loan-provider-search]");
    var clearBtn = root.querySelector("[data-loan-search-clear]");
    var lists = root.querySelectorAll("[data-loan-provider-list]");

    var payFullEl = root.querySelector("[data-lr-pay-full-amount]");
    var payMetaEl = root.querySelector("[data-lr-pay-meta]");
    var specificWrap = root.querySelector("[data-lr-specific-wrap]");
    var specificInput = root.querySelector("[data-lr-specific-amount]");
    var maxAmountEl = root.querySelector("[data-lr-max-amount]");
    var summaryAmountEl = root.querySelector("[data-lr-pay-summary-amount]");
    var fullHintEl = root.querySelector("[data-lr-full-hint]");
    var payConfirmBtn = root.querySelector("[data-lr-pay-confirm]");
    var amountTypeInputs = root.querySelectorAll("[data-lr-amount-type]");

    var activeLoanId = null;
    var pendingProvider = null;
    var payFullAmount = 0;

    function showStep(step) {
      if (stepLoans) stepLoans.hidden = step !== "loans";
      if (stepPick) stepPick.hidden = step !== "pick";
      if (stepDetails) stepDetails.hidden = step !== "details";
      if (stepPay) stepPay.hidden = step !== "pay";
    }

    function renderWallet() {
      if (!listEl) return;
      var loans = ensureLoans();
      listEl.innerHTML = "";

      var guestLead = root.querySelector(".hub-quick-access__lead");
      if (guestLead) guestLead.hidden = isSignedIn();

      if (walletWrap) walletWrap.hidden = !isSignedIn();
      if (!isSignedIn()) return;

      loans.forEach(function (loan) {
        var li = document.createElement("li");
        var bill = loan.bill || {};
        var hasBill = bill.status === "ready" && bill.amount > 0;
        var bannerClass = "ccb-card-tile__banner ccb-card-tile__banner--" + (loan.color || "c0");

        li.innerHTML =
          '<article class="ccb-card-tile" data-lr-loan-id="' +
          loan.id +
          '">' +
          '<div class="' +
          bannerClass +
          '">' +
          '<div class="ccb-card-tile__issuer-row">' +
          '<span class="ccb-card-tile__logo" aria-hidden="true">' +
          (loan.initials || "LN") +
          "</span>" +
          "<div>" +
          '<p class="ccb-card-tile__issuer-name">' +
          (loan.lenderName || "Loan") +
          "</p>" +
          '<span class="ccb-card-tile__mask">Loan ' +
          maskLoanNo(loan.loanNo) +
          "</span>" +
          "</div></div></div>" +
          '<div class="ccb-card-tile__body">' +
          (hasBill
            ? '<p class="ccb-card-tile__amount-label">EMI due</p>' +
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
              '<p class="ccb-card-tile__status lr-tile-note">Pay full EMI or choose a specific amount at checkout.</p>'
            : '<p class="ccb-card-tile__status">No bill fetched yet. Link your loan to fetch the latest EMI.</p>') +
          '<div class="ccb-card-tile__actions">' +
          (hasBill
            ? '<button type="button" class="ccb-card-tile__pay" data-lr-action="pay">Pay EMI</button>' +
              '<button type="button" class="ccb-card-tile__secondary" data-lr-action="pay-partial">Specific amount</button>'
            : "") +
          '<button type="button" class="ccb-card-tile__secondary" data-lr-action="fetch">' +
          (hasBill ? "Refresh bill" : "Fetch bill") +
          "</button></div></div></article>";
        listEl.appendChild(li);
      });

      listEl.querySelectorAll("[data-lr-action]").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var tile = btn.closest("[data-lr-loan-id]");
          if (!tile) return;
          var id = tile.getAttribute("data-lr-loan-id");
          var action = btn.getAttribute("data-lr-action");
          if (action === "pay") openPay(id, "full");
          else if (action === "pay-partial") openPay(id, "specific");
          else openDetailsForLoan(id);
        });
      });

      listEl.querySelectorAll(".ccb-card-tile").forEach(function (tile) {
        tile.addEventListener("click", function () {
          var id = tile.getAttribute("data-lr-loan-id");
          var loan = ensureLoans().find(function (l) {
            return l.id === id;
          });
          if (loan && loan.bill && loan.bill.status === "ready") openPay(id, "full");
          else openDetailsForLoan(id);
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
        (!useSpecific ||
          (amount >= MIN_PARTIAL && amount <= payFullAmount));

      if (summaryAmountEl) summaryAmountEl.textContent = formatInr(valid ? amount : 0);
      if (payConfirmBtn) payConfirmBtn.disabled = !valid;

      if (specificInput && useSpecific) {
        specificInput.classList.toggle("is-invalid", amount > 0 && !valid);
      }
    }

    function openPay(loanId, amountMode) {
      var loan = ensureLoans().find(function (l) {
        return l.id === loanId;
      });
      if (!loan || !loan.bill) return;

      activeLoanId = loanId;
      payFullAmount = Number(loan.bill.amount) || 0;

      if (payFullEl) payFullEl.textContent = formatInr(payFullAmount);
      if (fullHintEl) fullHintEl.textContent = "Pay " + formatInr(payFullAmount) + " (complete EMI due)";
      if (maxAmountEl) maxAmountEl.textContent = formatInr(payFullAmount);
      if (payMetaEl) {
        payMetaEl.innerHTML =
          "<strong>" +
          loan.lenderName +
          "</strong> · Loan " +
          maskLoanNo(loan.loanNo) +
          "<br>Due by <strong>" +
          formatDate(loan.bill.dueAt) +
          "</strong> · Bill generated <strong>" +
          formatDate(loan.bill.generatedAt) +
          "</strong>";
      }

      amountTypeInputs.forEach(function (inp) {
        inp.checked = inp.value === (amountMode === "specific" ? "specific" : "full");
      });
      if (specificInput) specificInput.value = "";
      syncPayStep();
      showStep("pay");
    }

    function openDetailsForLoan(loanId) {
      var loan = ensureLoans().find(function (l) {
        return l.id === loanId;
      });
      if (!loan) return;
      activeLoanId = loanId;
      pendingProvider = loan.lenderKey;
      if (selectedNameEl) selectedNameEl.textContent = loan.lenderName;
      if (consentLenderEl) consentLenderEl.textContent = loan.lenderName;
      if (loanNoInput) loanNoInput.value = loan.loanNo || "";
      if (consentInput) consentInput.checked = false;
      if (fetchStatus) fetchStatus.textContent = "";
      setFetchEnabled();
      showStep("details");
    }

    function openDetailsForProvider(providerKey, providerName) {
      pendingProvider = providerKey;
      activeLoanId = null;
      if (selectedNameEl) selectedNameEl.textContent = providerName;
      if (consentLenderEl) consentLenderEl.textContent = providerName;
      if (loanNoInput) loanNoInput.value = "";
      if (consentInput) consentInput.checked = false;
      if (fetchStatus) fetchStatus.textContent = "";
      setFetchEnabled();
      showStep("details");
    }

    function openPick() {
      showStep("pick");
    }

    function openLoans() {
      activeLoanId = null;
      pendingProvider = null;
      renderWallet();
      showStep("loans");
    }

    function setFetchEnabled() {
      if (!fetchBtn) return;
      var len = loanNoInput ? String(loanNoInput.value || "").length : 0;
      fetchBtn.disabled = len !== 20 || !(consentInput && consentInput.checked);
    }

    if (addBtn) addBtn.addEventListener("click", openPick);
    if (browseAllBtn) browseAllBtn.addEventListener("click", openPick);

    root.querySelectorAll("[data-loan-back]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (stepPay && !stepPay.hidden) openLoans();
        else if (stepDetails && !stepDetails.hidden) {
          if (activeLoanId) openLoans();
          else openPick();
        } else openLoans();
      });
    });

    if (loanNoInput) {
      loanNoInput.addEventListener("input", function () {
        loanNoInput.value = String(loanNoInput.value || "").slice(0, 20);
        setFetchEnabled();
      });
    }
    if (consentInput) consentInput.addEventListener("change", setFetchEnabled);

    amountTypeInputs.forEach(function (inp) {
      inp.addEventListener("change", syncPayStep);
    });
    if (specificInput) {
      specificInput.addEventListener("input", syncPayStep);
    }

    if (detailsForm) {
      detailsForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (fetchBtn && fetchBtn.disabled) return;

        var loanNo = loanNoInput ? String(loanNoInput.value || "") : "";
        if (loanNo.length !== 20) {
          if (fetchStatus) fetchStatus.textContent = "Please enter exactly 20 characters for the loan number.";
          return;
        }

        var meta = findProviderMeta(pendingProvider || "", root);
        var now = new Date();
        var bill = {
          amount: Math.floor(3000 + Math.random() * 22000),
          generatedAt: now.toISOString(),
          dueAt: addDays(now, 10),
          status: "ready",
        };

        var loans = loadLoans();
        var existing = activeLoanId
          ? loans.find(function (l) {
              return l.id === activeLoanId;
            })
          : null;

        if (existing) {
          existing.loanNo = loanNo;
          existing.bill = bill;
        } else {
          loans.push({
            id: uid(),
            lenderKey: pendingProvider || meta.name,
            lenderName: meta.name,
            initials: meta.initials,
            color: meta.color,
            loanNo: loanNo,
            bill: bill,
          });
        }
        saveLoans(loans);
        if (fetchStatus) fetchStatus.textContent = "Bill fetched successfully.";
        window.setTimeout(openLoans, 600);
      });
    }

    if (payConfirmBtn) {
      payConfirmBtn.addEventListener("click", function () {
        var loan = ensureLoans().find(function (l) {
          return l.id === activeLoanId;
        });
        if (!loan) return;
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
          menuItemSlug: "loan-repayment",
          sectionSlug: "bill-payments",
          orderNote: (mode === "full" ? "Full" : "Partial") + " EMI — " + loan.lenderName,
        })
          .then(function (result) {
            var st = (result.verify && result.verify.status) || "";
            if (st === "SUCCESS") {
              window.alert("Payment successful for " + loan.lenderName);
            } else {
              window.alert("Payment status: " + (st || "pending"));
            }
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

    root.querySelectorAll("[data-loan-provider]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var nameEl = btn.querySelector(".electricity-hub-provider-name");
        var key = btn.getAttribute("data-loan-provider");
        openDetailsForProvider(key, nameEl ? nameEl.textContent.trim() : "Lender");
      });
    });

    if (isSignedIn()) showStep("loans");
    else showStep("pick");

    renderWallet();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-loan-repayment-hub]").forEach(initLoanRepaymentHub);
  });

  document.addEventListener("hub-panel-activated", function (ev) {
    if (ev.detail && ev.detail.panelId !== "loan" && ev.detail.panelId !== "loan_repayment") return;
    document.querySelectorAll("[data-loan-repayment-hub]").forEach(function (root) {
      root.removeAttribute("data-lr-wallet-init");
      initLoanRepaymentHub(root);
    });
  });
})();
