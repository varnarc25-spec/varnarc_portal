(function () {
  "use strict";

  function initAccountTabs() {
    var tabBtns = document.querySelectorAll("[data-signin-tab]");
    var authPanel = document.getElementById("signin-auth-panel");
    var comingSoon = document.getElementById("signin-coming-soon");
    var authRoot = authPanel && authPanel.querySelector("[data-varn-auth-root]");

    if (!tabBtns.length || !authPanel) {
      return;
    }

    function setTab(tabId) {
      tabBtns.forEach(function (btn) {
        var on = btn.getAttribute("data-signin-tab") === tabId;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
      });

      var isIndividual = tabId === "individual";
      authPanel.classList.toggle("signin-panel--disabled", !isIndividual);
      if (comingSoon) {
        comingSoon.classList.toggle("d-none", isIndividual);
      }
      if (authRoot && typeof authRoot._varnAuthSetDisabled === "function") {
        authRoot._varnAuthSetDisabled(!isIndividual);
      }
      if (!isIndividual && authRoot && typeof authRoot._varnAuthShowAlert === "function") {
        authRoot._varnAuthShowAlert(
          "Corporate, Business, and NRI sign-in will be available soon. Please use Individual for mobile OTP login.",
          "info",
        );
      }
    }

    tabBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setTab(btn.getAttribute("data-signin-tab") || "individual");
      });
    });

    setTab("individual");
  }

  document.addEventListener("DOMContentLoaded", function () {
    initAccountTabs();

    var params = new URLSearchParams(window.location.search);
    var notice = params.get("notice");
    if (notice && window.VARNARC_AUTH_SHOW_NOTICE) {
      window.VARNARC_AUTH_SHOW_NOTICE(decodeURIComponent(notice), "warning");
    }
  });
})();
