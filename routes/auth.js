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

router.post("/api/auth/firebase/verify-phone", async function (req, res) {
  try {
    const idToken = req.body && req.body.idToken;
    if (!idToken) {
      return res.status(400).json({ ok: false, error: "idToken is required." });
    }

    const response = await postJsonHttps(buildMargApiUrl("/api/user/register"), {
      idToken: idToken,
    });
    const user = response && response.data ? response.data : null;
    if (!user || !user.firebaseUid || !user.phone) {
      return res.status(400).json({ ok: false, error: "Phone auth token required." });
    }

    const sessionToken = createSessionToken({
      uid: user.firebaseUid,
      phoneNumber: user.phone,
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
        phoneNumber: user.phone,
        email: user.email || "",
        name: user.name || user.phone || "User",
      },
    });
  } catch (error) {
    var msg = error && error.message ? String(error.message) : "Unknown error";
    var isUpstream =
      msg.indexOf('Protocol "http:" not supported') !== -1 ||
      msg.indexOf("ECONNREFUSED") !== -1 ||
      msg.indexOf("ENOTFOUND") !== -1;
    if (isUpstream) {
      return res.status(502).json({
        ok: false,
        error: "Cannot reach Marg API. Start marg_api locally (port 3002) or set MARG_API_BASE_URL to the cloud URL, then restart varnarc.",
        details: msg,
        margApiBaseUrl: require("../api/config").MARG_API_BASE_URL,
      });
    }
    return res.status(401).json({
      ok: false,
      error: "Invalid firebase token.",
      details: msg,
    });
  }
});

router.get("/api/auth/session", function (req, res) {
  try {
    const token = req.cookies && req.cookies[SESSION_COOKIE];
    if (!token) {
      return res.status(401).json({ ok: false, error: "No active session." });
    }

    const payload = verifySessionToken(token);
    return res.json({
      ok: true,
      user: {
        uid: payload.uid,
        phoneNumber: payload.phoneNumber,
      },
    });
  } catch (error) {
    return res.status(401).json({ ok: false, error: "Session invalid." });
  }
});

router.post("/api/auth/logout", function (req, res) {
  res.clearCookie(SESSION_COOKIE);
  return res.json({ ok: true });
});

module.exports = router;
