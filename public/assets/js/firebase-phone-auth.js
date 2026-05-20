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

  var confirmationResult = null;
  var recaptchaVerifier = null;
  var AUTH_USER_STORAGE_KEY = "varnarc_auth_user";
  var AUTH_TOKEN_STORAGE_KEY = "varnarc_auth_token";
  var OTP_VALIDITY_MS = 10 * 60 * 1000;
  var RESEND_COOLDOWN_MS = 15 * 1000;
  var otpSentAt = 0;
  var resendAvailableAt = 0;
  var timerInterval = null;
  var alertTimeout = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function formatMmSs(ms) {
    var totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  }

  function setSendButtonState() {
    var sendBtn = byId("send-otp-btn");
    if (!sendBtn) {
      return;
    }
    var hasSentOtp = Boolean(otpSentAt);
    sendBtn.textContent = hasSentOtp ? "Resend OTP" : "Send OTP";
    sendBtn.disabled = hasSentOtp && Date.now() < resendAvailableAt;
  }

  function updateTimerText() {
    var timerEl = byId("otp-timer-text");
    if (!timerEl) {
      return;
    }
    if (!otpSentAt) {
      timerEl.textContent = "";
      return;
    }

    var now = Date.now();
    var expiresIn = Math.max(0, otpSentAt + OTP_VALIDITY_MS - now);
    var resendIn = Math.max(0, resendAvailableAt - now);

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
    if (timerInterval) {
      window.clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function startTimer() {
    stopTimer();
    updateTimerText();
    setSendButtonState();
    timerInterval = window.setInterval(function () {
      updateTimerText();
      setSendButtonState();
      if (otpSentAt && Date.now() >= otpSentAt + OTP_VALIDITY_MS) {
        stopTimer();
      }
    }, 1000);
  }

  function buildE164PhoneNumber() {
    var countryCodeInput = byId("country-code-input");
    var phoneInput = byId("phone-number-input");

    var countryCode = countryCodeInput && countryCodeInput.value ? countryCodeInput.value.trim() : "+91";
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

  function showAlert(message, type) {
    var alertEl = byId("auth-alert");
    if (!alertEl) {
      return;
    }
    if (alertTimeout) {
      window.clearTimeout(alertTimeout);
      alertTimeout = null;
    }
    alertEl.className = "alert alert-" + type;
    alertEl.textContent = message;
    if (type === "success") {
      alertTimeout = window.setTimeout(function () {
        alertEl.className = "alert d-none";
        alertEl.textContent = "";
        alertTimeout = null;
      }, 10000);
    }
  }

  function toggleOtp(show) {
    var otpWrap = byId("otp-container");
    var verifyBtn = byId("verify-otp-btn");
    if (!otpWrap || !verifyBtn) {
      return;
    }
    otpWrap.classList.toggle("d-none", !show);
    verifyBtn.classList.toggle("d-none", !show);
  }

  function initFirebase() {
    if (!hasFirebaseConfig) {
      showAlert("Firebase web config missing. Please set env values in backend.", "warning");
      return null;
    }

    if (!window.firebase || !window.firebase.initializeApp) {
      showAlert("Firebase SDK not loaded.", "danger");
      return null;
    }

    if (!window.firebase.apps || !window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }

    if (firebaseConfig.measurementId && window.firebase.analytics) {
      try {
        window.firebase.analytics();
      } catch (error) {
        // Keep auth flow working even if analytics fails.
      }
    }

    return window.firebase.auth();
  }

  async function sendOtp() {
    try {
      if (otpSentAt && Date.now() < resendAvailableAt) {
        showAlert("Please wait before resending OTP.", "warning");
        return;
      }

      var auth = initFirebase();
      if (!auth) {
        return;
      }

      if (!recaptchaVerifier) {
        recaptchaVerifier = new window.firebase.auth.RecaptchaVerifier("recaptcha-container", {
          size: "normal",
        });
      }

      var parsedPhone = buildE164PhoneNumber();
      if (parsedPhone.error) {
        showAlert(parsedPhone.error, "warning");
        return;
      }

      confirmationResult = await auth.signInWithPhoneNumber(parsedPhone.phoneNumber, recaptchaVerifier);
      toggleOtp(true);
      otpSentAt = Date.now();
      resendAvailableAt = otpSentAt + RESEND_COOLDOWN_MS;
      startTimer();
      showAlert("OTP sent successfully.", "success");
    } catch (error) {
      showAlert(error.message || "Failed to send OTP.", "danger");
    }
  }

  async function verifyOtp() {
    try {
      if (!confirmationResult) {
        showAlert("Please request OTP first.", "warning");
        return;
      }
      if (otpSentAt && Date.now() > otpSentAt + OTP_VALIDITY_MS) {
        showAlert("OTP expired. Please resend OTP.", "warning");
        return;
      }

      var otpInput = byId("otp-input");
      var otp = otpInput && otpInput.value ? otpInput.value.trim() : "";
      if (!otp) {
        showAlert("Enter OTP to continue.", "warning");
        return;
      }

      var firebaseResult = await confirmationResult.confirm(otp);
      var idToken = await firebaseResult.user.getIdToken();

      var verifyResponse = await fetch("/api/auth/firebase/verify-phone", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken: idToken }),
      });

      var payload = await verifyResponse.json();
      if (!verifyResponse.ok || !payload.ok) {
        var errorMessage =
          payload.error ||
          payload.details ||
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

      showAlert("Login successful.", "success");
      setTimeout(function () {
        window.location.href = "/dashboardNew";
      }, 800);
    } catch (error) {
      showAlert(error.message || "OTP verification failed.", "danger");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var sendBtn = byId("send-otp-btn");
    var verifyBtn = byId("verify-otp-btn");
    var loginModal = byId("login-modal");

    if (sendBtn) {
      sendBtn.addEventListener("click", sendOtp);
    }
    if (verifyBtn) {
      verifyBtn.addEventListener("click", verifyOtp);
    }
    if (loginModal) {
      loginModal.addEventListener("hidden.bs.modal", function () {
        stopTimer();
        otpSentAt = 0;
        resendAvailableAt = 0;
        setSendButtonState();
        updateTimerText();
      });
    }
    setSendButtonState();
  });
})();
