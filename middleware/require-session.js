const { verifySessionToken, SESSION_COOKIE_NAME } = require("../utils/session-token");

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
}

/**
 * Require a valid Varnarc session cookie (minted after Marg verified the Firebase ID token).
 * Use on HTML routes that must not render for anonymous users.
 */
function requireVarnarcSession(req, res, next) {
  try {
    const token = req.cookies && req.cookies[SESSION_COOKIE_NAME];
    if (!token) {
      return res.redirect(302, "/");
    }
    const payload = verifySessionToken(token);
    req.varnarcUser = {
      uid: payload.uid,
      phoneNumber: payload.phoneNumber,
    };
    return next();
  } catch (_err) {
    res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
    return res.redirect(302, "/");
  }
}

/**
 * If a valid session cookie exists, attach req.varnarcUser; otherwise continue.
 * Use for HTML pages that should render for anonymous users (e.g. marketing dashboard).
 */
function optionalVarnarcSession(req, res, next) {
  try {
    const token = req.cookies && req.cookies[SESSION_COOKIE_NAME];
    if (!token) {
      return next();
    }
    const payload = verifySessionToken(token);
    req.varnarcUser = {
      uid: payload.uid,
      phoneNumber: payload.phoneNumber,
    };
    return next();
  } catch (_err) {
    res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
    return next();
  }
}

module.exports = {
  requireVarnarcSession,
  optionalVarnarcSession,
  SESSION_COOKIE_NAME,
};
