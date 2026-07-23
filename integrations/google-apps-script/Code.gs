const SPREADSHEET_ID = "17m-mUsKkA2eJ6tbZSMQJ0y0Zj0ztLQZLo3Y9Pz7m6hc";
const WEEK_SHEET = "weekly_progress";
const CANDIDATE_SHEET = "candidate_choices";
const REVISION_SHEET = "revision_history";
const WEEK_IDS = ["week1", "week2", "week3", "week4"];
const TASK_IDS = ["plan", "execute", "challenge", "post", "feedback", "expand"];
const CANDIDATE_IDS = [
  "briefing", "checklist", "ad-copy", "follow-up", "auction-docs",
  "auction-rights", "auction-bid-table", "lecture-outline", "prompt-kit", "faq"
];

function doGet() {
  return jsonOutput_({ ok: true, service: "gpters23-dashboard-sheet-bridge" });
}

function doPost(event) {
  try {
    const input = JSON.parse(event.postData && event.postData.contents || "{}");
    verifySecret_(input.secret);
    if (input.action === "read") {
      return jsonOutput_({ ok: true, state: readState_(), meta: meta_() });
    }
    if (input.action === "write") {
      const lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        writeState_(input.state);
        return jsonOutput_({ ok: true, state: readState_(), meta: meta_() });
      } finally {
        lock.releaseLock();
      }
    }
    throw codedError_("invalid_action", "Unsupported action");
  } catch (error) {
    return jsonOutput_({
      ok: false,
      code: error.code || "bridge_error",
      error: error.message || "Bridge request failed"
    });
  }
}

function verifySecret_(provided) {
  const expected = PropertiesService.getScriptProperties().getProperty("SHEET_API_SECRET");
  if (!expected || String(provided || "") !== expected) {
    throw codedError_("unauthorized", "Invalid bridge secret");
  }
}

function codedError_(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function jsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function spreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function rows_(sheetName) {
  const sheet = spreadsheet_().getSheetByName(sheetName);
  if (!sheet) throw codedError_("schema_error", "Missing sheet: " + sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(String);
  return {
    sheet: sheet,
    headers: headers,
    rows: values.map(function(row) {
      return Object.fromEntries(headers.map(function(header, index) {
        return [header, row[index]];
      }));
    })
  };
}

function boolean_(value) {
  return value === true || String(value).toUpperCase() === "TRUE";
}

function nullableNumber_(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function nullableBoolean_(value) {
  if (value === "" || value === null || value === undefined) return null;
  return boolean_(value);
}

function dateText_(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, "Asia/Seoul", "yyyy-MM-dd");
  }
  return String(value);
}

function timestampText_(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, "Asia/Seoul", "yyyy-MM-dd'T'HH:mm:ssXXX");
  }
  return String(value);
}

function safeText_(value, maxLength) {
  let text = String(value == null ? "" : value).trim().slice(0, maxLength);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

function readState_() {
  const weekly = rows_(WEEK_SHEET).rows
    .filter(function(row) { return WEEK_IDS.indexOf(String(row.week_id)) >= 0; })
    .map(function(row) {
      return {
        weekId: String(row.week_id),
        sessionDate: dateText_(row.session_date),
        topic: String(row.topic || ""),
        tasks: {
          plan: boolean_(row.task_plan),
          execute: boolean_(row.task_execute),
          challenge: boolean_(row.task_challenge),
          post: boolean_(row.task_post),
          feedback: boolean_(row.task_feedback),
          expand: boolean_(row.task_expand)
        },
        result: String(row.result || ""),
        feedback: String(row.feedback || ""),
        nextExperiment: String(row.next_experiment || ""),
        beforeMinutes: nullableNumber_(row.before_minutes),
        afterMinutes: nullableNumber_(row.after_minutes),
        artifactsCount: nullableNumber_(row.artifacts_count) || 0,
        caseDone: boolean_(row.case_done),
        updatedAt: timestampText_(row.updated_at),
        revisionNo: nullableNumber_(row.revision_no) || 0
      };
    });

  const candidates = rows_(CANDIDATE_SHEET).rows
    .filter(function(row) { return CANDIDATE_IDS.indexOf(String(row.candidate_id)) >= 0; })
    .map(function(row) {
      return {
        candidateId: String(row.candidate_id),
        candidateName: String(row.candidate_name || ""),
        domain: String(row.domain || ""),
        selected: boolean_(row.selected),
        assignedWeek: String(row.assigned_week || ""),
        estimatedMinutes: nullableNumber_(row.estimated_minutes),
        monthlyFrequency: nullableNumber_(row.monthly_frequency),
        publicCase: nullableBoolean_(row.public_case),
        updatedAt: timestampText_(row.updated_at)
      };
    });

  return { weekly: weekly, candidates: candidates };
}

function writeState_(state) {
  if (!state || !Array.isArray(state.weekly) || !Array.isArray(state.candidates)) {
    throw codedError_("invalid_state", "State payload is incomplete");
  }
  const now = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd'T'HH:mm:ssXXX");
  const revisionRows = [];
  writeWeekly_(state.weekly, now, state.deviceLabel || "office-chrome", revisionRows);
  writeCandidates_(state.candidates, now, state.deviceLabel || "office-chrome", revisionRows);
  if (revisionRows.length) {
    const revisionSheet = spreadsheet_().getSheetByName(REVISION_SHEET);
    revisionSheet.getRange(
      revisionSheet.getLastRow() + 1,
      1,
      revisionRows.length,
      revisionRows[0].length
    ).setValues(revisionRows);
  }
}

function writeWeekly_(incomingRows, now, deviceLabel, revisionRows) {
  const table = rows_(WEEK_SHEET);
  const incomingById = Object.fromEntries(incomingRows.map(function(row) {
    return [row.weekId, row];
  }));
  const output = table.rows.map(function(current) {
    const weekId = String(current.week_id);
    const incoming = incomingById[weekId];
    if (!incoming || WEEK_IDS.indexOf(weekId) < 0) return table.headers.map(function(header) { return current[header]; });

    const next = Object.assign({}, current, {
      session_date: safeText_(incoming.sessionDate, 10),
      topic: safeText_(incoming.topic, 180),
      task_plan: Boolean(incoming.tasks && incoming.tasks.plan),
      task_execute: Boolean(incoming.tasks && incoming.tasks.execute),
      task_challenge: Boolean(incoming.tasks && incoming.tasks.challenge),
      task_post: Boolean(incoming.tasks && incoming.tasks.post),
      task_feedback: Boolean(incoming.tasks && incoming.tasks.feedback),
      task_expand: Boolean(incoming.tasks && incoming.tasks.expand),
      result: safeText_(incoming.result, 2500),
      feedback: safeText_(incoming.feedback, 2500),
      next_experiment: safeText_(incoming.nextExperiment, 2500),
      before_minutes: blankableNumber_(incoming.beforeMinutes),
      after_minutes: blankableNumber_(incoming.afterMinutes),
      artifacts_count: blankableNumber_(incoming.artifactsCount) || 0,
      case_done: Boolean(incoming.caseDone)
    });

    const changed = recordChanges_(
      "weekly",
      weekId,
      current,
      next,
      table.headers.filter(function(header) {
        return ["week_id", "updated_at", "revision_no"].indexOf(header) < 0;
      }),
      now,
      deviceLabel,
      revisionRows
    );
    if (changed) {
      next.updated_at = now;
      next.revision_no = Number(current.revision_no || 0) + 1;
    }
    return table.headers.map(function(header) { return next[header]; });
  });
  table.sheet.getRange(2, 1, output.length, table.headers.length).setValues(output);
}

function writeCandidates_(incomingRows, now, deviceLabel, revisionRows) {
  const table = rows_(CANDIDATE_SHEET);
  const incomingById = Object.fromEntries(incomingRows.map(function(row) {
    return [row.candidateId, row];
  }));
  const output = table.rows.map(function(current) {
    const candidateId = String(current.candidate_id);
    const incoming = incomingById[candidateId];
    if (!incoming || CANDIDATE_IDS.indexOf(candidateId) < 0) return table.headers.map(function(header) { return current[header]; });

    const next = Object.assign({}, current, {
      candidate_name: safeText_(incoming.candidateName, 180),
      domain: safeText_(incoming.domain, 20),
      selected: Boolean(incoming.selected),
      assigned_week: safeText_(incoming.assignedWeek, 10),
      estimated_minutes: blankableNumber_(incoming.estimatedMinutes),
      monthly_frequency: blankableNumber_(incoming.monthlyFrequency),
      public_case: incoming.publicCase === null || incoming.publicCase === undefined ? "" : Boolean(incoming.publicCase)
    });

    const changed = recordChanges_(
      "candidate",
      candidateId,
      current,
      next,
      table.headers.filter(function(header) {
        return ["candidate_id", "updated_at"].indexOf(header) < 0;
      }),
      now,
      deviceLabel,
      revisionRows
    );
    if (changed) next.updated_at = now;
    return table.headers.map(function(header) { return next[header]; });
  });
  table.sheet.getRange(2, 1, output.length, table.headers.length).setValues(output);
}

function blankableNumber_(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  return Number.isFinite(number) ? number : "";
}

function recordChanges_(section, recordId, current, next, fields, now, deviceLabel, revisionRows) {
  let changed = false;
  fields.forEach(function(field) {
    const oldValue = comparable_(current[field]);
    const newValue = comparable_(next[field]);
    if (oldValue === newValue) return;
    changed = true;
    revisionRows.push([
      "rev-" + Date.now() + "-" + (revisionRows.length + 1),
      now,
      section,
      recordId,
      field,
      oldValue,
      newValue,
      safeText_(deviceLabel, 40),
      "대시보드 관리자 저장"
    ]);
  });
  return changed;
}

function comparable_(value) {
  if (value === null || value === undefined) return "";
  if (Object.prototype.toString.call(value) === "[object Date]") return dateText_(value);
  return String(value);
}

function meta_() {
  return {
    source: "google-sheets",
    spreadsheetId: SPREADSHEET_ID,
    readAt: Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd'T'HH:mm:ssXXX")
  };
}
