const express = require("express");
const { postJsonHttps } = require("../api/http-client");
const { buildMargApiUrl } = require("../api/config");
const {
  createSessionToken,
  verifySessionToken,
  SESSION_TTL_MS,
  SESSION_COOKIE_NAME,
} = require("../utils/session-token");

const router = express.Router();
const SESSION_COOKIE = SESSION_COOKIE_NAME;
const margApiConfig = require("../api/config");

function safeRedirectPath(value, fallback) {
  var path = String(value || "").trim();
  if (!path || path.charAt(0) !== "/" || path.indexOf("//") === 0) {
    return fallback;
  }
  return path;
}

router.get("/login", function (req, res) {
  var q = req.url.indexOf("?") >= 0 ? req.url.slice(req.url.indexOf("?")) : "";
  return res.redirect(302, "/signin" + q);
});

router.get("/signin", function (req, res) {
  var redirectUrl = safeRedirectPath(
    (req.query && (req.query.redirect || req.query.returnUrl)) || "",
    "/dashboardNew",
  );
  var token = req.cookies && req.cookies[SESSION_COOKIE];
  if (token) {
    try {
      verifySessionToken(token);
      return res.redirect(redirectUrl);
    } catch (error) {
      res.clearCookie(SESSION_COOKIE);
    }
  }
  return res.render("signin", {
    layout: false,
    pageTitle: "Sign in",
    redirectUrl: redirectUrl,
  });
});

function errorMessage(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error.message) return String(error.message);
  try {
    return String(error);
  } catch (e) {
    return "Unknown error";
  }
}

function mapVerifyPhoneError(message) {
  var msg = message ? String(message) : "Unknown error";
  if (
    msg.indexOf('Protocol "http:" not supported') !== -1 ||
    msg.indexOf("ECONNREFUSED") !== -1 ||
    msg.indexOf("ENOTFOUND") !== -1 ||
    msg.indexOf("Request timeout") !== -1
  ) {
    return {
      status: 502,
      error:
        "Cannot reach the Marg API. Set MARG_API_BASE_URL in .env to the cloud URL (see .env.example), ensure the API is up, then restart the portal.",
      details: msg,
      margApiBaseUrl: margApiConfig.MARG_API_BASE_URL,
    };
  }
  if (msg.indexOf("Financial setup failed") !== -1 || msg.indexOf("Financial identity") !== -1) {
    return { status: 503, error: msg, details: msg };
  }
  return { status: 401, error: msg, details: msg };
}

router.post("/api/auth/firebase/verify-phone", async function (req, res) {
  try {
    const idToken = req.body && req.body.idToken;
    const clientPhone =
      req.body && req.body.phoneNumber ? String(req.body.phoneNumber).trim() : "";
    if (!idToken) {
      return res.status(400).json({ ok: false, error: "idToken is required." });
    }

    const response = await postJsonHttps(buildMargApiUrl("/api/user/register"), {
      idToken: idToken,
    });
    const user = response && response.data ? response.data : null;
    const phone = (user && user.phone) || clientPhone || "";
    if (!user || !user.firebaseUid) {
      return res.status(400).json({
        ok: false,
        error: "Marg API did not return a user after sign-in.",
      });
    }
    if (!phone) {
      return res.status(400).json({
        ok: false,
        error: "Phone number missing. Sign in with phone OTP (not email only).",
      });
    }

    const sessionToken = createSessionToken({
      uid: user.firebaseUid,
      phoneNumber: phone,
    });

    res.cookie(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_TTL_MS,
    });

    return res.json({
      ok: true,
      user: {
        uid: user.firebaseUid,
        phoneNumber: phone,
        email: user.email || "",
        name: user.name || phone || "User",
      },
    });
  } catch (error) {
    var mapped = mapVerifyPhoneError(errorMessage(error));
    return res.status(mapped.status).json({
      ok: false,
      error: mapped.error,
      details: mapped.details,
      margApiBaseUrl: mapped.margApiBaseUrl,
    });
  }
});

router.get("/api/auth/session", function (req, res) {
  const token = req.cookies && req.cookies[SESSION_COOKIE];
  if (!token) {
    return res.json({ ok: false, authenticated: false });
  }

  try {
    const payload = verifySessionToken(token);
    return res.json({
      ok: true,
      authenticated: true,
      user: {
        uid: payload.uid,
        phoneNumber: payload.phoneNumber,
      },
    });
  } catch (error) {
    res.clearCookie(SESSION_COOKIE);
    return res.status(401).json({
      ok: false,
      authenticated: false,
      error: "Session invalid.",
    });
  }
});

router.post("/api/auth/logout", function (req, res) {
  res.clearCookie(SESSION_COOKIE);
  return res.json({ ok: true });
});

module.exports = router;
