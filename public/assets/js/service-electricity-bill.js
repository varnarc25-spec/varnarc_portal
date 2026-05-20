(function () {
  "use strict";

  var form = document.getElementById("electricity-bill-form");
  var select = document.getElementById("electricity-board");
  var feedback = document.getElementById("electricity-form-feedback");
  var quickPicks = document.querySelectorAll(".elec-quick-pick[data-board-value]");

  function setFeedback(message, isError) {
    if (!feedback) return;
    feedback.textContent = message || "";
    feedback.classList.toggle("text-danger", !!isError);
    feedback.classList.toggle("text-success", !!message && !isError);
  }

  function syncQuickPickActive() {
    var v = select && select.value;
    quickPicks.forEach(function (btn) {
      var on = btn.getAttribute("data-board-value") === v;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  if (select) {
    select.addEventListener("change", function () {
      setFeedback("");
      syncQuickPickActive();
    });
    syncQuickPickActive();
  }

  quickPicks.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var val = btn.getAttribute("data-board-value");
      if (select && val) {
        select.value = val;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  });

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!select || !select.value) {
        setFeedback("Please select your electricity board to continue.", true);
        select.focus();
        return;
      }
      setFeedback(
        "Thanks — bill fetch and payment will continue in the checkout flow when connected to your account.",
        false
      );
    });
  }
})();
