const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertBridgeConfig,
  requestBridge,
} = require("../server/apps-script.cjs");

test("bridge configuration requires URL and secret", () => {
  assert.throws(() => assertBridgeConfig({}), /not configured/);
});

test("bridge sends server-side secret and action", async () => {
  let received;
  const fakeFetch = async (url, options) => {
    received = { url, options, body: JSON.parse(options.body) };
    return {
      ok: true,
      text: async () => JSON.stringify({ ok: true, state: { weekly: [], candidates: [] } }),
    };
  };
  const result = await requestBridge(
    "read",
    {},
    { APPS_SCRIPT_URL: "https://example.test/bridge", SHEET_API_SECRET: "secret" },
    fakeFetch
  );
  assert.equal(result.ok, true);
  assert.equal(received.body.action, "read");
  assert.equal(received.body.secret, "secret");
  assert.equal(received.options.redirect, "follow");
});
