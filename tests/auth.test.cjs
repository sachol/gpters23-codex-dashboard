const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createSessionValue,
  verifySessionValue,
} = require("../server/auth.cjs");

test("session values verify before expiry", () => {
  const now = Date.UTC(2026, 6, 23, 0, 0, 0);
  const value = createSessionValue("test-secret", now);
  assert.equal(verifySessionValue(value, "test-secret", now + 1000), true);
});

test("session values reject tampering and expiry", () => {
  const now = Date.UTC(2026, 6, 23, 0, 0, 0);
  const value = createSessionValue("test-secret", now);
  assert.equal(verifySessionValue(`${value}x`, "test-secret", now), false);
  assert.equal(verifySessionValue(value, "test-secret", now + 9 * 60 * 60 * 1000), false);
});
