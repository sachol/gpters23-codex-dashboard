import {
  EVIDENCE_STATUSES,
  EXECUTION_STATUSES,
  REVIEW_GATE_IDS,
  type CaseState,
  type EvidenceLogEntry,
  type LeaseComparison,
  type OutputDrafts,
  type PublicationSummary,
  type ReviewGate,
  type SourceEvidence,
  type TimerEntry,
} from "./types.ts";
import { BUYER_PURPOSES, PROPERTY_GROUPS } from "./domain.ts";
import { EXECUTION_MODES } from "./domain.ts";

const MAX_BODY_BYTES = 500_000;
const STATUS_SET = new Set(EVIDENCE_STATUSES);
const GATE_SET = new Set(REVIEW_GATE_IDS);

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} 형식이 올바르지 않습니다.`);
  }
  return value as Record<string, unknown>;
}

function arrayValue(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label}은 배열이어야 합니다.`);
  return value;
}

function textValue(
  value: unknown,
  label: string,
  maxLength = 5000,
): string {
  if (typeof value !== "string") throw new Error(`${label}은 문자열이어야 합니다.`);
  if (value.length > maxLength) throw new Error(`${label}이 너무 깁니다.`);
  return value;
}

function optionalTextValue(
  value: unknown,
  label: string,
  maxLength = 5000,
): string {
  if (value === undefined || value === null) return "";
  return textValue(value, label, maxLength);
}

function optionalNumber(
  value: unknown,
  label: string,
  max = 1_000_000_000_000_000,
): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > max) {
    throw new Error(`${label}은 허용 범위의 0 이상 숫자여야 합니다.`);
  }
  return value;
}

function booleanValue(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${label}은 참/거짓이어야 합니다.`);
  return value;
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label} 값이 허용목록에 없습니다.`);
  }
  return value as T;
}

function parseSource(value: unknown): SourceEvidence {
  const source = objectValue(value, "출처");
  return {
    evidenceId: textValue(source.evidenceId, "출처 ID", 120),
    sourceType: textValue(source.sourceType, "자료 종류", 120),
    sourceName: textValue(source.sourceName, "자료명", 240),
    originalValue: textValue(source.originalValue, "원문 값"),
    currentValue: textValue(source.currentValue, "최신 조회값"),
    sourceDate: textValue(source.sourceDate, "기준일", 40),
    checkedAt: textValue(source.checkedAt, "확인일", 40),
    url: textValue(source.url, "출처 URL", 1200),
    difference: textValue(source.difference, "차이"),
    status: oneOf(source.status, EVIDENCE_STATUSES, "출처 상태"),
    queryStatus: oneOf(source.queryStatus, EXECUTION_STATUSES, "조회 실행 상태"),
    reviewerDecision: textValue(source.reviewerDecision, "대표님 판단"),
  };
}

function parseLease(value: unknown): LeaseComparison {
  const lease = objectValue(value, "임대차");
  return {
    leaseId: textValue(lease.leaseId, "임대차 ID", 120),
    unit: textValue(lease.unit, "층·호", 120),
    ownerDeposit: optionalNumber(lease.ownerDeposit, "설명 보증금"),
    contractDeposit: optionalNumber(lease.contractDeposit, "계약서 보증금"),
    ownerMonthlyRent: optionalNumber(lease.ownerMonthlyRent, "설명 월세"),
    contractMonthlyRent: optionalNumber(lease.contractMonthlyRent, "계약서 월세"),
    ownerLeasePeriod: textValue(lease.ownerLeasePeriod, "설명 임대차기간", 200),
    contractLeasePeriod: textValue(lease.contractLeasePeriod, "계약서 임대차기간", 200),
    contractPageStatus: oneOf(
      lease.contractPageStatus,
      EVIDENCE_STATUSES,
      "계약서 판독 상태",
    ),
    difference: textValue(lease.difference, "임대차 차이"),
    reviewStatus: oneOf(lease.reviewStatus, EVIDENCE_STATUSES, "임대차 검수 상태"),
  };
}

function parseGate(value: unknown): ReviewGate {
  const gate = objectValue(value, "검수 단계");
  const gateId = textValue(gate.gateId, "검수 단계 ID", 60);
  if (!GATE_SET.has(gateId as ReviewGate["gateId"])) {
    throw new Error("검수 단계 ID가 허용목록에 없습니다.");
  }
  return {
    gateId: gateId as ReviewGate["gateId"],
    label: textValue(gate.label, "검수 단계명", 160),
    approved: booleanValue(gate.approved, "승인 여부"),
    approvedAt: textValue(gate.approvedAt, "승인일", 40),
    reviewer: textValue(gate.reviewer, "검수자", 120),
    note: textValue(gate.note, "검수 메모"),
  };
}

function parseTimer(value: unknown): TimerEntry {
  const timer = objectValue(value, "타이머");
  return {
    timerId: textValue(timer.timerId, "타이머 ID", 120),
    mode: oneOf(timer.mode, ["before", "after"] as const, "측정 구분"),
    stage: textValue(timer.stage, "측정 단계", 160),
    startedAt: textValue(timer.startedAt, "시작 시각", 40),
    endedAt: textValue(timer.endedAt, "종료 시각", 40),
    activeMinutes: optionalNumber(timer.activeMinutes, "활동시간", 100_000) ?? 0,
    waitingExcluded: booleanValue(timer.waitingExcluded, "대기시간 제외 여부"),
    editCount: optionalNumber(timer.editCount, "수정 횟수", 100_000) ?? 0,
    note: textValue(timer.note, "측정 메모"),
  };
}

function parseOutputs(value: unknown): OutputDrafts {
  const outputs = objectValue(value, "결과물");
  return {
    customerBriefing: textValue(outputs.customerBriefing, "고객용 제안서", 50_000),
    internalReview: textValue(outputs.internalReview, "내부 검수표", 50_000),
    questionsToConfirm: textValue(outputs.questionsToConfirm, "확인 질문", 30_000),
    priceAdjustmentFactors: textValue(
      outputs.priceAdjustmentFactors,
      "가격 조정 요인",
      30_000,
    ),
    locationEvidence: textValue(outputs.locationEvidence, "입지 근거", 30_000),
    assetValueEvidence: optionalTextValue(
      outputs.assetValueEvidence,
      "자산가치 근거",
      30_000,
    ),
  };
}

function parseEvidenceLog(value: unknown): EvidenceLogEntry {
  const log = objectValue(value, "증거 장부");
  return {
    logId: textValue(log.logId, "로그 ID", 120),
    step: textValue(log.step, "로그 단계", 160),
    summary: textValue(log.summary, "로그 요약", 5000),
    createdAt: textValue(log.createdAt, "로그 생성일", 40),
  };
}

export function assertBodySize(raw: string): void {
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    throw new Error("요청 본문은 500KB를 초과할 수 없습니다.");
  }
}

export function parseCaseState(value: unknown): CaseState {
  const root = objectValue(value, "케이스");
  if (root.schemaVersion !== 1) throw new Error("지원하지 않는 스키마 버전입니다.");
  const caseValue = objectValue(root.case, "매물 기본정보");
  const propertyGroup = oneOf(caseValue.propertyGroup, PROPERTY_GROUPS, "매물 대분류");
  const buyerPurpose = textValue(caseValue.buyerPurpose, "매수 목적", 120);
  if (!BUYER_PURPOSES.includes(buyerPurpose) && buyerPurpose !== "기타") {
    throw new Error("매수 목적이 허용목록에 없습니다.");
  }
  const secondaryBuyerPurpose = optionalTextValue(
    caseValue.secondaryBuyerPurpose,
    "보조 매수 목적",
    120,
  );
  if (
    secondaryBuyerPurpose &&
    !BUYER_PURPOSES.includes(secondaryBuyerPurpose) &&
    secondaryBuyerPurpose !== "기타"
  ) {
    throw new Error("보조 매수 목적이 허용목록에 없습니다.");
  }

  const sources = arrayValue(root.sources, "출처");
  const leases = arrayValue(root.leases, "임대차");
  const gates = arrayValue(root.gates, "검수 단계");
  const timers = arrayValue(root.timers, "타이머");
  const evidenceLog = arrayValue(root.evidenceLog, "증거 장부");
  if (sources.length > 100) throw new Error("출처는 최대 100건입니다.");
  if (leases.length < 1 || leases.length > 5) {
    throw new Error("임대차계약서는 1~5건이어야 합니다.");
  }
  if (gates.length !== 3) throw new Error("검수 단계는 정확히 3개여야 합니다.");
  if (timers.length > 500) throw new Error("타이머 기록은 최대 500건입니다.");
  if (evidenceLog.length > 500) throw new Error("증거 장부는 최대 500건입니다.");

  return {
    schemaVersion: 1,
    case: {
      caseId: textValue(caseValue.caseId, "케이스 ID", 120),
      executionMode:
        caseValue.executionMode === undefined
          ? "실제 사건 모드"
          : oneOf(caseValue.executionMode, EXECUTION_MODES, "실행 모드"),
      propertyGroup,
      propertySubtype: textValue(caseValue.propertySubtype, "세부유형", 120),
      propertySubtypeCustom: textValue(
        caseValue.propertySubtypeCustom,
        "직접입력 세부유형",
        120,
      ),
      transactionType: oneOf(
        caseValue.transactionType,
        ["매매", "임대", "기타"] as const,
        "거래 유형",
      ),
      address: textValue(caseValue.address, "주소", 500),
      askingPrice: optionalNumber(caseValue.askingPrice, "매도가"),
      buyerPurpose,
      secondaryBuyerPurpose,
      maskedFolderId: textValue(caseValue.maskedFolderId, "마스킹 폴더 ID", 500),
      consentDate: textValue(caseValue.consentDate, "동의일", 40),
      consentScope: textValue(caseValue.consentScope, "동의 범위", 1000),
      status: oneOf(
        caseValue.status,
        ["초안", "검수중", "승인", "보류"] as const,
        "업무 상태",
      ),
      createdAt: textValue(caseValue.createdAt, "생성일", 40),
      updatedAt: textValue(caseValue.updatedAt, "수정일", 40),
    },
    sources: sources.map(parseSource),
    leases: leases.map(parseLease),
    gates: gates.map(parseGate),
    timers: timers.map(parseTimer),
    outputs: parseOutputs(root.outputs),
    evidenceLog: evidenceLog.map(parseEvidenceLog),
  };
}

export function parsePublicationSummary(value: unknown): PublicationSummary {
  const summary = objectValue(value, "공개 요약");
  return {
    caseId: textValue(summary.caseId, "케이스 ID", 120),
    propertyType: textValue(summary.propertyType, "매물 유형", 200),
    workflowStatus: textValue(summary.workflowStatus, "진행 상태", 40),
    beforeMinutes: optionalNumber(summary.beforeMinutes, "Before 시간", 100_000) ?? 0,
    afterMinutes: optionalNumber(summary.afterMinutes, "After 시간", 100_000) ?? 0,
    beforeEdits: optionalNumber(summary.beforeEdits, "Before 수정 수", 100_000),
    afterEdits: optionalNumber(summary.afterEdits, "After 수정 수", 100_000) ?? 0,
    evidenceCount: optionalNumber(summary.evidenceCount, "근거 수", 1000) ?? 0,
    conflictCount: optionalNumber(summary.conflictCount, "충돌 수", 1000) ?? 0,
    unresolvedCount: optionalNumber(summary.unresolvedCount, "미확인 수", 1000) ?? 0,
    leaseCount: optionalNumber(summary.leaseCount, "계약 수", 5) ?? 0,
    reviewPassed: booleanValue(summary.reviewPassed, "검수 통과 여부"),
    learning: textValue(summary.learning, "배운 점", 3000),
    approvedAt: textValue(summary.approvedAt, "승인일", 40),
  };
}

export const PUBLICATION_KEYS: readonly (keyof PublicationSummary)[] = [
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
