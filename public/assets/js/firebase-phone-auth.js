(function () {
  var authConfig = window.VARNARC_AUTH_CONFIG || {};
  var firebaseConfig = {
    apiKey: authConfig.firebaseApiKey,
    authDomain: authConfig.firebaseAuthDomain,
    projectId: authConfig.firebaseProjectId,
    storageBucket: authConfig.firebaseStorageBucket,
    appId: authConfig.firebaseAppId,
    messagingSenderId: authConfig.firebaseMessagingSenderId,
    measurementId: authConfig.firebaseMeasurementId,
  };

  var requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
  var hasFirebaseConfig = requiredKeys.every(function (key) {
    return Boolean(firebaseConfig[key]);
  });

  var AUTH_USER_STORAGE_KEY = "varnarc_auth_user";
  var AUTH_TOKEN_STORAGE_KEY = "varnarc_auth_token";
  var OTP_VALIDITY_MS = 10 * 60 * 1000;
  var RESEND_COOLDOWN_MS = 15 * 1000;

  var sharedAuth = null;

  function formatMmSs(ms) {
    var totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  }

  function initFirebase() {
    if (!hasFirebaseConfig) {
      return { error: "Firebase web config missing. Please set env values in backend." };
    }
    if (!window.firebase || !window.firebase.initializeApp) {
      return { error: "Firebase SDK not loaded." };
    }
    if (!window.firebase.apps || !window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }
    if (firebaseConfig.measurementId && window.firebase.analytics) {
      try {
        window.firebase.analytics();
      } catch (error) {}
    }
    return { auth: window.firebase.auth() };
  }

  function initAuthRoot(root) {
    if (!root || root.getAttribute("data-varn-auth-init") === "1") {
      return;
    }
    root.setAttribute("data-varn-auth-init", "1");

    var state = {
      confirmationResult: null,
      recaptchaVerifier: null,
      otpSentAt: 0,
      resendAvailableAt: 0,
      timerInterval: null,
      alertTimeout: null,
      disabled: false,
    };

    var redirectUrl = root.getAttribute("data-auth-redirect") || "/dashboardNew";

    function q(sel) {
      return root.querySelector(sel);
    }

    function showAlert(message, type) {
      var alertEl = q("[data-auth-alert]");
      if (!alertEl) {
        return;
      }
      if (state.alertTimeout) {
        window.clearTimeout(state.alertTimeout);
        state.alertTimeout = null;
      }
      alertEl.className = "alert alert-" + type;
      alertEl.textContent = message;
      alertEl.classList.remove("d-none");
      if (type === "success") {
        state.alertTimeout = window.setTimeout(function () {
          alertEl.className = "alert d-none";
          alertEl.textContent = "";
          state.alertTimeout = null;
        }, 10000);
      }
    }

    function setDisabled(disabled) {
      state.disabled = disabled;
      var sendBtn = q("[data-auth-send]");
      var verifyBtn = q("[data-auth-verify]");
      var phone = q("[data-auth-phone]");
      var country = q("[data-auth-country-code]");
      if (sendBtn) sendBtn.disabled = disabled;
      if (verifyBtn) verifyBtn.disabled = disabled;
      if (phone) phone.disabled = disabled;
      if (country) country.disabled = disabled;
      var recaptchaWrap = q("[data-auth-recaptcha-wrap]");
      if (recaptchaWrap) recaptchaWrap.classList.toggle("d-none", disabled);
    }

    function buildE164PhoneNumber() {
      var countryCodeInput = q("[data-auth-country-code]");
      var phoneInput = q("[data-auth-phone]");
      var countryCode =
        countryCodeInput && countryCodeInput.value ? countryCodeInput.value.trim() : "+91";
      var rawPhone = phoneInput && phoneInput.value ? phoneInput.value.trim() : "";

      if (!countryCode) {
        return { error: "Country code is required." };
      }
      if (countryCode.charAt(0) !== "+") {
        countryCode = "+" + countryCode;
      }
      if (!/^\+[1-9]\d{0,3}$/.test(countryCode)) {
        return { error: "Enter a valid country code (example: +91)." };
      }

      var phoneDigits = rawPhone.replace(/\D/g, "");
      if (!phoneDigits) {
        return { error: "Phone number is required." };
      }
      if (countryCode === "+91" && !/^\d{10}$/.test(phoneDigits)) {
        return { error: "Enter a valid 10-digit phone number." };
      }
      if (!/^\d{6,12}$/.test(phoneDigits)) {
        return { error: "Enter a valid phone number." };
      }
      return { phoneNumber: countryCode + phoneDigits };
    }

    function toggleOtp(show) {
      var otpWrap = q("[data-auth-otp-wrap]");
      var verifyBtn = q("[data-auth-verify]");
      if (otpWrap) otpWrap.classList.toggle("d-none", !show);
      if (verifyBtn) verifyBtn.classList.toggle("d-none", !show);
    }

    function setSendButtonState() {
      var sendBtn = q("[data-auth-send]");
      if (!sendBtn || state.disabled) {
        return;
      }
      var hasSentOtp = Boolean(state.otpSentAt);
      sendBtn.textContent = hasSentOtp ? "Resend OTP" : "GET OTP";
      sendBtn.disabled = hasSentOtp && Date.now() < state.resendAvailableAt;
    }

    function updateTimerText() {
      var timerEl = q("[data-auth-timer]");
      if (!timerEl) {
        return;
      }
      if (!state.otpSentAt) {
        timerEl.textContent = "";
        return;
      }
      var now = Date.now();
      var expiresIn = Math.max(0, state.otpSentAt + OTP_VALIDITY_MS - now);
      var resendIn = Math.max(0, state.resendAvailableAt - now);
      if (expiresIn <= 0) {
        timerEl.textContent = "OTP expired. Please resend OTP.";
        return;
      }
      if (resendIn > 0) {
        timerEl.textContent =
          "OTP expires in " + formatMmSs(expiresIn) + " | Resend in " + formatMmSs(resendIn);
        return;
      }
      timerEl.textContent = "OTP expires in " + formatMmSs(expiresIn);
    }

    function stopTimer() {
      if (state.timerInterval) {
        window.clearInterval(state.timerInterval);
        state.timerInterval = null;
      }
    }

    function startTimer() {
      stopTimer();
      updateTimerText();
      setSendButtonState();
      state.timerInterval = window.setInterval(function () {
        updateTimerText();
        setSendButtonState();
        if (state.otpSentAt && Date.now() >= state.otpSentAt + OTP_VALIDITY_MS) {
          stopTimer();
        }
      }, 1000);
    }

    function resetOtpFlow() {
      stopTimer();
      state.otpSentAt = 0;
      state.resendAvailableAt = 0;
      state.confirmationResult = null;
      toggleOtp(false);
      setSendButtonState();
      updateTimerText();
      var otpInput = q("[data-auth-otp]");
      if (otpInput) otpInput.value = "";
    }

    async function sendOtp() {
      if (state.disabled) {
        return;
      }
      try {
        if (state.otpSentAt && Date.now() < state.resendAvailableAt) {
          showAlert("Please wait before resending OTP.", "warning");
          return;
        }

        var firebaseInit = initFirebase();
        if (firebaseInit.error) {
          showAlert(firebaseInit.error, "warning");
          return;
        }
        var auth = firebaseInit.auth;
        sharedAuth = auth;

        var recaptchaEl = q("[data-auth-recaptcha]");
        if (!recaptchaEl) {
          showAlert("reCAPTCHA container missing.", "danger");
          return;
        }

        if (!state.recaptchaVerifier) {
          state.recaptchaVerifier = new window.firebase.auth.RecaptchaVerifier(recaptchaEl, {
            size: "normal",
          });
        }

        var parsedPhone = buildE164PhoneNumber();
        if (parsedPhone.error) {
          showAlert(parsedPhone.error, "warning");
          return;
        }

        state.confirmationResult = await auth.signInWithPhoneNumber(
          parsedPhone.phoneNumber,
          state.recaptchaVerifier,
        );
        toggleOtp(true);
        state.otpSentAt = Date.now();
        state.resendAvailableAt = state.otpSentAt + RESEND_COOLDOWN_MS;
        startTimer();
        showAlert("OTP sent successfully.", "success");
      } catch (error) {
        showAlert(error.message || "Failed to send OTP.", "danger");
      }
    }

    async function verifyOtp() {
      if (state.disabled) {
        return;
      }
      try {
        if (!state.confirmationResult) {
          showAlert("Please request OTP first.", "warning");
          return;
        }
        if (state.otpSentAt && Date.now() > state.otpSentAt + OTP_VALIDITY_MS) {
          showAlert("OTP expired. Please resend OTP.", "warning");
          return;
        }

        var otpInput = q("[data-auth-otp]");
        var otp = otpInput && otpInput.value ? otpInput.value.trim() : "";
        if (!otp) {
          showAlert("Enter OTP to continue.", "warning");
          return;
        }

        var firebaseResult = await state.confirmationResult.confirm(otp);
        var firebaseUser = firebaseResult.user;
        var idToken = await firebaseUser.getIdToken(true);
        var phoneNumber = firebaseUser.phoneNumber || "";

        var verifyResponse = await fetch("/api/auth/firebase/verify-phone", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: idToken, phoneNumber: phoneNumber }),
        });

        var payload = await verifyResponse.json();
        if (!verifyResponse.ok || !payload.ok) {
          var errorMessage =
            payload.details ||
            payload.error ||
            (payload.message && String(payload.message)) ||
            "Server verification failed.";
          throw new Error(errorMessage);
        }

        var u = (payload && payload.user) || {};
        var userProfile = {
          uid: u.uid || "",
          phoneNumber: u.phoneNumber || "",
          email: u.email || "",
          name: u.name || u.phoneNumber || "User",
        };
        window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(userProfile));
        window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, idToken);

        showAlert("Login successful. Redirecting…", "success");
        window.setTimeout(function () {
          window.location.href = redirectUrl;
        }, 600);
      } catch (error) {
        showAlert(error.message || "OTP verification failed.", "danger");
      }
    }

    var sendBtn = q("[data-auth-send]");
    var verifyBtn = q("[data-auth-verify]");
    if (sendBtn) sendBtn.addEventListener("click", sendOtp);
    if (verifyBtn) verifyBtn.addEventListener("click", verifyOtp);

    var phoneInput = q("[data-auth-phone]");
    if (phoneInput) {
      phoneInput.addEventListener("input", function () {
        phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
      });
    }

    root._varnAuthSetDisabled = setDisabled;
    root._varnAuthReset = resetOtpFlow;
    root._varnAuthShowAlert = showAlert;

    setSendButtonState();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-varn-auth-root]").forEach(initAuthRoot);

    var loginModal = document.getElementById("login-modal");
    if (loginModal) {
      loginModal.addEventListener("hidden.bs.modal", function () {
        var root = loginModal.querySelector("[data-varn-auth-root]");
        if (root && typeof root._varnAuthReset === "function") {
          root._varnAuthReset();
        }
      });
    }
  });

  window.VARNARC_AUTH_SHOW_NOTICE = function (message, type) {
    var roots = document.querySelectorAll("[data-varn-auth-root]");
    if (!roots.length) {
      return;
    }
    var root = roots[0];
    if (typeof root._varnAuthShowAlert === "function") {
      root._varnAuthShowAlert(message, type || "warning");
    }
  };
})();
