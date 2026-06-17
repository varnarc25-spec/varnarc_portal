/**
 * Money Transfer — Check Balance: UPI PIN gate, then accordion (balance + transactions).
 */
(function () {
  "use strict";

  var DEFAULT_PIN_LENGTH = 6;

  function normalizePinLength(value) {
    var n = parseInt(String(value || ""), 10);
    return n === 4 ? 4 : DEFAULT_PIN_LENGTH;
  }

  function getPinLengthFromItem(item) {
    if (!item) {
      return DEFAULT_PIN_LENGTH;
    }
    return normalizePinLength(item.getAttribute("data-mt-cb-pin-length"));
  }

  function pinPlaceholder(length) {
    var dots = "";
    var i = 0;
    for (; i < length; i += 1) {
      dots += "•";
    }
    return dots;
  }

  function applyPinLengthToModal(modal, length) {
    if (!modal) {
      return;
    }
    modal._pinLength = length;

    var input = modal.querySelector("[data-mt-cb-pin-input]");
    if (input) {
      input.maxLength = length;
      input.placeholder = pinPlaceholder(length);
      input.setAttribute("data-pin-length", String(length));
      input.classList.toggle("mt-cb-pin-modal__input--len-4", length === 4);
      input.classList.toggle("mt-cb-pin-modal__input--len-6", length === 6);
      input.value = "";
    }

    var labelText = length + "-digit";
    modal.querySelectorAll("[data-mt-cb-pin-length-label]").forEach(function (el) {
      el.textContent = labelText;
    });

    var inputLabel = modal.querySelector("[data-mt-cb-pin-input-label]");
    if (inputLabel) {
      inputLabel.textContent = length + "-digit UPI PIN";
    }
  }

  function closeAccordion(item) {
    if (!item) {
      return;
    }
    item.classList.remove("is-open");
    var trigger = item.querySelector("[data-mt-cb-trigger]");
    var panel = item.querySelector(".mt-cb-accordion__panel");
    if (trigger) {
      trigger.setAttribute("aria-expanded", "false");
    }
    if (panel) {
      panel.setAttribute("hidden", "");
    }
  }

  function openAccordion(item) {
    if (!item) {
      return;
    }
    item.classList.add("is-open");
    var trigger = item.querySelector("[data-mt-cb-trigger]");
    var panel = item.querySelector(".mt-cb-accordion__panel");
    if (trigger) {
      trigger.setAttribute("aria-expanded", "true");
    }
    if (panel) {
      panel.removeAttribute("hidden");
    }
  }

  function closeOtherAccordions(root, exceptItem) {
    root.querySelectorAll("[data-mt-cb-accordion].is-open").forEach(function (openItem) {
      if (openItem !== exceptItem) {
        closeAccordion(openItem);
      }
    });
  }

  function getPinModal(root) {
    return root._mtCbPinModal || null;
  }

  function hidePinModal(modal) {
    if (!modal) {
      return;
    }
    modal.setAttribute("hidden", "");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("mt-cb-pin-modal-open");
    var input = modal.querySelector("[data-mt-cb-pin-input]");
    if (input) {
      input.value = "";
    }
    var err = modal.querySelector("[data-mt-cb-pin-error]");
    if (err) {
      err.setAttribute("hidden", "");
    }
    modal._pinLength = null;
  }

  function showPinModal(root, item, onSuccess) {
    var modal = getPinModal(root);
    if (!modal) {
      onSuccess();
      return;
    }

    var pinLength = getPinLengthFromItem(item);
    applyPinLengthToModal(modal, pinLength);

    var needsSetup = item.getAttribute("data-mt-cb-needs-setup") === "1";
    var name = item.getAttribute("data-mt-cb-account-name") || "this account";
    var formBlock = modal.querySelector("[data-mt-cb-pin-form]");
    var setupBlock = modal.querySelector("[data-mt-cb-pin-setup]");
    var setupLink = modal.querySelector("[data-mt-cb-pin-setup-link]");
    var nameEl = modal.querySelector("[data-mt-cb-pin-account-name]");
    var input = modal.querySelector("[data-mt-cb-pin-input]");

    if (nameEl) {
      nameEl.textContent = name;
    }

    if (needsSetup) {
      if (formBlock) {
        formBlock.setAttribute("hidden", "");
      }
      if (setupBlock) {
        setupBlock.removeAttribute("hidden");
      }
      var setPinLink = item.querySelector(".mt-cb-accordion__action");
      if (setupLink && setPinLink) {
        setupLink.setAttribute("href", setPinLink.getAttribute("href") || "#");
      }
    } else {
      if (setupBlock) {
        setupBlock.setAttribute("hidden", "");
      }
      if (formBlock) {
        formBlock.removeAttribute("hidden");
      }
    }

    modal._pendingItem = item;
    modal._onSuccess = onSuccess;

    modal.removeAttribute("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("mt-cb-pin-modal-open");

    if (!needsSetup && input) {
      window.setTimeout(function () {
        input.focus();
      }, 50);
    }
  }

  function validatePin(pin, length) {
    var len = normalizePinLength(length);
    return new RegExp("^[0-9]{" + len + "}$").test(String(pin || ""));
  }

  function requestOpen(item, root) {
    if (item.classList.contains("is-open")) {
      closeAccordion(item);
      return;
    }

    closeOtherAccordions(root, item);

    if (item.getAttribute("data-mt-cb-needs-setup") === "1") {
      showPinModal(root, item, function () {});
      return;
    }

    showPinModal(root, item, function () {
      openAccordion(item);
    });
  }

  function initPinModal(root) {
    var modal = root.querySelector("[data-mt-cb-pin-modal]");
    if (!modal || modal.getAttribute("data-mt-cb-pin-init") === "1") {
      return;
    }
    root._mtCbPinModal = modal;
    modal.setAttribute("data-mt-cb-pin-init", "1");
    if (modal.parentNode !== document.body) {
      document.body.appendChild(modal);
    }

    var input = modal.querySelector("[data-mt-cb-pin-input]");

    function dismiss() {
      hidePinModal(modal);
      modal._pendingItem = null;
      modal._onSuccess = null;
    }

    function submitPin() {
      if (!modal._onSuccess) {
        dismiss();
        return;
      }
      var pinLength = normalizePinLength(modal._pinLength);
      var pin = input && input.value.trim();
      var err = modal.querySelector("[data-mt-cb-pin-error]");
      if (!validatePin(pin, pinLength)) {
        if (err) {
          err.removeAttribute("hidden");
        }
        if (input) {
          input.focus();
          input.select();
        }
        return;
      }
      if (err) {
        err.setAttribute("hidden", "");
      }
      var done = modal._onSuccess;
      dismiss();
      done();
    }

    modal.querySelectorAll("[data-mt-cb-pin-dismiss]").forEach(function (el) {
      el.addEventListener("click", dismiss);
    });

    var submitBtn = modal.querySelector("[data-mt-cb-pin-submit]");
    if (submitBtn) {
      submitBtn.addEventListener("click", submitPin);
    }

    if (input) {
      input.addEventListener("input", function () {
        var pinLength = normalizePinLength(modal._pinLength);
        input.value = input.value.replace(/\D/g, "").slice(0, pinLength);
        var err = modal.querySelector("[data-mt-cb-pin-error]");
        if (err) {
          err.setAttribute("hidden", "");
        }
        if (input.value.length === pinLength) {
          submitPin();
        }
      });
      input.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          submitPin();
        }
        if (ev.key === "Escape") {
          dismiss();
        }
      });
    }

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
        dismiss();
      }
    });
  }

  function initPanel(root) {
    if (!root || root.getAttribute("data-mt-cb-init") === "1") {
      return;
    }
    root.setAttribute("data-mt-cb-init", "1");

    initPinModal(root);

    root.querySelectorAll("[data-mt-cb-trigger]").forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var item = trigger.closest("[data-mt-cb-accordion]");
        requestOpen(item, root);
      });
    });

    root.querySelectorAll(".mt-cb-accordion__action").forEach(function (link) {
      link.addEventListener("click", function (ev) {
        ev.stopPropagation();
      });
    });
  }

  function boot() {
    document.querySelectorAll("[data-check-balance-panel]").forEach(initPanel);
  }

  document.addEventListener("hub-panel-activated", function (ev) {
    var panelId = ev.detail && ev.detail.panelId;
    if (panelId !== "check_balance") {
      return;
    }
    document
      .querySelectorAll('[data-hub-panel="check_balance"][data-check-balance-panel]')
      .forEach(function (root) {
        root.removeAttribute("data-mt-cb-init");
        initPanel(root);
      });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
