/**
 * Money Transfer — To Self Bank Account: send → bank list → pay → checkout sheet.
 */
(function () {
  "use strict";

  var DEFAULT_BACK = {
    banks: "send",
    pay: "banks",
    checkout: "pay",
    "ifsc-saved": "send",
    "ifsc-chat": "ifsc-saved",
    "ifsc-select-bank": "ifsc-saved",
    "ifsc-add-account": "ifsc-select-bank",
  };

  function goToHubPanel(panelId, sendMode) {
    var hub = document.querySelector("[data-service-section-hub]");
    if (!hub || !panelId) {
      return false;
    }

    if (sendMode && window.history && window.history.replaceState) {
      var url = new URL(window.location.href);
      url.searchParams.set("mode", sendMode);
      window.history.replaceState({}, "", url.pathname + url.search);
    }

    var tab = hub.querySelector('[data-hub-nav="' + panelId + '"]');
    if (tab) {
      tab.click();
      return true;
    }

    var panels = hub.querySelectorAll(".hub-tab-panel[data-hub-panel]");
    var tabItems = hub.querySelectorAll(".resp-tabs-list li[data-hub-nav]");
    var tabIndex = -1;
    panels.forEach(function (panel, i) {
      if (panel.getAttribute("data-hub-panel") === panelId) {
        tabIndex = i;
      }
    });
    if (tabIndex >= 0 && tabItems[tabIndex]) {
      tabItems[tabIndex].click();
      return true;
    }

    return false;
  }

  function parseAmount(value) {
    var raw = String(value || "")
      .replace(/[₹,\s]/g, "")
      .trim();
    if (!raw) return NaN;
    var n = parseFloat(raw);
    return Number.isFinite(n) && n > 0 ? n : NaN;
  }

  function isValidPayAmount(value) {
    return Number.isFinite(parseAmount(value));
  }

  function formatInr(amount) {
    var n = parseAmount(amount);
    if (!Number.isFinite(n)) return "₹0";
    var fixed = n % 1 === 0 ? String(Math.round(n)) : n.toFixed(2);
    return "₹" + fixed;
  }

  function maskAccountDisplay(mask) {
    var m = String(mask || "").replace(/•/g, "");
    if (!m) return "XXXXXX";
    return "XXXXXX" + m.replace(/\s/g, "");
  }

  function initPanel(root) {
    if (!root || root._mtSelfBankInit) return;
    root._mtSelfBankInit = true;

    var steps = {};
    root.querySelectorAll("[data-mt-self-step]").forEach(function (el) {
      steps[el.getAttribute("data-mt-self-step")] = el;
    });

    var checkout = root.querySelector("[data-mt-self-checkout]");
    var amountInput = root.querySelector("[data-mt-self-amount]");
    var proceedBtn = root.querySelector("[data-mt-self-proceed]");
    var payMaskEl = root.querySelector("[data-mt-self-pay-mask]");
    var payIconEl = root.querySelector("[data-mt-self-pay-icon]");
    var checkoutTotal = root.querySelector("[data-mt-self-checkout-total]");
    var payFinalAmount = root.querySelector("[data-mt-self-pay-final-amount]");
    var payFinalBtn = root.querySelector("[data-mt-self-pay-final]");

    var backMap = Object.assign({}, DEFAULT_BACK);
    var state = {
      step: "send",
      bankId: "",
      bankName: "",
      bankMask: "",
      bankIconBg: "#6f42c1",
      bankIconLabel: "",
      amount: "",
    };

    var shared = {
      showStep: showStep,
      registerBackMap: function (map) {
        backMap = Object.assign({}, DEFAULT_BACK, map || {});
      },
    };

    function syncAmountFromInput() {
      if (amountInput) {
        state.amount = amountInput.value;
      }
      return state.amount;
    }

    function setProceedEnabled() {
      if (!proceedBtn) return;
      var value = syncAmountFromInput();
      var ok = isValidPayAmount(value);
      proceedBtn.disabled = !ok;
      proceedBtn.classList.toggle("is-ready", ok);
      proceedBtn.setAttribute("aria-disabled", ok ? "false" : "true");
    }

    function updateAmountDisplays() {
      var label = formatInr(state.amount);
      if (checkoutTotal) checkoutTotal.textContent = label;
      if (payFinalAmount) payFinalAmount.textContent = label;
      root.querySelectorAll("[data-mt-self-source-amount]").forEach(function (el) {
        el.textContent = label;
      });
      if (payFinalAmount) payFinalAmount.textContent = label;
    }

    function applySelectedBankToPay() {
      if (payMaskEl) {
        payMaskEl.textContent = maskAccountDisplay(state.bankMask);
      }
      if (payIconEl) {
        payIconEl.style.backgroundColor = state.bankIconBg;
        payIconEl.textContent = state.bankIconLabel;
        payIconEl.className = "mt-self-pay-recipient__icon";
      }
    }

    function showStep(stepName) {
      state.step = stepName;
      var showCheckout = stepName === "checkout";
      var visibleFlowStep = showCheckout ? "pay" : stepName;

      Object.keys(steps).forEach(function (key) {
        var el = steps[key];
        if (!el) return;
        var on = key === visibleFlowStep;
        el.classList.toggle("is-active", on);
        if (on) {
          el.removeAttribute("hidden");
        } else {
          el.setAttribute("hidden", "");
        }
      });

      if (checkout) {
        checkout.hidden = !showCheckout;
        checkout.setAttribute("aria-hidden", showCheckout ? "false" : "true");
        document.body.classList.toggle("mt-self-checkout-open", showCheckout);
      }

      if (visibleFlowStep === "pay") {
        setProceedEnabled();
      }
    }

    function goBack() {
      if (state.step === "checkout") {
        showStep("pay");
        return;
      }
      var prev = backMap[state.step];
      showStep(prev || "send");
    }

    function selectBank(btn) {
      if (!btn) return;
      state.bankId = btn.getAttribute("data-bank-id") || "";
      state.bankName = btn.getAttribute("data-bank-name") || "";
      state.bankMask = btn.getAttribute("data-bank-mask") || "";
      state.bankIconBg = btn.getAttribute("data-bank-icon-bg") || "#6f42c1";
      state.bankIconLabel = btn.getAttribute("data-bank-icon-label") || "";
      applySelectedBankToPay();
      state.amount = "";
      if (amountInput) {
        amountInput.value = "";
      }
      showStep("pay");
      setProceedEnabled();
      if (amountInput) {
        amountInput.focus();
      }
    }

    function openCheckout() {
      updateAmountDisplays();
      showStep("checkout");
    }

    root.querySelectorAll("[data-mt-self-go]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-mt-self-go");
        if (target) showStep(target);
      });
    });

    root.querySelectorAll("[data-mt-self-hub-go]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var panelId = btn.getAttribute("data-mt-self-hub-go");
        var sendMode = btn.getAttribute("data-mt-send-mode") || "";
        goToHubPanel(panelId, sendMode);
      });
    });

    root.querySelectorAll("[data-mt-self-suggested]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var bankId = btn.getAttribute("data-mt-self-bank-id");
        var match = root.querySelector('[data-mt-self-pick-bank][data-bank-id="' + bankId + '"]');
        if (match) {
          selectBank(match);
        } else {
          showStep("banks");
        }
      });
    });

    root.querySelectorAll("[data-mt-self-pick-bank]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectBank(btn);
      });
    });

    root.querySelectorAll("[data-mt-self-back]").forEach(function (btn) {
      btn.addEventListener("click", goBack);
    });

    if (amountInput) {
      ["input", "keyup", "change", "paste"].forEach(function (evt) {
        amountInput.addEventListener(evt, function () {
          window.requestAnimationFrame(setProceedEnabled);
        });
      });
    }

    if (proceedBtn) {
      proceedBtn.addEventListener("click", function () {
        if (!isValidPayAmount(syncAmountFromInput())) return;
        openCheckout();
      });
    }

    root.querySelectorAll("[data-mt-self-pay-source]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        if (btn.getAttribute("data-needs-pin") === "1") {
          return;
        }
        if (e.target.closest("[data-mt-self-pin-link]")) return;
        root.querySelectorAll("[data-mt-self-pay-source]").forEach(function (other) {
          var selected = other === btn;
          other.classList.toggle("is-selected", selected);
          other.setAttribute("aria-pressed", selected ? "true" : "false");
        });
      });
    });

    root.querySelectorAll("[data-mt-self-checkout-dismiss]").forEach(function (el) {
      el.addEventListener("click", function () {
        showStep("pay");
      });
    });

    if (payFinalBtn) {
      payFinalBtn.addEventListener("click", function () {
        var amt = formatInr(state.amount);
        window.alert(
          "Payment of " +
            amt +
            " to " +
            state.bankName +
            " " +
            state.bankMask +
            " will be processed via UPI."
        );
      });
    }

    if (window.MtIfscFlow && window.MtIfscFlow.initIfsc) {
      window.MtIfscFlow.initIfsc(root, shared);
    }

    showStep("send");
  }

  function boot() {
    document.querySelectorAll("[data-mt-self-bank]").forEach(initPanel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  document.addEventListener("hub-panel-activated", function (ev) {
    var panelId = ev.detail && ev.detail.panelSlug;
    if (!panelId) return;
    document
      .querySelectorAll('[data-hub-panel="' + panelId + '"][data-mt-self-bank]')
      .forEach(initPanel);
  });
})();
