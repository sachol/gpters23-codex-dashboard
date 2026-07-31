/**
 * GPTERS 23기 Week 2 전용 비공개 Google Sheets 브리지.
 *
 * Script Properties (필수):
 * - SPREADSHEET_ID
 * - PRIVATE_WRITE_SECRET
 * - PUBLIC_READ_SECRET
 *
 * 이 스크립트는 기존 공개 실용보드 Apps Script와 별도로 배포한다.
 */

const SHEETS = Object.freeze({
  CASES: "Cases",
  SOURCES: "SourceEvidence",
  LEASES: "LeaseComparison",
  GATES: "ReviewGate",
  TIMERS: "TimerEntry",
  EVIDENCE_LOG: "EvidenceLog",
  PUBLICATION: "PublicationSummary",
});

const HEADERS = Object.freeze({
  Cases: ["case_id", "updated_at", "status", "property_type", "case_json"],
  SourceEvidence: [
    "case_id",
    "evidence_id",
    "source_type",
    "source_name",
    "original_value",
    "current_value",
    "source_date",
    "checked_at",
    "url",
    "difference",
    "status",
    "query_status",
    "reviewer_decision",
  ],
  LeaseComparison: [
    "case_id",
    "lease_id",
    "unit",
    "owner_deposit",
    "contract_deposit",
    "owner_monthly_rent",
    "contract_monthly_rent",
    "owner_lease_period",
    "contract_lease_period",
    "contract_page_status",
    "difference",
    "review_status",
  ],
  ReviewGate: [
    "case_id",
    "gate_id",
    "label",
    "approved",
    "approved_at",
    "reviewer",
    "note",
  ],
  TimerEntry: [
    "case_id",
    "timer_id",
    "mode",
    "stage",
    "started_at",
    "ended_at",
    "active_minutes",
    "waiting_excluded",
    "edit_count",
    "note",
  ],
  EvidenceLog: ["case_id", "log_id", "step", "summary", "created_at"],
  PublicationSummary: [
    "case_id",
    "property_type",
    "workflow_status",
    "before_minutes",
    "after_minutes",
    "before_edits",
    "after_edits",
    "evidence_count",
    "conflict_count",
    "unresolved_count",
    "lease_count",
    "review_passed",
    "learning",
    "approved_at",
    "published_at",
  ],
});

function doPost(event) {
  try {
    const request = JSON.parse((event && event.postData && event.postData.contents) || "{}");
    const action = stringValue_(request.action, "action", 40);
    const properties = PropertiesService.getScriptProperties();
    if (action === "getPublication") {
      requireSecret_(request.secret, properties.getProperty("PUBLIC_READ_SECRET"));
      return json_({ ok: true, data: getLatestPublication_() });
    }

    requireSecret_(request.secret, properties.getProperty("PRIVATE_WRITE_SECRET"));
    if (action === "saveCase") {
      const state = validateCase_(request.payload);
      saveCase_(state);
      return json_({ ok: true, data: { caseId: state.case.caseId, savedAt: new Date().toISOString() } });
    }
    if (action === "getCase") {
      const caseId = stringValue_(request.caseId, "caseId", 120);
      return json_({ ok: true, data: getCase_(caseId) });
    }
    if (action === "publishSummary") {
      const summary = validatePublication_(request.payload);
      savePublication_(summary);
      return json_({ ok: true, data: { caseId: summary.caseId, publishedAt: new Date().toISOString() } });
    }
    throw new Error("지원하지 않는 action입니다.");
  } catch (error) {
    return json_({ ok: false, error: error.message || String(error) });
  }
}

function setupPrivateWorkbook() {
  const spreadsheet = spreadsheet_();
  Object.keys(HEADERS).forEach(function (name) {
    ensureSheet_(spreadsheet, name, HEADERS[name]);
  });
  return "시트 구조를 확인했습니다.";
}

function validateCase_(value) {
  if (!value || typeof value !== "object" || value.schemaVersion !== 1) {
    throw new Error("지원하지 않는 케이스 형식입니다.");
  }
  if (!value.case || !Array.isArray(value.sources) || !Array.isArray(value.leases)) {
    throw new Error("케이스 필수 레코드가 없습니다.");
  }
  if (value.leases.length < 1 || value.leases.length > 5) {
    throw new Error("임대차계약서는 1~5건이어야 합니다.");
  }
  if (!Array.isArray(value.gates) || value.gates.length !== 3) {
    throw new Error("검수 단계는 정확히 3개여야 합니다.");
  }
  stringValue_(value.case.caseId, "caseId", 120);
  stringValue_(value.case.maskedFolderId, "maskedFolderId", 500);
  if (JSON.stringify(value).length > 500000) {
    throw new Error("케이스 본문은 500KB를 초과할 수 없습니다.");
  }
  return value;
}

function validatePublication_(value) {
  if (!value || typeof value !== "object") throw new Error("공개 요약 형식이 올바르지 않습니다.");
  const keys = [
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
  Object.keys(value).forEach(function (key) {
    if (keys.indexOf(key) === -1) throw new Error("공개 허용목록 밖의 필드입니다: " + key);
  });
  if (value.reviewPassed !== true || !value.approvedAt) {
    throw new Error("최종 검수 승인된 요약만 공개할 수 있습니다.");
  }
  return value;
}

function saveCase_(state) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const spreadsheet = spreadsheet_();
    setupPrivateWorkbook();
    const caseId = state.case.caseId;
    upsertByKey_(
      spreadsheet.getSheetByName(SHEETS.CASES),
      caseId,
      [
        caseId,
        state.case.updatedAt,
        state.case.status,
        state.case.propertyGroup + " / " + state.case.propertySubtype,
        JSON.stringify(state),
      ],
    );
    replaceCaseRows_(spreadsheet.getSheetByName(SHEETS.SOURCES), caseId, state.sources.map(function (source) {
      return [
        caseId,
        source.evidenceId,
        source.sourceType,
        source.sourceName,
        source.originalValue,
        source.currentValue,
        source.sourceDate,
        source.checkedAt,
        source.url,
        source.difference,
        source.status,
        source.queryStatus,
        source.reviewerDecision,
      ];
    }));
    replaceCaseRows_(spreadsheet.getSheetByName(SHEETS.LEASES), caseId, state.leases.map(function (lease) {
      return [
        caseId,
        lease.leaseId,
        lease.unit,
        lease.ownerDeposit,
        lease.contractDeposit,
        lease.ownerMonthlyRent,
        lease.contractMonthlyRent,
        lease.ownerLeasePeriod,
        lease.contractLeasePeriod,
        lease.contractPageStatus,
        lease.difference,
        lease.reviewStatus,
      ];
    }));
    replaceCaseRows_(spreadsheet.getSheetByName(SHEETS.GATES), caseId, state.gates.map(function (gate) {
      return [caseId, gate.gateId, gate.label, gate.approved, gate.approvedAt, gate.reviewer, gate.note];
    }));
    replaceCaseRows_(spreadsheet.getSheetByName(SHEETS.TIMERS), caseId, state.timers.map(function (timer) {
      return [
        caseId,
        timer.timerId,
        timer.mode,
        timer.stage,
        timer.startedAt,
        timer.endedAt,
        timer.activeMinutes,
        timer.waitingExcluded,
        timer.editCount,
        timer.note,
      ];
    }));
    replaceCaseRows_(
      spreadsheet.getSheetByName(SHEETS.EVIDENCE_LOG),
      caseId,
      state.evidenceLog.map(function (entry) {
        return [caseId, entry.logId, entry.step, entry.summary, entry.createdAt];
      }),
    );
  } finally {
    lock.releaseLock();
  }
}

function getCase_(caseId) {
  const sheet = spreadsheet_().getSheetByName(SHEETS.CASES);
  if (!sheet || sheet.getLastRow() < 2) throw new Error("저장된 케이스가 없습니다.");
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
  for (let index = 0; index < values.length; index += 1) {
    if (String(values[index][0]) === caseId) return JSON.parse(values[index][4]);
  }
  throw new Error("케이스를 찾지 못했습니다.");
}

function savePublication_(summary) {
  const sheet = spreadsheet_().getSheetByName(SHEETS.PUBLICATION);
  const publishedAt = new Date().toISOString();
  upsertByKey_(sheet, summary.caseId, [
    summary.caseId,
    summary.propertyType,
    summary.workflowStatus,
    summary.beforeMinutes,
    summary.afterMinutes,
    summary.beforeEdits,
    summary.afterEdits,
    summary.evidenceCount,
    summary.conflictCount,
    summary.unresolvedCount,
    summary.leaseCount,
    summary.reviewPassed,
    summary.learning,
    summary.approvedAt,
    publishedAt,
  ]);
}

function getLatestPublication_() {
  const sheet = spreadsheet_().getSheetByName(SHEETS.PUBLICATION);
  if (!sheet || sheet.getLastRow() < 2) return null;
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.PublicationSummary.length).getValues();
  values.sort(function (a, b) { return String(b[14]).localeCompare(String(a[14])); });
  const row = values[0];
  return {
    caseId: row[0],
    propertyType: row[1],
    workflowStatus: row[2],
    beforeMinutes: row[3],
    afterMinutes: row[4],
    beforeEdits: row[5],
    afterEdits: row[6],
    evidenceCount: row[7],
    conflictCount: row[8],
    unresolvedCount: row[9],
    leaseCount: row[10],
    reviewPassed: row[11] === true,
    learning: row[12],
    approvedAt: row[13],
  };
}

function spreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!id) throw new Error("SPREADSHEET_ID Script Property가 없습니다.");
  return SpreadsheetApp.openById(id);
}

function ensureSheet_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return;
  }
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (JSON.stringify(current) !== JSON.stringify(headers)) {
    throw new Error(name + " 시트 헤더가 예상 스키마와 다릅니다.");
  }
}

function upsertByKey_(sheet, key, row) {
  if (!sheet) throw new Error("대상 시트를 찾지 못했습니다.");
  const safeRow = row.map(safeCell_);
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let index = 0; index < keys.length; index += 1) {
      if (String(keys[index][0]) === String(key)) {
        sheet.getRange(index + 2, 1, 1, safeRow.length).setValues([safeRow]);
        return;
      }
    }
  }
  sheet.appendRow(safeRow);
}

function replaceCaseRows_(sheet, caseId, rows) {
  if (!sheet) throw new Error("대상 시트를 찾지 못했습니다.");
  for (let row = sheet.getLastRow(); row >= 2; row -= 1) {
    if (String(sheet.getRange(row, 1).getValue()) === String(caseId)) {
      sheet.deleteRow(row);
    }
  }
  if (rows.length) {
    const safeRows = rows.map(function (item) { return item.map(safeCell_); });
    sheet.getRange(sheet.getLastRow() + 1, 1, safeRows.length, safeRows[0].length).setValues(safeRows);
  }
}

function safeCell_(value) {
  if (typeof value === "string" && /^[=+\-@]/.test(value)) return "'" + value;
  return value === undefined || value === null ? "" : value;
}

function requireSecret_(provided, expected) {
  if (!expected || typeof provided !== "string" || provided !== expected) {
    throw new Error("인증에 실패했습니다.");
  }
}

function stringValue_(value, label, maxLength) {
  if (typeof value !== "string" || !value || value.length > maxLength) {
    throw new Error(label + " 값이 올바르지 않습니다.");
  }
  return value;
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
