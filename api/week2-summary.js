const { errorResponse, json } = require("../server/http.cjs");
const {
  requestWeek2Publication,
} = require("../server/week2-publication.cjs");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { ok: false, code: "method_not_allowed" });
  }
  try {
    const summary = await requestWeek2Publication();
    return json(res, 200, { ok: true, summary });
  } catch (error) {
    return errorResponse(res, error);
  }
};
