const test = require("node:test");
const assert = require("node:assert/strict");
const {
  CANDIDATE_IDS,
  WEEK_IDS,
  validateState,
} = require("../server/state-schema.cjs");

function validState() {
  return {
    weekly: WEEK_IDS.map((weekId) => ({
      weekId,
      sessionDate: "2026-07-22",
      topic: `${weekId} topic`,
      tasks: {
        plan: false,
        execute: false,
        challenge: false,
        post: false,
        feedback: false,
        expand: false,
      },
      result: "",
      feedback: "",
      nextExperiment: "",
      beforeMinutes: null,
      afterMinutes: null,
      artifactsCount: 0,
      caseDone: false,
      revisionNo: 0,
    })),
    candidates: CANDIDATE_IDS.map((candidateId) => ({
      candidateId,
      candidateName: candidateId,
      domain: candidateId.startsWith("auction")
        ? "auction"
        : ["lecture-outline", "prompt-kit", "faq"].includes(candidateId)
          ? "education"
          : "brokerage",
      selected: false,
      assignedWeek: "",
      estimatedMinutes: null,
      monthlyFrequency: null,
      publicCase: null,
    })),
    deviceLabel: "office-chrome",
  };
}

test("validateState accepts the dashboard schema", () => {
  const result = validateState(validState());
  assert.equal(result.weekly.length, 4);
  assert.equal(result.candidates.length, 10);
});

test("validateState rejects missing weekly rows", () => {
  const input = validState();
  input.weekly.pop();
  assert.throws(() => validateState(input), /four rows/);
});

test("validateState rejects oversized notes", () => {
  const input = validState();
  input.weekly[0].result = "x".repeat(2501);
  assert.throws(() => validateState(input), /too long/);
});

test("validateState rejects invalid candidate assignments", () => {
  const input = validState();
  input.candidates[0].assignedWeek = "week1";
  assert.throws(() => validateState(input), /assignedWeek is invalid/);
});
