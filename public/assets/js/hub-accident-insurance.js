/**
 * Accident insurance hub: insurer pick, calculators, quote step.
 */
(function () {
  "use strict";

  var PLANS = {
    essential: { name: "Essential PA", cover: 500000, premium: 299, label: "₹5L cover" },
    standard: { name: "Standard Shield", cover: 1000000, premium: 549, label: "₹10L cover" },
    comprehensive: { name: "Comprehensive Care", cover: 2500000, premium: 1299, label: "₹25L cover" },
  };

  var OCCUPATION_RISK = {
    salaried: 1,
    professional: 1.1,
    self: 1.25,
    student: 0.85,
    homemaker: 0.9,
  };

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

  function initAccidentInsuranceHub(root) {
    if (!root || root.getAttribute("data-ai-hub-init") === "1") return;
    root.setAttribute("data-ai-hub-init", "1");

    var pickStep = root.querySelector('[data-accident-step="pick"]');
    var quoteStep = root.querySelector('[data-accident-step="quote"]');
    var backBtn = root.querySelector("[data-accident-back]");
    var selectedNameEl = root.querySelector("[data-accident-selected-insurer]");
    var searchInput = root.querySelector("[data-accident-insurer-search]");
    var clearBtn = root.querySelector("[data-accident-search-clear]");
    var lists = root.querySelectorAll("[data-accident-insurer-list]");
    var planGrid = root.querySelector("[data-ai-plan-grid]");
    var planKeyInput = root.querySelector("[data-ai-plan-key]");
    var quoteForm = root.querySelector("[data-accident-quote-form]");
    var quoteBtn = root.querySelector("[data-accident-get-quote]");

    var calcBtns = root.querySelectorAll("[data-ai-calc-tab]");
    var calcPanels = root.querySelectorAll("[data-ai-calc-panel]");

    var premAge = root.querySelector("[data-ai-calc-prem-age]");
    var premOcc = root.querySelector("[data-ai-calc-prem-occ]");
    var premCover = root.querySelector("[data-ai-calc-prem-cover]");
    var premRun = root.querySelector("[data-ai-calc-prem-run]");
    var premOut = root.querySelector("[data-ai-calc-prem-out]");

    var coverIncome = root.querySelector("[data-ai-calc-cover-income]");
    var coverRun = root.querySelector("[data-ai-calc-cover-run]");
    var coverOut = root.querySelector("[data-ai-calc-cover-out]");

    var benefitPlan = root.querySelector("[data-ai-calc-benefit-plan]");
    var benefitOut = root.querySelector("[data-ai-calc-benefit-out]");

    function showStep(step) {
      if (pickStep) pickStep.hidden = step !== "pick";
      if (quoteStep) quoteStep.hidden = step !== "quote";
    }

    function selectInsurer(displayName) {
      if (selectedNameEl) selectedNameEl.textContent = displayName || "—";
      showStep("quote");
      var nameEl = root.querySelector("[data-accident-name]");
      if (nameEl) nameEl.focus();
    }

    function openPick() {
      showStep("pick");
    }

    if (backBtn) backBtn.addEventListener("click", openPick);

    function filterInsurers() {
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
      searchInput.addEventListener("input", filterInsurers);
      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          searchInput.value = "";
          filterInsurers();
          searchInput.focus();
        });
      }
    }

    root.querySelectorAll("[data-accident-insurer]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var nameEl = btn.querySelector(".electricity-hub-provider-name");
        selectInsurer(nameEl ? nameEl.textContent.trim() : "Insurer");
      });
    });

    calcBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tab = btn.getAttribute("data-ai-calc-tab");
        calcBtns.forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        calcPanels.forEach(function (panel) {
          panel.hidden = panel.getAttribute("data-ai-calc-panel") !== tab;
        });
      });
    });

    if (calcBtns.length) {
      calcBtns[0].classList.add("is-active");
      calcPanels.forEach(function (panel, i) {
        panel.hidden = i !== 0;
      });
    }

    if (premRun && premOut) {
      premRun.addEventListener("click", function () {
        var age = Number(premAge && premAge.value) || 30;
        var occ = premOcc && premOcc.value ? premOcc.value : "salaried";
        var cover = Number(premCover && premCover.value) || 1000000;
        var risk = OCCUPATION_RISK[occ] || 1;
        var base = (cover / 100000) * 45 * risk;
        if (age > 45) base *= 1 + (age - 45) * 0.03;
        if (age < 25) base *= 0.9;
        premOut.textContent = "Estimated premium from " + formatInr(Math.max(199, Math.round(base))) + " / year";
      });
    }

    if (coverRun && coverOut) {
      coverRun.addEventListener("click", function () {
        var income = Number(coverIncome && coverIncome.value) || 0;
        if (income < 10000) {
          coverOut.textContent = "Enter a valid monthly income to get a suggestion.";
          return;
        }
        var annual = income * 12;
        var suggested = Math.min(5000000, Math.max(500000, Math.round(annual * 2)));
        coverOut.textContent =
          "Suggested accident cover: " + formatInr(suggested) + " (about 2× annual income)";
      });
    }

    function renderBenefits(planKey) {
      if (!benefitOut) return;
      var items = {
        essential: [
          "Accidental death benefit",
          "Permanent total disability",
          "Ambulance charges (capped)",
        ],
        standard: [
          "All Essential benefits",
          "Partial disability cover",
          "Hospital daily cash (30 days)",
          "Education grant for children",
        ],
        comprehensive: [
          "All Standard benefits",
          "Temporary total disability weekly benefit",
          "Fracture & burns rider",
          "Worldwide accident cover",
        ],
      };
      var list = items[planKey] || items.standard;
      benefitOut.innerHTML =
        "<ul class=\"ai-benefit-list mb-0\">" +
        list.map(function (t) {
          return "<li>" + t + "</li>";
        }).join("") +
        "</ul>";
    }

    if (benefitPlan) {
      benefitPlan.addEventListener("change", function () {
        renderBenefits(benefitPlan.value);
      });
      renderBenefits(benefitPlan.value);
    }

    function selectPlan(key) {
      if (planKeyInput) planKeyInput.value = key;
      if (planGrid) {
        planGrid.querySelectorAll("[data-ai-plan-card]").forEach(function (card) {
          card.classList.toggle("is-selected", card.getAttribute("data-ai-plan-card") === key);
        });
      }
      syncQuoteBtn();
    }

    function syncQuoteBtn() {
      if (!quoteBtn || !quoteForm) return;
      var name = root.querySelector("[data-accident-name]");
      var age = root.querySelector("[data-accident-age]");
      var mobile = root.querySelector("[data-accident-mobile]");
      var plan = planKeyInput ? planKeyInput.value : "";
      var mob = mobile ? String(mobile.value || "").replace(/\D/g, "").slice(-10) : "";
      var ok =
        name &&
        String(name.value || "").trim().length >= 2 &&
        age &&
        Number(age.value) >= 18 &&
        Number(age.value) <= 70 &&
        /^[6-9]\d{9}$/.test(mob) &&
        plan;
      quoteBtn.disabled = !ok;
    }

    if (planGrid) {
      planGrid.querySelectorAll("[data-ai-plan-card]").forEach(function (card) {
        card.addEventListener("click", function () {
          selectPlan(card.getAttribute("data-ai-plan-card"));
        });
      });
      selectPlan("standard");
    }

    ["data-accident-name", "data-accident-age", "data-accident-mobile"].forEach(function (sel) {
      var el = root.querySelector("[" + sel + "]");
      if (el) el.addEventListener("input", syncQuoteBtn);
    });

    if (quoteForm) {
      quoteForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (quoteBtn && quoteBtn.disabled) return;
        var plan = PLANS[planKeyInput ? planKeyInput.value : "standard"] || PLANS.standard;
        var insurer = selectedNameEl ? selectedNameEl.textContent : "Insurer";
        window.alert(
          "Your " +
            plan.name +
            " quote (" +
            plan.label +
            ", " +
            formatInr(plan.premium) +
            "/yr) with " +
            insurer +
            " will open at checkout when integrated."
        );
      });
    }

    showStep("pick");
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-accident-insurance-hub]").forEach(initAccidentInsuranceHub);
  });

  document.addEventListener("hub-panel-activated", function (ev) {
    var id = ev.detail && ev.detail.panelId;
    if (id !== "insurance-accident" && id !== "accident_insurance") return;
    document.querySelectorAll("[data-accident-insurance-hub]").forEach(function (root) {
      root.removeAttribute("data-ai-hub-init");
      initAccidentInsuranceHub(root);
    });
  });
})();
