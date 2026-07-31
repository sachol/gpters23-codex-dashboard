const PUBLICATION_KEYS = [
  "caseId",
  "propertyType",
  "workflowStatus",
  "beforeMinutes",
  "afterMinutes",
  "beforeEdits",
  "afterEdits",
  "evidenceCount",
  "conflictCount",
  "unresolvedCount",
  "leaseCount",
  "reviewPassed",
  "learning",
  "approvedAt",
];

function sanitizePublication(value) {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    const error = new Error("Week 2 publication response is invalid");
    error.code = "bridge_error";
    throw error;
  }
  return Object.fromEntries(PUBLICATION_KEYS.map((key) => [key, value[key]]));
}

async function requestWeek2Publication(options = {}) {
  const url =
    options.url || process.env.WEEK2_PRIVATE_APPS_SCRIPT_URL;
  const secret =
    options.secret || process.env.WEEK2_PUBLIC_READ_SECRET;
  const fetchImpl = options.fetchImpl || fetch;
  if (!url || !secret) {
    const error = new Error("Week 2 public summary is not configured");
    error.code = "not_configured";
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "getPublication", secret }),
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) {
      const error = new Error(`Week 2 bridge returned HTTP ${response.status}`);
      error.code = "bridge_error";
      throw error;
    }
    const payload = await response.json();
    if (!payload || payload.ok !== true) {
      const error = new Error("Week 2 bridge rejected the request");
      error.code = "bridge_error";
      throw error;
    }
    return sanitizePublication(payload.data);
  } catch (error) {
    if (error && error.name === "AbortError") {
      const timeoutError = new Error("Week 2 bridge timed out");
      timeoutError.code = "bridge_timeout";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  PUBLICATION_KEYS,
  requestWeek2Publication,
  sanitizePublication,
};
