(function () {
  var AUTH_USER_STORAGE_KEY = "varnarc_auth_user";
  var AUTH_TOKEN_STORAGE_KEY = "varnarc_auth_token";

  function readUser() {
    try {
      var raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function clearStoredAuth() {
    try {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    } catch (error) {}
  }

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) {
      node.textContent = value || "";
    }
  }

  function setAllText(selector, value) {
    var text = value || "";
    document.querySelectorAll(selector).forEach(function (node) {
      node.textContent = text;
    });
  }

  function hydrateHeaderUser() {
    var user = readUser();
    document.querySelectorAll(".landing-nav-visitor-only").forEach(function (el) {
      el.classList.toggle("d-none", !!user);
    });
    document.querySelectorAll(".landing-nav-signed-in-services").forEach(function (el) {
      el.classList.toggle("d-none", !user);
    });
    var guestNav = document.getElementById("landing-auth-guest-nav");
    var profileNav = document.getElementById("landing-auth-profile-nav");

    function toggleLandingAuth(showUser) {
      if (guestNav) {
        guestNav.classList.toggle("d-none", showUser);
      }
      if (profileNav) {
        profileNav.classList.toggle("d-none", !showUser);
      }
    }

    if (!user) {
      toggleLandingAuth(false);
      setText("landing-user-meta", "Not logged in");
      setAllText("[data-varn-auth-meta]", "Not logged in");
      return;
    }

    var displayName = user.name || user.phoneNumber || "User";
    var subtitle = user.phoneNumber || user.email || "Authenticated";
    if (subtitle === displayName) {
      subtitle =
        user.email && user.email !== displayName
          ? user.email
          : user.name && user.name !== displayName
            ? user.name
            : "Signed in";
    }

    setText("dashboard-user-name", displayName);
    setText("dashboard-user-meta", subtitle);
    setText("landing-user-name", displayName);
    setText("landing-user-meta", subtitle);
    setAllText("[data-varn-auth-name]", displayName);
    setAllText("[data-varn-auth-meta]", subtitle);
    toggleLandingAuth(true);
  }

  var SESSION_NOTICE_KEY = "varnarc_relogin_notice";

  /**
   * Clear stored auth (localStorage + Firebase), then redirect home. After load, OTP modal opens with notice.
   * Called when Marg/Varnarc APIs report an expired or invalid Firebase ID token.
   * @param {string} [reason] Short message shown in the login modal alert on the home page
   */
  function sessionExpiredPromptRelogin(reason) {
    clearStoredAuth();

    try {
      fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }).catch(function () {});
    } catch (e) {}

    try {
      if (typeof firebase !== "undefined" && firebase.auth) {
        firebase.auth().signOut().catch(function () {});
      }
    } catch (e2) {}

    var text =
      reason && String(reason).trim()
        ? String(reason).trim()
        : "Your session expired. Please sign in again.";

    try {
      window.sessionStorage.setItem(SESSION_NOTICE_KEY, text);
    } catch (e3) {}

    // Defer navigation so callers can finish the current stack (e.g. postRechargeApi may throw
    // right after this); an immediate assign can be skipped in some browsers when a throw follows.
    setTimeout(function () {
      window.location.replace("/");
    }, 0);
  }

  window.VARNARC_SESSION_EXPIRED = sessionExpiredPromptRelogin;

  function syncUiAuthWithServerSession() {
    return fetch("/api/auth/session", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    })
      .then(function (res) {
        if (!res.ok) {
          clearStoredAuth();
          hydrateHeaderUser();
          return null;
        }
        return res
          .json()
          .then(function (payload) {
            if (!payload || !payload.ok || !payload.user) {
              clearStoredAuth();
              hydrateHeaderUser();
              return null;
            }
            var existing = readUser() || {};
            var serverUser = payload.user || {};
            var merged = {
              uid: serverUser.uid || existing.uid || "",
              phoneNumber: serverUser.phoneNumber || existing.phoneNumber || "",
              email: existing.email || "",
              name: existing.name || serverUser.phoneNumber || "User",
            };
            try {
              window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(merged));
            } catch (e) {}
            hydrateHeaderUser();
            return merged;
          })
          .catch(function () {
            clearStoredAuth();
            hydrateHeaderUser();
            return null;
          });
      })
      .catch(function () {
        // Network failure: keep current local view to avoid forcing logout offline.
        hydrateHeaderUser();
        return null;
      });
  }

  function attachLogout() {
    function bindLogout(id) {
      var btn = document.getElementById(id);
      if (!btn) {
        return;
      }
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        try {
          fetch("/api/auth/logout", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          })
            .catch(function () {})
            .finally(function () {
              window.location.href = "/";
            });
        } catch (e) {
          window.location.href = "/";
        }
        return;
      });
    }

    bindLogout("dashboard-logout-btn");
    bindLogout("landing-logout-btn");
  }

  document.addEventListener("DOMContentLoaded", function () {
    syncUiAuthWithServerSession();
    attachLogout();

    var notice = "";
    try {
      notice = window.sessionStorage.getItem(SESSION_NOTICE_KEY) || "";
      if (notice) window.sessionStorage.removeItem(SESSION_NOTICE_KEY);
    } catch (e) {}

    if (notice && document.getElementById("login-modal")) {
      var alertEl = document.getElementById("auth-alert");
      if (alertEl) {
        alertEl.className = "alert alert-warning mb-3";
        alertEl.textContent = notice;
        alertEl.classList.remove("d-none");
      }
      var modalEl = document.getElementById("login-modal");
      if (modalEl && window.bootstrap && window.bootstrap.Modal) {
        try {
          window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
        } catch (e2) {}
      }
    }
  });
})();
