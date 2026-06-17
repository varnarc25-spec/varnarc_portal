/**
 * Insurance hub: calculators, insurer pick, quote (accident, health, term, vehicle).
 */
(function () {
  "use strict";

  var PANEL_IDS = {
    accident: ["insurance-accident", "accident_insurance"],
    health: ["insurance-health", "health_insurance"],
    term: ["insurance-term", "term_life_insurance"],
    vehicle: ["insurance-car", "car_insurance", "insurance-bike", "bike_insurance"],
  };

  var PLANS = {
    accident: {
      essential: { name: "Essential PA", premium: 299, label: "₹5L cover" },
      standard: { name: "Standard Shield", premium: 549, label: "₹10L cover" },
      comprehensive: { name: "Comprehensive Care", premium: 1299, label: "₹25L cover" },
    },
    health: {
      essential: { name: "Individual Care", premium: 4999, label: "₹5L SI" },
      standard: { name: "Family Floater", premium: 8999, label: "₹10L SI" },
      comprehensive: { name: "Platinum Health", premium: 14999, label: "₹25L SI" },
    },
    term: {
      essential: { name: "Smart Term", premium: 5999, label: "₹50L life cover" },
      standard: { name: "Income Shield", premium: 9999, label: "₹1 Cr cover" },
      comprehensive: { name: "Max Protection", premium: 18999, label: "₹2 Cr cover" },
    },
    vehicle: {
      essential: { name: "Third Party", premium: 2148, label: "Legal TP only" },
      standard: { name: "Comprehensive", premium: 8499, label: "Own damage + TP" },
      zerodep: { name: "Zero Dep", premium: 12499, label: "Zero depreciation" },
    },
  };

  var BENEFITS = {
    accident: {
      essential: ["Accidental death benefit", "Permanent total disability", "Ambulance (capped)"],
      standard: ["All Essential benefits", "Partial disability", "Hospital daily cash", "Child education grant"],
      comprehensive: ["All Standard benefits", "TTD weekly benefit", "Fracture & burns rider", "Worldwide cover"],
    },
    health: {
      essential: ["Hospitalization cover", "Pre & post hospitalization", "Day-care procedures"],
      standard: ["All Individual benefits", "Maternity (waiting period)", "No room rent cap", "Restore benefit"],
      comprehensive: ["All Family benefits", "OPD & wellness", "Global emergency", "Annual health check"],
    },
    term: {
      essential: ["Death benefit lump sum", "Terminal illness payout", "Affordable yearly premium"],
      standard: ["All Smart Term benefits", "Critical illness rider", "Premium waiver on disability"],
      comprehensive: ["All Income Shield benefits", "Increasing cover option", "Joint life option"],
    },
    vehicle: {
      essential: ["Third-party liability", "Personal accident owner-driver", "Legal compliance"],
      standard: ["Own damage cover", "Theft & fire", "Cashless garages"],
      zerodep: ["Zero depreciation claims", "Engine protect", "Roadside assistance", "Consumables cover"],
    },
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

  function getProduct(root) {
    return root.getAttribute("data-insurance-product") || "accident";
  }

  function calcPremium(product, root) {
    var age = Number(root.querySelector("[data-ai-calc-prem-age]") && root.querySelector("[data-ai-calc-prem-age]").value) || 30;
    var cover = Number(root.querySelector("[data-ai-calc-prem-cover]") && root.querySelector("[data-ai-calc-prem-cover]").value) || 1000000;
    var members = Number(root.querySelector("[data-ai-calc-members]") && root.querySelector("[data-ai-calc-members]").value) || 1;
    var smoker = root.querySelector("[data-ai-calc-smoker]") && root.querySelector("[data-ai-calc-smoker]").checked;
    var occ = root.querySelector("[data-ai-calc-prem-occ]") && root.querySelector("[data-ai-calc-prem-occ]").value;
    var idv = Number(root.querySelector("[data-ai-calc-idv]") && root.querySelector("[data-ai-calc-idv]").value) || 500000;
    var ncb = Number(root.querySelector("[data-ai-calc-ncb]") && root.querySelector("[data-ai-calc-ncb]").value) || 0;
    var vType = root.getAttribute("data-vehicle-type") || "car";

    if (product === "health") {
      var h = (cover / 100000) * 420 * Math.max(1, members * 0.75);
      if (age > 45) h *= 1 + (age - 45) * 0.04;
      return Math.max(3500, Math.round(h));
    }
    if (product === "term") {
      var t = (cover / 100000) * 55;
      if (age > 35) t *= 1 + (age - 35) * 0.05;
      if (smoker) t *= 1.35;
      return Math.max(2500, Math.round(t));
    }
    if (product === "vehicle") {
      var vBase = vType === "bike" ? idv * 0.025 : idv * 0.035;
      vBase *= 1 - Math.min(ncb, 50) / 100;
      return Math.max(vType === "bike" ? 800 : 1500, Math.round(vBase));
    }
    var risk = OCCUPATION_RISK[occ || "salaried"] || 1;
    var base = (cover / 100000) * 45 * risk;
    if (age > 45) base *= 1 + (age - 45) * 0.03;
    if (age < 25) base *= 0.9;
    return Math.max(199, Math.round(base));
  }

  function calcCoverSuggestion(product, income, root) {
    if (income < 10000) return null;
    var annual = income * 12;
    if (product === "health") {
      return { amount: Math.min(2500000, Math.max(300000, Math.round(annual * 0.5))), label: "health sum insured" };
    }
    if (product === "term") {
      var existing = Number(root.querySelector("[data-ai-calc-existing-cover]") && root.querySelector("[data-ai-calc-existing-cover]").value) || 0;
      var need = Math.max(0, Math.round(annual * 15) - existing);
      return { amount: Math.min(20000000, Math.max(500000, need)), label: "term life cover" };
    }
    if (product === "vehicle") {
      return { amount: Math.round(Number(root.querySelector("[data-ai-calc-ex-showroom]") && root.querySelector("[data-ai-calc-ex-showroom]").value) || 600000), label: "suggested IDV" };
    }
    return { amount: Math.min(5000000, Math.max(500000, Math.round(annual * 2))), label: "accident cover" };
  }

  function initInsuranceHub(root) {
    if (!root || root.getAttribute("data-insurance-hub-init") === "1") return;
    root.setAttribute("data-insurance-hub-init", "1");

    var product = getProduct(root);
    var plans = PLANS[product] || PLANS.accident;
    var defaultPlan = "standard";
    var maxAge = product === "term" ? 65 : 70;
    var minAge = product === "term" ? 18 : 18;

    var pickStep = root.querySelector('[data-insurance-step="pick"]');
    var quoteStep = root.querySelector('[data-insurance-step="quote"]');
    var selectedNameEl = root.querySelector("[data-insurance-selected-insurer]");
    var searchInput = root.querySelector("[data-insurance-insurer-search]");
    var clearBtn = root.querySelector("[data-insurance-search-clear]");
    var lists = root.querySelectorAll("[data-insurance-insurer-list]");
    var planGrid = root.querySelector("[data-ai-plan-grid]");
    var planKeyInput = root.querySelector("[data-ai-plan-key]");
    var quoteForm = root.querySelector("[data-insurance-quote-form]");
    var quoteBtn = root.querySelector("[data-insurance-get-quote]");

    var calcBtns = root.querySelectorAll("[data-ai-calc-tab]");
    var calcPanels = root.querySelectorAll("[data-ai-calc-panel]");
    var premRun = root.querySelector("[data-ai-calc-prem-run]");
    var premOut = root.querySelector("[data-ai-calc-prem-out]");
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
      var nameEl = root.querySelector("[data-insurance-name]");
      if (nameEl) nameEl.focus();
    }

    function openPick() {
      showStep("pick");
    }

    root.querySelectorAll("[data-insurance-back]").forEach(function (btn) {
      btn.addEventListener("click", openPick);
    });

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

    root.querySelectorAll("[data-insurance-insurer]").forEach(function (btn) {
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
        var est = calcPremium(product, root);
        premOut.textContent = "Estimated premium from " + formatInr(est) + " / year";
      });
    }

    if (coverRun && coverOut) {
      coverRun.addEventListener("click", function () {
        if (product === "vehicle") {
          var showroom = Number(root.querySelector("[data-ai-calc-ex-showroom]") && root.querySelector("[data-ai-calc-ex-showroom]").value) || 0;
          if (showroom < 50000) {
            coverOut.textContent = "Enter ex-showroom price for IDV suggestion.";
            return;
          }
          var idv = Math.round(showroom * 0.9);
          coverOut.textContent = "Suggested IDV: " + formatInr(idv) + " (approx. 90% of ex-showroom)";
          return;
        }
        var income = Number(root.querySelector("[data-ai-calc-cover-income]") && root.querySelector("[data-ai-calc-cover-income]").value) || 0;
        var sug = calcCoverSuggestion(product, income, root);
        if (!sug) {
          coverOut.textContent = "Enter a valid monthly income to get a suggestion.";
          return;
        }
        coverOut.textContent = "Suggested " + sug.label + ": " + formatInr(sug.amount);
      });
    }

    function renderBenefits(planKey) {
      if (!benefitOut) return;
      var items = (BENEFITS[product] && BENEFITS[product][planKey]) || BENEFITS.accident.standard;
      benefitOut.innerHTML =
        "<ul class=\"ai-benefit-list mb-0\">" +
        items.map(function (t) {
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
      if (!quoteBtn) return;
      var name = root.querySelector("[data-insurance-name]");
      var age = root.querySelector("[data-insurance-age]");
      var mobile = root.querySelector("[data-insurance-mobile]");
      var reg = root.querySelector("[data-insurance-reg]");
      var plan = planKeyInput ? planKeyInput.value : "";
      var mob = mobile ? String(mobile.value || "").replace(/\D/g, "").slice(-10) : "";
      var ok =
        name &&
        String(name.value || "").trim().length >= 2 &&
        age &&
        Number(age.value) >= minAge &&
        Number(age.value) <= maxAge &&
        /^[6-9]\d{9}$/.test(mob) &&
        plan;
      if (product === "vehicle" && reg) {
        ok = ok && String(reg.value || "").trim().length >= 4;
      }
      quoteBtn.disabled = !ok;
    }

    if (planGrid) {
      planGrid.querySelectorAll("[data-ai-plan-card]").forEach(function (card) {
        card.addEventListener("click", function () {
          selectPlan(card.getAttribute("data-ai-plan-card"));
        });
      });
      selectPlan(defaultPlan);
    }

    root.querySelectorAll("[data-insurance-name], [data-insurance-age], [data-insurance-mobile], [data-insurance-reg]").forEach(function (el) {
      el.addEventListener("input", syncQuoteBtn);
    });

    if (quoteForm) {
      quoteForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (quoteBtn && quoteBtn.disabled) return;
        var plan = plans[planKeyInput ? planKeyInput.value : defaultPlan] || plans[defaultPlan];
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

  function reinitPanel(panelId) {
    if (!panelId) return;
    document.querySelectorAll('[data-hub-panel="' + panelId + '"][data-insurance-hub]').forEach(function (root) {
      root.removeAttribute("data-insurance-hub-init");
      initInsuranceHub(root);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-insurance-hub]").forEach(initInsuranceHub);
    document.querySelectorAll("[data-accident-insurance-hub]").forEach(function (root) {
      root.setAttribute("data-insurance-hub", "");
      root.setAttribute("data-insurance-product", "accident");
      initInsuranceHub(root);
    });
  });

  document.addEventListener("hub-panel-activated", function (ev) {
    var id = ev.detail && ev.detail.panelId;
    if (!id) return;
    reinitPanel(id);
  });
})();
