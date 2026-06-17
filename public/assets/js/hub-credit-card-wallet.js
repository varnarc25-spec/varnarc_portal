/**
 * CRED-style saved credit cards + bills (localStorage until API is wired).
 */
(function () {
  "use strict";

  var STORAGE_KEY = "varnarc_credit_cards_v1";
  var AUTH_USER_KEY = "varnarc_auth_user";

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
    return "card_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
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

  function loadCards() {
    return readJson(STORAGE_KEY, []);
  }

  function saveCards(list) {
    writeJson(STORAGE_KEY, list);
  }

  function seedDemoCards() {
    var now = new Date();
    var gen = now.toISOString();
    return [
      {
        id: uid(),
        issuerKey: "hdfc bank credit card",
        issuerName: "HDFC Credit Card",
        initials: "HD",
        color: "c1",
        last4: "4521",
        mobile: "",
        bill: {
          amount: 12450,
          generatedAt: gen,
          dueAt: addDays(now, 10),
          status: "ready",
        },
      },
      {
        id: uid(),
        issuerKey: "icici bank credit card",
        issuerName: "ICICI Credit Card",
        initials: "IC",
        color: "c3",
        last4: "8890",
        mobile: "",
        bill: {
          amount: 6820,
          generatedAt: addDays(now, -2),
          dueAt: addDays(now, 5),
          status: "ready",
        },
      },
    ];
  }

  function ensureCards() {
    var list = loadCards();
    if (!list.length && isSignedIn()) {
      list = seedDemoCards();
      saveCards(list);
    }
    return list;
  }

  function findProviderMeta(key, root) {
    var btn = root.querySelector('[data-credit-card-provider="' + key + '"]');
    if (!btn) return { initials: "CC", color: "c0", name: key };
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
      initials: logo ? logo.textContent.trim() : "CC",
      color: color,
      name: nameEl ? nameEl.textContent.trim() : key,
    };
  }

  window.VARNARC_CREDIT_CARD_STORE = {
    load: loadCards,
    save: saveCards,
    ensure: ensureCards,
    formatInr: formatInr,
    formatDate: formatDate,
    uid: uid,
    isSignedIn: isSignedIn,
  };

  function initCreditCardWallet(root) {
    if (!root || root.getAttribute("data-ccb-wallet-init") === "1") return;
    root.setAttribute("data-ccb-wallet-init", "1");

    var stepCards = root.querySelector('[data-credit-card-step="cards"]');
    var stepPick = root.querySelector('[data-credit-card-step="pick"]');
    var stepDetails = root.querySelector('[data-credit-card-step="details"]');
    var stepPay = root.querySelector('[data-credit-card-step="pay"]');
    var listEl = root.querySelector("[data-ccb-wallet-list]");
    var addBtn = root.querySelector("[data-ccb-add-card]");
    var browseAllBtn = root.querySelector("[data-ccb-browse-all]");
    var walletWrap = root.querySelector("[data-ccb-wallet]");
    var payPanel = root.querySelector("[data-ccb-pay-panel]");
    var payAmountEl = root.querySelector("[data-ccb-pay-amount]");
    var payMetaEl = root.querySelector("[data-ccb-pay-meta]");
    var payConfirmBtn = root.querySelector("[data-ccb-pay-confirm]");

    var selectedNameEl = root.querySelector("[data-credit-card-selected-name]");
    var consentBankEl = root.querySelector("[data-credit-card-consent-bank]");
    var detailsForm = root.querySelector("[data-credit-card-details-form]");
    var last4Input = root.querySelector("[data-credit-card-last4]");
    var mobileInput = root.querySelector("[data-credit-card-mobile]");
    var consentInput = root.querySelector("[data-credit-card-consent]");
    var fetchBtn = root.querySelector("[data-credit-card-fetch]");
    var fetchStatus = root.querySelector("[data-credit-card-fetch-status]");
    var searchInput = root.querySelector("[data-credit-card-provider-search]");
    var clearBtn = root.querySelector("[data-credit-card-search-clear]");
    var lists = root.querySelectorAll("[data-credit-card-provider-list]");

    var activeCardId = null;
    var pendingProvider = null;

    function showStep(step) {
      if (stepCards) stepCards.hidden = step !== "cards";
      if (stepPick) stepPick.hidden = step !== "pick";
      if (stepDetails) stepDetails.hidden = step !== "details";
      if (stepPay) stepPay.hidden = step !== "pay";
    }

    function renderWallet() {
      if (!listEl) return;
      var cards = ensureCards();
      listEl.innerHTML = "";

      var guestLead = root.querySelector(".hub-quick-access__lead");
      if (guestLead) guestLead.hidden = isSignedIn();

      if (walletWrap) walletWrap.hidden = !isSignedIn();
      if (!isSignedIn()) return;

      cards.forEach(function (card) {
        var li = document.createElement("li");
        var bill = card.bill || {};
        var hasBill = bill.status === "ready" && bill.amount > 0;
        var bannerClass = "ccb-card-tile__banner ccb-card-tile__banner--" + (card.color || "c0");

        li.innerHTML =
          '<article class="ccb-card-tile" data-ccb-card-id="' +
          card.id +
          '">' +
          '<div class="' +
          bannerClass +
          '">' +
          '<div class="ccb-card-tile__issuer-row">' +
          '<span class="ccb-card-tile__logo" aria-hidden="true">' +
          (card.initials || "CC") +
          "</span>" +
          "<div>" +
          '<p class="ccb-card-tile__issuer-name">' +
          (card.issuerName || "Credit Card") +
          "</p>" +
          '<span class="ccb-card-tile__mask">•••• ' +
          (card.last4 || "----") +
          "</span>" +
          "</div></div></div>" +
          '<div class="ccb-card-tile__body">' +
          (hasBill
            ? '<p class="ccb-card-tile__amount-label">Total due</p>' +
              '<p class="ccb-card-tile__amount">' +
              formatInr(bill.amount) +
              "</p>" +
              '<dl class="ccb-card-tile__meta">' +
              "<dt>Due date</dt><dd>" +
              formatDate(bill.dueAt) +
              "</dd>" +
              "<dt>Bill generated</dt><dd>" +
              formatDate(bill.generatedAt) +
              "</dd></dl>"
            : '<p class="ccb-card-tile__status">No bill fetched yet. Link your card to fetch the latest statement.</p>') +
          '<div class="ccb-card-tile__actions">' +
          (hasBill
            ? '<button type="button" class="ccb-card-tile__pay" data-ccb-action="pay">Pay ' +
              formatInr(bill.amount) +
              "</button>"
            : "") +
          '<button type="button" class="ccb-card-tile__secondary" data-ccb-action="fetch">' +
          (hasBill ? "Refresh bill" : "Fetch bill") +
          "</button></div></div></article>";
        listEl.appendChild(li);
      });

      listEl.querySelectorAll("[data-ccb-action]").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var tile = btn.closest("[data-ccb-card-id]");
          if (!tile) return;
          var id = tile.getAttribute("data-ccb-card-id");
          var action = btn.getAttribute("data-ccb-action");
          if (action === "pay") openPay(id);
          else openDetailsForCard(id);
        });
      });

      listEl.querySelectorAll(".ccb-card-tile").forEach(function (tile) {
        tile.addEventListener("click", function () {
          var id = tile.getAttribute("data-ccb-card-id");
          var card = ensureCards().find(function (c) {
            return c.id === id;
          });
          if (card && card.bill && card.bill.status === "ready") openPay(id);
          else openDetailsForCard(id);
        });
      });
    }

    function openPay(cardId) {
      var card = ensureCards().find(function (c) {
        return c.id === cardId;
      });
      if (!card || !card.bill) return;
      activeCardId = cardId;
      if (payAmountEl) payAmountEl.textContent = formatInr(card.bill.amount);
      if (payMetaEl) {
        payMetaEl.innerHTML =
          "<strong>" +
          card.issuerName +
          '</strong> · •••• ' +
          card.last4 +
          "<br>Due by <strong>" +
          formatDate(card.bill.dueAt) +
          "</strong> · Bill generated <strong>" +
          formatDate(card.bill.generatedAt) +
          "</strong>";
      }
      showStep("pay");
    }

    function openDetailsForCard(cardId) {
      var card = ensureCards().find(function (c) {
        return c.id === cardId;
      });
      if (!card) return;
      activeCardId = cardId;
      pendingProvider = card.issuerKey;
      if (selectedNameEl) selectedNameEl.textContent = card.issuerName;
      if (consentBankEl) consentBankEl.textContent = card.issuerName;
      if (last4Input) last4Input.value = card.last4 || "";
      if (mobileInput) mobileInput.value = card.mobile || "";
      if (consentInput) consentInput.checked = false;
      if (fetchStatus) fetchStatus.textContent = "";
      setFetchEnabled();
      showStep("details");
    }

    function openDetailsForProvider(providerKey, providerName) {
      pendingProvider = providerKey;
      activeCardId = null;
      if (selectedNameEl) selectedNameEl.textContent = providerName;
      if (consentBankEl) consentBankEl.textContent = providerName;
      if (last4Input) last4Input.value = "";
      if (mobileInput) mobileInput.value = "";
      if (consentInput) consentInput.checked = false;
      if (fetchStatus) fetchStatus.textContent = "";
      setFetchEnabled();
      showStep("details");
    }

    function openPick() {
      showStep("pick");
    }

    function openCards() {
      activeCardId = null;
      pendingProvider = null;
      renderWallet();
      showStep("cards");
    }

    function setFetchEnabled() {
      if (!fetchBtn) return;
      var four = last4Input ? String(last4Input.value || "").replace(/\D/g, "") : "";
      var mob = mobileInput ? String(mobileInput.value || "").replace(/\D/g, "") : "";
      fetchBtn.disabled =
        four.length !== 4 || mob.length !== 10 || !(consentInput && consentInput.checked);
    }

    if (addBtn) addBtn.addEventListener("click", openPick);
    if (browseAllBtn) browseAllBtn.addEventListener("click", openPick);

    root.querySelectorAll("[data-credit-card-back]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (stepPay && !stepPay.hidden) openCards();
        else if (stepDetails && !stepDetails.hidden) {
          if (activeCardId) openCards();
          else openPick();
        } else openCards();
      });
    });

    if (last4Input) {
      last4Input.addEventListener("input", function () {
        last4Input.value = last4Input.value.replace(/\D/g, "").slice(0, 4);
        setFetchEnabled();
      });
    }
    if (mobileInput) {
      mobileInput.addEventListener("input", function () {
        mobileInput.value = mobileInput.value.replace(/\D/g, "").slice(0, 10);
        setFetchEnabled();
      });
    }
    if (consentInput) consentInput.addEventListener("change", setFetchEnabled);

    if (detailsForm) {
      detailsForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (fetchBtn && fetchBtn.disabled) return;

        var meta = findProviderMeta(pendingProvider || "", root);
        var last4 = last4Input ? last4Input.value : "";
        var mobile = mobileInput ? mobileInput.value : "";
        var now = new Date();
        var bill = {
          amount: Math.floor(3500 + Math.random() * 15000),
          generatedAt: now.toISOString(),
          dueAt: addDays(now, 12),
          status: "ready",
        };

        var cards = loadCards();
        var existing = activeCardId
          ? cards.find(function (c) {
              return c.id === activeCardId;
            })
          : null;

        if (existing) {
          existing.last4 = last4;
          existing.mobile = mobile;
          existing.bill = bill;
        } else {
          cards.push({
            id: uid(),
            issuerKey: pendingProvider || meta.name,
            issuerName: meta.name,
            initials: meta.initials,
            color: meta.color,
            last4: last4,
            mobile: mobile,
            bill: bill,
          });
        }
        saveCards(cards);
        if (fetchStatus) fetchStatus.textContent = "Bill fetched successfully.";
        window.setTimeout(openCards, 600);
      });
    }

    if (payConfirmBtn) {
      payConfirmBtn.addEventListener("click", function () {
        var card = ensureCards().find(function (c) {
          return c.id === activeCardId;
        });
        if (!card) return;
        if (!window.VarnarcCheckout) {
          window.alert("Payment module is loading. Please refresh and try again.");
          return;
        }
        payConfirmBtn.disabled = true;
        window.VarnarcCheckout.start({
          amount: card.bill.amount,
          menuItemSlug: "credit-card",
          sectionSlug: "bill-payments",
          orderNote: "Credit card bill — " + card.issuerName,
        })
          .then(function (result) {
            var st = (result.verify && result.verify.status) || "";
            window.alert(
              st === "SUCCESS"
                ? "Payment successful for " + card.issuerName
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

    root.querySelectorAll("[data-credit-card-provider]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var nameEl = btn.querySelector(".electricity-hub-provider-name");
        var key = btn.getAttribute("data-credit-card-provider");
        openDetailsForProvider(key, nameEl ? nameEl.textContent.trim() : "Provider");
      });
    });

    if (isSignedIn()) showStep("cards");
    else showStep("pick");

    renderWallet();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-credit-card-hub]").forEach(initCreditCardWallet);
  });

  document.addEventListener("hub-panel-activated", function (ev) {
    if (ev.detail && ev.detail.panelId !== "credit-card" && ev.detail.panelId !== "credit_card") return;
    document.querySelectorAll("[data-credit-card-hub]").forEach(function (root) {
      root.removeAttribute("data-ccb-wallet-init");
      initCreditCardWallet(root);
    });
  });
})();
