/**
 * Money Transfer — To Account Number & IFSC flow (saved → chat | add bank → select → form).
 */
(function () {
  "use strict";

  var BACK_MAP = {
    banks: "send",
    pay: "banks",
    checkout: "pay",
    "ifsc-saved": "send",
    "ifsc-chat": "ifsc-saved",
    "ifsc-select-bank": "ifsc-saved",
    "ifsc-add-account": "ifsc-select-bank",
  };

  function parseAmount(value) {
    var raw = String(value || "")
      .replace(/[₹,\s]/g, "")
      .trim();
    if (!raw) return NaN;
    var n = parseFloat(raw);
    return Number.isFinite(n) && n > 0 ? n : NaN;
  }

  function isValidIfsc(code) {
    return /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(String(code || "").trim());
  }

  function loadReceiverBanks(root) {
    var slug = root.getAttribute("data-hub-panel") || "";
    var el = document.getElementById("mt-receiver-banks-data-" + slug);
    if (!el || !el.textContent) return [];
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      return [];
    }
  }

  function initIfsc(root, shared) {
    if (!root || root._mtIfscInit) return;
    root._mtIfscInit = true;

    var receiverBanks = loadReceiverBanks(root);
    var searchInput = root.querySelector("[data-mt-ifsc-bank-search]");
    var searchResults = root.querySelector("[data-mt-ifsc-search-results]");
    var chatAmountInput = root.querySelector("[data-mt-ifsc-chat-amount]");
    var chatSendBtn = root.querySelector("[data-mt-ifsc-chat-send]");
    var accountInput = root.querySelector("[data-mt-ifsc-account-number]");
    var ifscInput = root.querySelector("[data-mt-ifsc-code]");
    var nextBtn = root.querySelector("[data-mt-ifsc-next]");
    var addIcon = root.querySelector("[data-mt-ifsc-add-icon]");
    var addBankName = root.querySelector("[data-mt-ifsc-add-bank-name]");
    var chatAvatar = root.querySelector("[data-mt-ifsc-chat-avatar]");
    var chatName = root.querySelector("[data-mt-ifsc-chat-name]");
    var chatBank = root.querySelector("[data-mt-ifsc-chat-bank]");

    var ifscState = {
      receiverBankId: "",
      receiverBankName: "",
      receiverIconBg: "#0071e3",
      receiverIconLabel: "",
      savedName: "",
      savedBankLine: "",
    };

    function applyReceiverToAddForm() {
      if (addIcon) {
        addIcon.style.backgroundColor = ifscState.receiverIconBg;
        addIcon.textContent = ifscState.receiverIconLabel;
        addIcon.className = "mt-ifsc-add-card__bank-icon";
      }
      if (addBankName) {
        addBankName.textContent = ifscState.receiverBankName || "—";
      }
    }

    function applySavedToChat(btn) {
      ifscState.savedName = btn.getAttribute("data-account-name") || "";
      var bank = btn.getAttribute("data-bank-name") || "";
      var mask = btn.getAttribute("data-bank-mask") || "";
      ifscState.savedBankLine = bank + (mask ? " - " + mask.replace(/•/g, "") : "");
      var iconBg = btn.getAttribute("data-icon-bg") || "#0071e3";
      var iconLabel = btn.getAttribute("data-icon-label") || "";

      if (chatAvatar) {
        chatAvatar.style.backgroundColor = iconBg;
        chatAvatar.textContent = iconLabel;
      }
      if (chatName) chatName.textContent = ifscState.savedName;
      if (chatBank) chatBank.textContent = ifscState.savedBankLine;
    }

    function pickReceiver(btn) {
      ifscState.receiverBankId = btn.getAttribute("data-bank-id") || "";
      ifscState.receiverBankName = btn.getAttribute("data-bank-name") || "";
      ifscState.receiverIconBg = btn.getAttribute("data-icon-bg") || "#0071e3";
      ifscState.receiverIconLabel = btn.getAttribute("data-icon-label") || "";
      applyReceiverToAddForm();
      if (accountInput) accountInput.value = "";
      if (ifscInput) ifscInput.value = "";
      setNextEnabled();
      shared.showStep("ifsc-add-account");
      if (accountInput) accountInput.focus();
    }

    function setChatSendEnabled() {
      if (!chatSendBtn || !chatAmountInput) return;
      var ok = Number.isFinite(parseAmount(chatAmountInput.value));
      chatSendBtn.disabled = !ok;
    }

    function setNextEnabled() {
      if (!nextBtn) return;
      var acct = accountInput ? accountInput.value.replace(/\s/g, "") : "";
      var ifsc = ifscInput ? ifscInput.value.trim() : "";
      var ok = acct.length >= 9 && isValidIfsc(ifsc);
      nextBtn.disabled = !ok;
    }

    function renderSearchResults(query) {
      if (!searchResults) return;
      var q = String(query || "")
        .trim()
        .toLowerCase();
      if (!q) {
        searchResults.hidden = true;
        searchResults.innerHTML = "";
        if (searchInput) searchInput.setAttribute("aria-expanded", "false");
        return;
      }

      var matches = receiverBanks.filter(function (b) {
        return b.name && b.name.toLowerCase().indexOf(q) !== -1;
      });
      if (matches.length === 0) {
        searchResults.hidden = true;
        searchResults.innerHTML = "";
        return;
      }

      searchResults.innerHTML = matches
        .slice(0, 8)
        .map(function (b) {
          return (
            '<li role="option">' +
            '<button type="button" class="mt-ifsc-search-results__item" data-mt-ifsc-pick-receiver ' +
            'data-bank-id="' +
            escapeAttr(b.id) +
            '" data-bank-name="' +
            escapeAttr(b.name) +
            '" data-icon-bg="' +
            escapeAttr(b.iconBg) +
            '" data-icon-label="' +
            escapeAttr(b.iconLabel) +
            '">' +
            '<span class="mt-ifsc-search-results__icon" style="background-color:' +
            escapeAttr(b.iconBg) +
            '">' +
            escapeAttr(b.iconLabel) +
            "</span>" +
            "<span>" +
            escapeHtml(b.name) +
            "</span>" +
            "</button></li>"
          );
        })
        .join("");

      searchResults.hidden = false;
      if (searchInput) searchInput.setAttribute("aria-expanded", "true");

      searchResults.querySelectorAll("[data-mt-ifsc-pick-receiver]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (searchInput) searchInput.value = btn.getAttribute("data-bank-name") || "";
          renderSearchResults("");
          pickReceiver(btn);
        });
      });
    }

    function escapeAttr(s) {
      return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;");
    }

    function escapeHtml(s) {
      return escapeAttr(s);
    }

    root.querySelectorAll("[data-mt-ifsc-pick-saved]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applySavedToChat(btn);
        if (chatAmountInput) chatAmountInput.value = "";
        setChatSendEnabled();
        shared.showStep("ifsc-chat");
        if (chatAmountInput) chatAmountInput.focus();
      });
    });

    root.querySelectorAll("[data-mt-ifsc-pick-receiver]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        pickReceiver(btn);
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        renderSearchResults(searchInput.value);
      });
      searchInput.addEventListener("focus", function () {
        if (searchInput.value.trim()) renderSearchResults(searchInput.value);
      });
      document.addEventListener("click", function (e) {
        if (!root.contains(e.target)) {
          renderSearchResults("");
        }
      });
    }

    if (chatAmountInput) {
      ["input", "keyup", "change"].forEach(function (evt) {
        chatAmountInput.addEventListener(evt, setChatSendEnabled);
      });
    }

    if (chatSendBtn) {
      chatSendBtn.addEventListener("click", function () {
        var amt = parseAmount(chatAmountInput ? chatAmountInput.value : "");
        if (!Number.isFinite(amt)) return;
        window.alert(
          "Sending ₹" +
            amt +
            " to " +
            ifscState.savedName +
            " (" +
            ifscState.savedBankLine +
            ") via bank transfer."
        );
      });
    }

    if (accountInput) {
      accountInput.addEventListener("input", setNextEnabled);
    }
    if (ifscInput) {
      ifscInput.addEventListener("input", function () {
        ifscInput.value = ifscInput.value.toUpperCase();
        setNextEnabled();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (nextBtn.disabled) return;
        var acct = accountInput ? accountInput.value.replace(/\s/g, "") : "";
        var ifsc = ifscInput ? ifscInput.value.trim().toUpperCase() : "";
        window.alert(
          "Bank account added:\n" +
            ifscState.receiverBankName +
            "\nAccount: " +
            acct +
            "\nIFSC: " +
            ifsc
        );
        shared.showStep("ifsc-saved");
      });
    }

    shared.registerBackMap(BACK_MAP);
  }

  window.MtIfscFlow = { initIfsc: initIfsc };
})();
