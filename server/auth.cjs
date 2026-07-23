const crypto = require("node:crypto");

const COOKIE_NAME = "gpters23_admin";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function timingSafeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function signature(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function createSessionValue(secret, now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const payload = String(expiresAt);
  return `${payload}.${signature(payload, secret)}`;
}

function verifySessionValue(value, secret, now = Date.now()) {
  if (!value || !secret) return false;
  const [expiresAt, providedSignature] = String(value).split(".");
  if (!expiresAt || !providedSignature || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Math.floor(now / 1000)) return false;
  return timingSafeEqual(providedSignature, signature(expiresAt, secret));
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        if (separator < 0) return [part, ""];
        return [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
      })
  );
}

function isAuthenticated(req, env = process.env) {
  const cookies = parseCookies(req.headers.cookie || "");
  return verifySessionValue(cookies[COOKIE_NAME], env.SESSION_SECRET);
}

function sessionCookie(secret, secure = true) {
  const flags = [
    `${COOKIE_NAME}=${encodeURIComponent(createSessionValue(secret))}`,
    "Path=/",
    `Max-Age=${SESSION_TTL_SECONDS}`,
    "HttpOnly",
    "SameSite=Strict",
  ];
  if (secure) flags.push("Secure");
  return flags.join("; ");
}

function clearSessionCookie(secure = true) {
  const flags = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Strict",
  ];
  if (secure) flags.push("Secure");
  return flags.join("; ");
}

function allowedOrigins(env = process.env) {
  const values = new Set(
    String(env.ALLOWED_ORIGIN || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
  if (env.VERCEL_URL) values.add(`https://${env.VERCEL_URL}`);
  if (env.NODE_ENV !== "production") {
    values.add("http://localhost:3000");
    values.add("http://127.0.0.1:3000");
  }
  return values;
}

function hasAllowedOrigin(req, env = process.env) {
  const origin = req.headers.origin;
  return Boolean(origin && allowedOrigins(env).has(origin));
}

module.exports = {
  COOKIE_NAME,
  SESSION_TTL_SECONDS,
  clearSessionCookie,
  createSessionValue,
  hasAllowedOrigin,
  isAuthenticated,
  sessionCookie,
  timingSafeEqual,
  verifySessionValue,
};
