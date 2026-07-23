function assertBridgeConfig(env = process.env) {
  if (!env.APPS_SCRIPT_URL || !env.SHEET_API_SECRET) {
    const error = new Error("Google Sheets bridge is not configured");
    error.code = "not_configured";
    throw error;
  }
}

async function requestBridge(action, payload = {}, env = process.env, fetchImpl = fetch) {
  assertBridgeConfig(env);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetchImpl(env.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action,
        secret: env.SHEET_API_SECRET,
        ...payload,
      }),
      redirect: "follow",
      signal: controller.signal,
    });
    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      const error = new Error("Google Sheets bridge returned an invalid response");
      error.code = "bridge_error";
      throw error;
    }
    if (!response.ok || data.ok !== true) {
      const error = new Error(data.error || "Google Sheets bridge request failed");
      error.code = data.code || "bridge_error";
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("Google Sheets bridge timed out");
      timeoutError.code = "bridge_timeout";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  assertBridgeConfig,
  requestBridge,
};
