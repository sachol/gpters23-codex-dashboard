const { hasAllowedOrigin, isAuthenticated } = require("../server/auth.cjs");
const { requestBridge } = require("../server/apps-script.cjs");
const { errorResponse, json, readBody } = require("../server/http.cjs");
const { validateState } = require("../server/state-schema.cjs");

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const data = await requestBridge("read");
      return json(res, 200, { ok: true, state: data.state, meta: data.meta || {} });
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  if (req.method === "PUT") {
    try {
      if (!hasAllowedOrigin(req)) {
        const error = new Error("Request origin is not allowed");
        error.code = "forbidden_origin";
        throw error;
      }
      if (!isAuthenticated(req)) {
        const error = new Error("Administrator login is required");
        error.code = "unauthorized";
        throw error;
      }
      const state = validateState(readBody(req));
      const data = await requestBridge("write", { state });
      return json(res, 200, { ok: true, state: data.state, meta: data.meta || {} });
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  res.setHeader("Allow", "GET, PUT");
  return json(res, 405, { ok: false, code: "method_not_allowed" });
};
