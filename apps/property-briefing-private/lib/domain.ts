import {
  type CaseState,
  type EvidenceStatus,
  type LeaseComparison,
  type PropertyGroup,
  type PublicationSummary,
  type ReviewGate,
  type RunMode,
  type TimerEntry,
  type ValidationIssue,
} from "./types.ts";

export const PROPERTY_GROUPS: PropertyGroup[] = [
  "주거",
  "상업업무",
  "산업물류",
  "토지",
  "특수기타",
];

export const PROPERTY_SUBTYPES: Record<PropertyGroup, string[]> = {
  주거: ["아파트", "연립·다세대", "단독·다가구", "오피스텔", "기타"],
  상업업무: ["상가·빌딩", "근린생활시설", "업무시설", "지식산업센터", "기타"],
  산업물류: ["공장", "창고", "물류시설", "기타"],
  토지: ["대지", "전·답", "임야", "공장용지", "기타"],
  특수기타: ["숙박시설", "의료시설", "교육연구시설", "기타"],
};

export const BUYER_PURPOSES = [
  "임대수익",
  "자산가치",
  "직접사용",
  "개발·리모델링 검토",
  "장기보유",
  "기타",
];

export const TIMER_STAGES = [
  "의뢰 접수",
  "자료 정리·마스킹",
  "공적 자료 교차검증",
  "임대차 대조",
  "입지·상권 조사",
  "제안서 작성",
  "사람 검수·수정",
];

export const BANNED_GUARANTEE_PATTERNS = [
  /권리(?:관계|상)?[^\n]{0,12}(?:안전|문제\s*없)/g,
  /적법(?:하다|합니다|함)?/g,
  /수익(?:이|은)?\s*보장/g,
  /수익성[^\n]{0,8}(?:확실|보장)/g,
  /확실한\s*수익/g,
  /무조건\s*(?:오른다|상승|수익)/g,
  /(?:반드시|확실히|무조건)[^\n]{0,12}(?:개발|용도변경)\s*가능/g,
];

const PERSONAL_DATA_PATTERNS = [
  { label: "주민등록번호", regex: /\b\d{6}-?[1-4]\d{6}\b/g },
  { label: "휴대전화번호", regex: /\b01[016789]-?\d{3,4}-?\d{4}\b/g },
  { label: "이메일", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { label: "Drive 링크", regex: /https?:\/\/drive\.google\.com\/\S+/gi },
  { label: "Apps Script 링크", regex: /https?:\/\/script\.google\.com\/\S+/gi },
];

export function createId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${random}`;
}

export function isoNow(): string {
  return new Date().toISOString();
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createLease(): LeaseComparison {
  return {
    leaseId: createId("lease"),
    unit: "",
    ownerDeposit: null,
    contractDeposit: null,
    ownerMonthlyRent: null,
    contractMonthlyRent: null,
    ownerLeasePeriod: "",
    contractLeasePeriod: "",
    contractPageStatus: "추가 확인 필요",
    difference: "계약서 필수값 자료 없음",
    reviewStatus: "자료 없음",
  };
}

export function createReviewGates(): ReviewGate[] {
  return [
    {
      gateId: "intake_masking",
      label: "입력자료·비식별 처리 승인",
      approved: false,
      approvedAt: "",
      reviewer: "",
      note: "",
    },
    {
      gateId: "cross_check",
      label: "공적 자료·임대차 교차검증 승인",
      approved: false,
      approvedAt: "",
      reviewer: "",
      note: "",
    },
    {
      gateId: "output_separation",
      label: "고객용·내부용 분리 승인",
      approved: false,
      approvedAt: "",
      reviewer: "",
      note: "",
    },
  ];
}

export function createEmptyState(): CaseState {
  const now = isoNow();
  return {
    schemaVersion: 1,
    case: {
      caseId: createId("case"),
      propertyGroup: "상업업무",
      propertySubtype: "상가·빌딩",
      propertySubtypeCustom: "",
      transactionType: "매매",
      address: "",
      askingPrice: null,
      buyerPurpose: "임대수익",
      secondaryBuyerPurpose: "",
      maskedFolderId: "",
      consentDate: "",
      consentScope: "",
      status: "초안",
      createdAt: now,
      updatedAt: now,
    },
    sources: [],
    leases: [createLease()],
    gates: createReviewGates(),
    timers: [],
    outputs: {
      customerBriefing: "",
      internalReview: "",
      questionsToConfirm: "",
      priceAdjustmentFactors: "",
      locationEvidence: "",
      assetValueEvidence: "",
    },
    evidenceLog: [],
  };
}

export function normalizeCaseState(state: CaseState): CaseState {
  const defaults = createEmptyState();
  return {
    ...defaults,
    ...state,
    case: {
      ...defaults.case,
      ...state.case,
      secondaryBuyerPurpose: state.case.secondaryBuyerPurpose ?? "",
    },
    outputs: {
      ...defaults.outputs,
      ...state.outputs,
      assetValueEvidence: state.outputs.assetValueEvidence ?? "",
    },
  };
}

function comparableNumber(value: number | null): string {
  return value === null ? "" : String(value);
}

export function leaseDifference(lease: LeaseComparison): string[] {
  const differences: string[] = [];
  if (
    comparableNumber(lease.ownerDeposit) !==
    comparableNumber(lease.contractDeposit)
  ) {
    differences.push("보증금");
  }
  if (
    comparableNumber(lease.ownerMonthlyRent) !==
    comparableNumber(lease.contractMonthlyRent)
  ) {
    differences.push("월세");
  }
  if (lease.ownerLeasePeriod.trim() !== lease.contractLeasePeriod.trim()) {
    differences.push("임대차기간");
  }
  return differences;
}

export function suggestedLeaseStatus(
  lease: LeaseComparison,
): EvidenceStatus {
  if (lease.contractPageStatus === "판독 불가") return "판독 불가";
  if (
    lease.contractDeposit === null ||
    lease.contractMonthlyRent === null ||
    !lease.contractLeasePeriod.trim()
  ) {
    return "자료 없음";
  }
  return leaseDifference(lease).length > 0 ? "불일치" : "확인됨";
}

export function leaseTotals(leases: LeaseComparison[]) {
  return leases.reduce(
    (total, lease) => ({
      ownerDeposit: total.ownerDeposit + (lease.ownerDeposit ?? 0),
      contractDeposit: total.contractDeposit + (lease.contractDeposit ?? 0),
      ownerMonthlyRent:
        total.ownerMonthlyRent + (lease.ownerMonthlyRent ?? 0),
      contractMonthlyRent:
        total.contractMonthlyRent + (lease.contractMonthlyRent ?? 0),
    }),
    {
      ownerDeposit: 0,
      contractDeposit: 0,
      ownerMonthlyRent: 0,
      contractMonthlyRent: 0,
    },
  );
}

export function grossRentalYieldOnPrice(
  askingPrice: number | null,
  monthlyRent: number,
): number | null {
  if (askingPrice === null || askingPrice <= 0) return null;
  return (monthlyRent * 12 * 100) / askingPrice;
}

export function depositAdjustedRentalYield(
  askingPrice: number | null,
  deposit: number,
  monthlyRent: number,
): number | null {
  if (askingPrice === null || askingPrice <= 0) return null;
  const investedCapital = askingPrice - deposit;
  if (investedCapital <= 0) return null;
  return (monthlyRent * 12 * 100) / investedCapital;
}

export function grossRentalYield(
  askingPrice: number | null,
  deposit: number,
  monthlyRent: number,
): number | null {
  return depositAdjustedRentalYield(askingPrice, deposit, monthlyRent);
}

export function timerTotals(timers: TimerEntry[], mode: RunMode) {
  return timers
    .filter((entry) => entry.mode === mode)
    .reduce(
      (total, entry) => ({
        minutes: total.minutes + Math.max(0, entry.activeMinutes),
        edits: total.edits + Math.max(0, entry.editCount),
      }),
      { minutes: 0, edits: 0 },
    );
}

export function detectPersonalData(text: string): string[] {
  const matches = new Set<string>();
  for (const pattern of PERSONAL_DATA_PATTERNS) {
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(text)) matches.add(pattern.label);
  }
  return [...matches];
}

export function detectGuaranteePhrases(text: string): string[] {
  const found = new Set<string>();
  for (const pattern of BANNED_GUARANTEE_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches) matches.forEach((match) => found.add(match));
  }
  return [...found];
}

export function validateGateOrder(gates: ReviewGate[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const first = gates.find((gate) => gate.gateId === "intake_masking");
  const second = gates.find((gate) => gate.gateId === "cross_check");
  const third = gates.find((gate) => gate.gateId === "output_separation");
  if (second?.approved && !first?.approved) {
    issues.push({
      field: "gates.cross_check",
      message: "입력자료·비식별 승인보다 교차검증 승인을 먼저 할 수 없습니다.",
      severity: "error",
    });
  }
  if (third?.approved && (!first?.approved || !second?.approved)) {
    issues.push({
      field: "gates.output_separation",
      message: "앞선 두 검수 단계를 승인한 뒤 최종 분리 승인을 진행하세요.",
      severity: "error",
    });
  }
  return issues;
}

export function validateState(state: CaseState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!state.case.address.trim()) {
    issues.push({
      field: "case.address",
      message: "실제 업무용 주소를 입력하세요. 공개 요약에는 포함되지 않습니다.",
      severity: "warning",
    });
  }
  if (
    state.case.secondaryBuyerPurpose &&
    state.case.secondaryBuyerPurpose === state.case.buyerPurpose
  ) {
    issues.push({
      field: "case.secondaryBuyerPurpose",
      message: "주목적과 보조목적은 서로 다르게 선택하세요.",
      severity: "error",
    });
  }
  if (!state.case.maskedFolderId.trim()) {
    issues.push({
      field: "case.maskedFolderId",
      message: "원본이 아닌 자동화용 마스킹 폴더 ID가 필요합니다.",
      severity: "error",
    });
  }
  if (!state.case.consentDate || !state.case.consentScope.trim()) {
    issues.push({
      field: "case.consent",
      message: "자료 처리 동의일과 동의 범위를 기록하세요.",
      severity: "error",
    });
  }
  if (state.leases.length < 1 || state.leases.length > 5) {
    issues.push({
      field: "leases",
      message: "첫 파일럿은 임대차계약서 1~5건으로 제한합니다.",
      severity: "error",
    });
  }
  state.leases.forEach((lease, index) => {
    if (lease.reviewStatus !== suggestedLeaseStatus(lease)) {
      issues.push({
        field: `leases.${index}.reviewStatus`,
        message: `계약 ${index + 1}의 검수 상태와 입력값이 일치하지 않습니다.`,
        severity: "warning",
      });
    }
  });
  issues.push(...validateGateOrder(state.gates));

  const customerText = [
    state.outputs.customerBriefing,
    state.outputs.priceAdjustmentFactors,
    state.outputs.locationEvidence,
    state.outputs.assetValueEvidence,
  ].join("\n");
  for (const phrase of detectGuaranteePhrases(customerText)) {
    issues.push({
      field: "outputs.customerBriefing",
      message: `단정적 표현을 수정하세요: ${phrase}`,
      severity: "error",
    });
  }
  for (const dataType of detectPersonalData(customerText)) {
    issues.push({
      field: "outputs.customerBriefing",
      message: `고객용 결과에서 개인정보 또는 비공개 링크가 감지되었습니다: ${dataType}`,
      severity: "error",
    });
  }
  if (
    state.gates.every((gate) => gate.approved) &&
    !state.outputs.customerBriefing.trim()
  ) {
    issues.push({
      field: "outputs.customerBriefing",
      message: "최종 승인 전에 고객용 제안서 초안이 필요합니다.",
      severity: "error",
    });
  }
  return issues;
}

export function qualityPass(state: CaseState): boolean {
  return (
    state.gates.every((gate) => gate.approved) &&
    !validateState(state).some((issue) => issue.severity === "error")
  );
}

export function createPublicationSummary(
  state: CaseState,
  learning = "",
): PublicationSummary {
  const before = timerTotals(state.timers, "before");
  const after = timerTotals(state.timers, "after");
  const beforeTimers = state.timers.filter((timer) => timer.mode === "before");
  const beforeEditsMeasured =
    beforeTimers.length > 0 &&
    !beforeTimers.some((timer) =>
      timer.note.includes("[수정 횟수 미측정]"),
    );
  const conflicts = state.sources.filter(
    (source) => source.status === "불일치",
  ).length;
  const unresolved = state.sources.filter((source) =>
    ["자료 없음", "추가 확인 필요", "기준일 경과", "판독 불가"].includes(
      source.status,
    ),
  ).length;
  const approvedAt =
    state.gates.find((gate) => gate.gateId === "output_separation")
      ?.approvedAt ?? "";

  return {
    caseId: state.case.caseId,
    propertyType: `${state.case.propertyGroup} / ${
      state.case.propertySubtype === "기타"
        ? state.case.propertySubtypeCustom || "기타"
        : state.case.propertySubtype
    }`,
    workflowStatus: state.case.status,
    beforeMinutes: before.minutes,
    afterMinutes: after.minutes,
    beforeEdits: beforeEditsMeasured ? before.edits : null,
    afterEdits: after.edits,
    evidenceCount: state.sources.length,
    conflictCount: conflicts,
    unresolvedCount: unresolved,
    leaseCount: state.leases.length,
    reviewPassed: qualityPass(state),
    learning,
    approvedAt,
  };
}

export function createCodexPrompt(state: CaseState): string {
  const subtype =
    state.case.propertySubtype === "기타"
      ? state.case.propertySubtypeCustom
      : state.case.propertySubtype;
  return [
    "Use $property-briefing.",
    "",
    `case_id: ${state.case.caseId}`,
    `매물 유형: ${state.case.propertyGroup} / ${subtype}`,
    `거래 유형: ${state.case.transactionType}`,
    `주요 매수 목적: ${state.case.buyerPurpose}`,
    `보조 매수 목적: ${state.case.secondaryBuyerPurpose || "없음"}`,
    `자동화용 마스킹 Drive 폴더 ID: ${state.case.maskedFolderId}`,
    `임대차계약서 수: ${state.leases.length}`,
    "",
    "원본 Drive 폴더에는 접근하지 말고 위 마스킹 폴더의 비식별 자료만 사용하세요.",
    "건축물대장, 등기사항전부증명서, 토지이용계획, 실거래, 임대차계약서를 출처별로 교차검증하세요.",
    "충돌 시 원문 값과 최신 조회값을 병렬 표시하고 값을 덮어쓰지 마세요.",
    "확인되지 않은 항목은 자료 없음 / 추가 확인 필요 / 기준일 경과 / 불일치 / 판독 불가로 구분하세요.",
    "고객용 제안서와 공인중개사 내부 검수표를 분리하고 단정적 권리 안전성·적법성·수익 보장 표현을 쓰지 마세요.",
    "임대수익형은 검증된 임대차·수익 수치를 우선하고, 자산가치형은 공식 계획의 현재 단계와 변동 가능성을 함께 표시하세요.",
    "출처 기준일, 확인일, 공식 링크를 남기고 사람 승인 전에는 공개 또는 외부 전송하지 마세요.",
  ].join("\n");
}
