export const EVIDENCE_STATUSES = [
  "확인됨",
  "불일치",
  "자료 없음",
  "추가 확인 필요",
  "기준일 경과",
  "판독 불가",
] as const;

export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const EXECUTION_STATUSES = [
  "승인 대기",
  "조회 미수행",
  "조회 완료",
  "조회 실패",
] as const;

export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

export const REVIEW_GATE_IDS = [
  "intake_masking",
  "cross_check",
  "output_separation",
] as const;

export type ReviewGateId = (typeof REVIEW_GATE_IDS)[number];
export type PropertyGroup =
  | "주거"
  | "상업업무"
  | "산업물류"
  | "토지"
  | "특수기타";
export type TransactionType = "매매" | "임대" | "기타";
export type RunMode = "before" | "after";
export type ExecutionMode =
  | "실제 사건 모드"
  | "비식별 샘플 테스트 모드";

export interface CaseRecord {
  caseId: string;
  executionMode: ExecutionMode;
  propertyGroup: PropertyGroup;
  propertySubtype: string;
  propertySubtypeCustom: string;
  transactionType: TransactionType;
  address: string;
  askingPrice: number | null;
  buyerPurpose: string;
  secondaryBuyerPurpose: string;
  maskedFolderId: string;
  consentDate: string;
  consentScope: string;
  status: "초안" | "검수중" | "승인" | "보류";
  createdAt: string;
  updatedAt: string;
}

export interface SourceEvidence {
  evidenceId: string;
  sourceType: string;
  sourceName: string;
  originalValue: string;
  currentValue: string;
  sourceDate: string;
  checkedAt: string;
  url: string;
  difference: string;
  status: EvidenceStatus;
  queryStatus: ExecutionStatus;
  reviewerDecision: string;
}

export interface LeaseComparison {
  leaseId: string;
  unit: string;
  ownerDeposit: number | null;
  contractDeposit: number | null;
  ownerMonthlyRent: number | null;
  contractMonthlyRent: number | null;
  ownerLeasePeriod: string;
  contractLeasePeriod: string;
  contractPageStatus: EvidenceStatus;
  difference: string;
  reviewStatus: EvidenceStatus;
}

export interface ReviewGate {
  gateId: ReviewGateId;
  label: string;
  approved: boolean;
  approvedAt: string;
  reviewer: string;
  note: string;
}

export interface TimerEntry {
  timerId: string;
  mode: RunMode;
  stage: string;
  startedAt: string;
  endedAt: string;
  activeMinutes: number;
  waitingExcluded: boolean;
  editCount: number;
  note: string;
}

export interface OutputDrafts {
  customerBriefing: string;
  internalReview: string;
  questionsToConfirm: string;
  priceAdjustmentFactors: string;
  locationEvidence: string;
  assetValueEvidence: string;
}

export interface EvidenceLogEntry {
  logId: string;
  step: string;
  summary: string;
  createdAt: string;
}

export interface CaseState {
  schemaVersion: 1;
  case: CaseRecord;
  sources: SourceEvidence[];
  leases: LeaseComparison[];
  gates: ReviewGate[];
  timers: TimerEntry[];
  outputs: OutputDrafts;
  evidenceLog: EvidenceLogEntry[];
}

export interface ValidationIssue {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface PublicationSummary {
  caseId: string;
  propertyType: string;
  workflowStatus: string;
  beforeMinutes: number;
  afterMinutes: number;
  beforeEdits: number | null;
  afterEdits: number;
  evidenceCount: number;
  conflictCount: number;
  unresolvedCount: number;
  leaseCount: number;
  reviewPassed: boolean;
  learning: string;
  approvedAt: string;
}
