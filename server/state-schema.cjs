const WEEK_IDS = ["week1", "week2", "week3", "week4"];
const TASK_IDS = ["plan", "execute", "challenge", "post", "feedback", "expand"];
const CANDIDATE_IDS = [
  "briefing",
  "checklist",
  "ad-copy",
  "follow-up",
  "auction-docs",
  "auction-rights",
  "auction-bid-table",
  "lecture-outline",
  "prompt-kit",
  "faq",
];
const DOMAINS = ["brokerage", "auction", "education"];
const ASSIGNED_WEEKS = ["", "week2", "week3", "week4"];

function assert(condition, message) {
  if (!condition) {
    const error = new Error(message);
    error.code = "invalid_state";
    throw error;
  }
}

function text(value, maxLength, fieldName) {
  const normalized = value == null ? "" : String(value).trim();
  assert(normalized.length <= maxLength, `${fieldName} is too long`);
  return normalized;
}

function nullableInteger(value, max, fieldName) {
  if (value === "" || value == null) return null;
  const normalized = Number(value);
  assert(Number.isInteger(normalized), `${fieldName} must be an integer`);
  assert(normalized >= 0 && normalized <= max, `${fieldName} is out of range`);
  return normalized;
}

function nullableBoolean(value, fieldName) {
  if (value === "" || value == null) return null;
  assert(typeof value === "boolean", `${fieldName} must be a boolean`);
  return value;
}

function validateWeekly(rows) {
  assert(Array.isArray(rows) && rows.length === WEEK_IDS.length, "weekly must contain four rows");
  const byId = new Map(rows.map((row) => [row.weekId, row]));
  return WEEK_IDS.map((weekId) => {
    const row = byId.get(weekId);
    assert(row && row.weekId === weekId, `missing weekly row: ${weekId}`);
    const tasks = {};
    TASK_IDS.forEach((taskId) => {
      assert(typeof row.tasks?.[taskId] === "boolean", `${weekId}.${taskId} must be a boolean`);
      tasks[taskId] = row.tasks[taskId];
    });
    return {
      weekId,
      sessionDate: text(row.sessionDate, 10, `${weekId}.sessionDate`),
      topic: text(row.topic, 180, `${weekId}.topic`),
      tasks,
      result: text(row.result, 2500, `${weekId}.result`),
      feedback: text(row.feedback, 2500, `${weekId}.feedback`),
      nextExperiment: text(row.nextExperiment, 2500, `${weekId}.nextExperiment`),
      beforeMinutes: nullableInteger(row.beforeMinutes, 1440, `${weekId}.beforeMinutes`),
      afterMinutes: nullableInteger(row.afterMinutes, 1440, `${weekId}.afterMinutes`),
      artifactsCount: nullableInteger(row.artifactsCount, 100, `${weekId}.artifactsCount`) ?? 0,
      caseDone: Boolean(row.caseDone),
      revisionNo: nullableInteger(row.revisionNo, 100000, `${weekId}.revisionNo`) ?? 0,
    };
  });
}

function validateCandidates(rows) {
  assert(Array.isArray(rows) && rows.length === CANDIDATE_IDS.length, "candidates must contain ten rows");
  const byId = new Map(rows.map((row) => [row.candidateId, row]));
  return CANDIDATE_IDS.map((candidateId) => {
    const row = byId.get(candidateId);
    assert(row && row.candidateId === candidateId, `missing candidate row: ${candidateId}`);
    const domain = text(row.domain, 20, `${candidateId}.domain`);
    const assignedWeek = text(row.assignedWeek, 10, `${candidateId}.assignedWeek`);
    assert(DOMAINS.includes(domain), `${candidateId}.domain is invalid`);
    assert(ASSIGNED_WEEKS.includes(assignedWeek), `${candidateId}.assignedWeek is invalid`);
    return {
      candidateId,
      candidateName: text(row.candidateName, 180, `${candidateId}.candidateName`),
      domain,
      selected: Boolean(row.selected),
      assignedWeek,
      estimatedMinutes: nullableInteger(row.estimatedMinutes, 1440, `${candidateId}.estimatedMinutes`),
      monthlyFrequency: nullableInteger(row.monthlyFrequency, 1000, `${candidateId}.monthlyFrequency`),
      publicCase: nullableBoolean(row.publicCase, `${candidateId}.publicCase`),
    };
  });
}

function validateState(input) {
  assert(input && typeof input === "object", "state payload is required");
  const serialized = JSON.stringify(input);
  assert(Buffer.byteLength(serialized, "utf8") <= 100 * 1024, "state payload is too large");
  return {
    weekly: validateWeekly(input.weekly),
    candidates: validateCandidates(input.candidates),
    deviceLabel: text(input.deviceLabel || "office-chrome", 40, "deviceLabel"),
  };
}

module.exports = {
  ASSIGNED_WEEKS,
  CANDIDATE_IDS,
  DOMAINS,
  TASK_IDS,
  WEEK_IDS,
  validateState,
};
