const {
  clearSessionCookie,
  hasAllowedOrigin,
  isAuthenticated,
  sessionCookie,
  timingSafeEqual,
} = require("../server/auth.cjs");
const { errorResponse, json, readBody } = require("../server/http.cjs");

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    return json(res, 200, { ok: true, authenticated: isAuthenticated(req) });
  }

  if (req.method === "POST") {
    try {
      if (!hasAllowedOrigin(req)) {
        const error = new Error("Request origin is not allowed");
        error.code = "forbidden_origin";
        throw error;
      }
      if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
        const error = new Error("Administrator login is not configured");
        error.code = "not_configured";
        throw error;
      }
      const password = String(readBody(req).password || "");
      if (!password || !timingSafeEqual(password, process.env.ADMIN_PASSWORD)) {
        const error = new Error("관리자 비밀번호가 올바르지 않습니다");
        error.code = "invalid_credentials";
        throw error;
      }
      const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
      res.setHeader("Set-Cookie", sessionCookie(process.env.SESSION_SECRET, secure));
      return json(res, 200, { ok: true, authenticated: true });
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  if (req.method === "DELETE") {
    try {
      if (!hasAllowedOrigin(req)) {
        const error = new Error("Request origin is not allowed");
        error.code = "forbidden_origin";
        throw error;
      }
      const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
      res.setHeader("Set-Cookie", clearSessionCookie(secure));
      return json(res, 200, { ok: true, authenticated: false });
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  return json(res, 405, { ok: false, code: "method_not_allowed" });
};
