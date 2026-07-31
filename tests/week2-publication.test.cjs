const assert = require("node:assert/strict");
const test = require("node:test");

const {
  PUBLICATION_KEYS,
  requestWeek2Publication,
  sanitizePublication,
} = require("../server/week2-publication.cjs");

test("sanitizePublication returns only the public allowlist", () => {
  const result = sanitizePublication({
    caseId: "case-01",
    propertyType: "상업업무 / 상가·빌딩",
    workflowStatus: "승인",
    beforeMinutes: 90,
    afterMinutes: 35,
    beforeEdits: 4,
    afterEdits: 1,
    evidenceCount: 8,
    conflictCount: 2,
    unresolvedCount: 1,
    leaseCount: 3,
    reviewPassed: true,
    learning: "충돌값을 병렬 표시했다.",
    approvedAt: "2026-07-30T00:00:00.000Z",
    address: "비공개 주소",
    maskedFolderId: "private-folder",
    customerName: "비공개 고객",
  });
  assert.deepEqual(Object.keys(result), PUBLICATION_KEYS);
  assert.equal("address" in result, false);
  assert.equal("maskedFolderId" in result, false);
  assert.equal(JSON.stringify(result).includes("비공개 주소"), false);
});

test("sanitizePublication preserves an unmeasured Before edit count", () => {
  const result = sanitizePublication({
    caseId: "case-01",
    beforeEdits: null,
  });
  assert.equal(result.beforeEdits, null);
});

test("requestWeek2Publication keeps the read secret on the server bridge", async () => {
  let requestBody = null;
  const summary = await requestWeek2Publication({
    url: "https://script.google.com/macros/s/test/exec",
    secret: "read-secret",
    fetchImpl: async (_url, init) => {
      requestBody = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({
          ok: true,
          data: { caseId: "case-01", reviewPassed: true, address: "secret" },
        }),
      };
    },
  });
  assert.deepEqual(requestBody, {
    action: "getPublication",
    secret: "read-secret",
  });
  assert.equal(summary.caseId, "case-01");
  assert.equal("address" in summary, false);
});

test("requestWeek2Publication fails closed when configuration is missing", async () => {
  await assert.rejects(
    requestWeek2Publication({ url: "", secret: "", fetchImpl: async () => null }),
    (error) => error.code === "not_configured",
  );
});
