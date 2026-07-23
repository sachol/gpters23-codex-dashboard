function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function errorResponse(res, error) {
  const code = error.code || "server_error";
  const statusByCode = {
    invalid_state: 400,
    invalid_credentials: 401,
    unauthorized: 401,
    forbidden_origin: 403,
    not_configured: 503,
    bridge_timeout: 504,
    bridge_error: 502,
  };
  json(res, statusByCode[code] || 500, {
    ok: false,
    code,
    error: code === "server_error" ? "Unexpected server error" : error.message,
  });
}

module.exports = {
  errorResponse,
  json,
  readBody,
};
