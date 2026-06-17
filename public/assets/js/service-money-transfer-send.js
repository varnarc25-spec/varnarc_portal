/**
 * Money Transfer — Send Money hub form (UPI / Mobile sub-tabs + recent contacts).
 */
(function () {
  "use strict";

  function formatAmountInput(raw) {
    var digits = String(raw || "").replace(/[^\d.]/g, "");
    var parts = digits.split(".");
    if (parts.length > 2) {
      digits = parts[0] + "." + parts.slice(1).join("");
    }
    var whole = parts[0].replace(/\D/g, "");
    var frac = parts[1] != null ? parts[1].replace(/\D/g, "").slice(0, 2) : "";
    if (!whole) {
      return frac ? "0." + frac : "";
    }
    var withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return frac.length ? withCommas + "." + frac : withCommas;
  }

  function initPanel(root) {
    if (!root || root.getAttribute("data-mt-send-init") === "1") {
      return;
    }
    root.setAttribute("data-mt-send-init", "1");

    var form = root.querySelector(".mt-send-form");
    var modeInput = root.querySelector('input[name="mode"]');
    var modeButtons = root.querySelectorAll("[data-mt-send-mode]");
    var modePanels = root.querySelectorAll("[data-mt-send-panel]");
    var amountInput = root.querySelector('input[name="amount"]');
    var upiInput = root.querySelector('[data-mt-send-panel="upi"] [data-mt-recipient]');
    var mobileInput = root.querySelector('[data-mt-send-panel="mobile"] [data-mt-recipient]');

    function activeMode() {
      return modeInput && modeInput.value === "upi" ? "upi" : "mobile";
    }

    function setMode(mode) {
      var isUpi = mode === "upi";
      if (modeInput) {
        modeInput.value = isUpi ? "upi" : "mobile";
      }
      modeButtons.forEach(function (btn) {
        var on = btn.getAttribute("data-mt-send-mode") === mode;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
      });
      modePanels.forEach(function (panel) {
        var on = panel.getAttribute("data-mt-send-panel") === mode;
        panel.classList.toggle("is-active", on);
        if (on) {
          panel.removeAttribute("hidden");
        } else {
          panel.setAttribute("hidden", "");
        }
      });
      var recipient = isUpi ? upiInput : mobileInput;
      if (recipient) {
        recipient.focus();
      }
    }

    modeButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setMode(btn.getAttribute("data-mt-send-mode") || "mobile");
      });
    });

    root.querySelectorAll("[data-mt-recent-contact]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var value = btn.getAttribute("data-mt-value") || "";
        var mobile = btn.getAttribute("data-mt-mobile") || "";
        if (value.indexOf("@") !== -1) {
          setMode("upi");
          if (upiInput) {
            upiInput.value = value;
          }
        } else {
          setMode("mobile");
          if (mobileInput) {
            mobileInput.value = mobile;
          }
        }
        if (amountInput) {
          amountInput.focus();
        }
      });
    });

    if (amountInput) {
      amountInput.addEventListener("input", function () {
        var pos = amountInput.selectionStart;
        amountInput.value = formatAmountInput(amountInput.value);
        if (typeof pos === "number") {
          amountInput.setSelectionRange(pos, pos);
        }
      });
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var mode = activeMode();
        var recipient =
          mode === "upi"
            ? upiInput && upiInput.value.trim()
            : mobileInput && mobileInput.value.trim();
        var amount = amountInput && amountInput.value.replace(/,/g, "").trim();
        var noteEl = form.querySelector('input[name="note"]');
        var note = noteEl && noteEl.value.trim();

        if (!recipient) {
          window.alert(mode === "upi" ? "Enter a UPI ID." : "Enter a valid mobile number.");
          return;
        }
        if (mode === "mobile" && !/^[6-9]\d{9}$/.test(recipient)) {
          window.alert("Enter a valid 10-digit mobile number.");
          return;
        }
        if (!amount || Number(amount) <= 0) {
          window.alert("Enter a valid amount.");
          return;
        }

        var url = new URL(form.getAttribute("action") || window.location.pathname, window.location.origin);
        url.searchParams.set("mode", mode);
        if (mode === "upi") {
          url.searchParams.set("upi", recipient);
        } else {
          url.searchParams.set("mobile", recipient);
        }
        url.searchParams.set("amount", amount);
        if (note) {
          url.searchParams.set("note", note);
        }
        window.location.href = url.pathname + url.search;
      });
    }

    var params = new URLSearchParams(window.location.search);
    var initialMode = params.get("mode") === "upi" ? "upi" : "mobile";
    setMode(initialMode);
  }

  function boot() {
    document.querySelectorAll("[data-money-transfer-send]").forEach(initPanel);
  }

  document.addEventListener("hub-panel-activated", function (ev) {
    var panelId = ev.detail && ev.detail.panelId;
    if (!panelId) {
      return;
    }
    document.querySelectorAll('[data-hub-panel="' + panelId + '"][data-money-transfer-send]').forEach(function (root) {
      root.removeAttribute("data-mt-send-init");
      initPanel(root);
    });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
