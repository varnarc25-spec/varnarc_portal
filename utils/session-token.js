const crypto = require("crypto");

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

/** HttpOnly cookie set after Marg validates the Firebase ID token (see routes/auth.js). */
const SESSION_COOKIE_NAME = "varnarc_session";
const DEV_FALLBACK_SECRET = "varnarc-local-dev-session-secret-change-me";
let hasWarnedMissingSecret = false;

function getSessionSecret() {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("APP_SESSION_SECRET is missing in environment variables.");
    }
    if (!hasWarnedMissingSecret) {
      hasWarnedMissingSecret = true;
      // Keep local development usable, but make the risk explicit.
      console.warn(
        "[auth] APP_SESSION_SECRET is missing. Using insecure local fallback secret for non-production."
      );
    }
    return DEV_FALLBACK_SECRET;
  }
  return secret;
}

function sign(text, secret) {
  return crypto.createHmac("sha256", secret).update(text).digest("base64url");
}

function encode(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decode(segment) {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
}

function createSessionToken(data) {
  const now = Date.now();
  const payload = {
    ...data,
    iat: now,
    exp: now + SESSION_TTL_MS,
  };

  const encodedPayload = encode(payload);
  const signature = sign(encodedPayload, getSessionSecret());
  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== "string" || token.indexOf(".") === -1) {
    throw new Error("Invalid session token format.");
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    throw new Error("Invalid session token format.");
  }

  const payloadSegment = parts[0];
  const signature = parts[1];

  const expected = sign(payloadSegment, getSessionSecret());
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Session token signature mismatch.");
  }

  const payload = decode(payloadSegment);
  if (!payload.exp || payload.exp < Date.now()) {
    throw new Error("Session token has expired.");
  }

  return payload;
}

module.exports = {
  createSessionToken,
  verifySessionToken,
  SESSION_TTL_MS,
  SESSION_COOKIE_NAME,
};
