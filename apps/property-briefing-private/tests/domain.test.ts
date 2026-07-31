import assert from "node:assert/strict";
import test from "node:test";

import {
  createCodexPrompt,
  createEmptyState,
  createLease,
  createPublicationSummary,
  depositAdjustedRentalYield,
  detectGuaranteePhrases,
  detectPersonalData,
  grossRentalYield,
  grossRentalYieldOnPrice,
  leaseDifference,
  leaseTotals,
  normalizeCaseState,
  qualityPass,
  suggestedLeaseStatus,
  validateGateOrder,
  validateState,
} from "../lib/domain.ts";
import {
  PUBLICATION_KEYS,
  parseCaseState,
  parsePublicationSummary,
} from "../lib/schema.ts";

test("임대차계약서 1~5건의 계약서 합계를 계산한다", () => {
  const leases = Array.from({ length: 5 }, (_, index) => ({
    ...createLease(),
    contractDeposit: (index + 1) * 10_000_000,
    contractMonthlyRent: (index + 1) * 500_000,
  }));
  assert.deepEqual(leaseTotals(leases), {
    ownerDeposit: 0,
    contractDeposit: 150_000_000,
    ownerMonthlyRent: 0,
    contractMonthlyRent: 7_500_000,
  });
});

test("설명값과 계약서의 보증금·월세·기간 불일치를 모두 탐지한다", () => {
  const lease = {
    ...createLease(),
    ownerDeposit: 10_000_000,
    contractDeposit: 20_000_000,
    ownerMonthlyRent: 800_000,
    contractMonthlyRent: 900_000,
    ownerLeasePeriod: "2026-01-01~2027-01-01",
    contractLeasePeriod: "2026-02-01~2027-02-01",
    contractPageStatus: "확인됨" as const,
  };
  assert.deepEqual(leaseDifference(lease), ["보증금", "월세", "임대차기간"]);
  assert.equal(suggestedLeaseStatus(lease), "불일치");
});

test("계약서 페이지 판독 실패와 필수값 누락을 추정하지 않는다", () => {
  const unreadable = { ...createLease(), contractPageStatus: "판독 불가" as const };
  assert.equal(suggestedLeaseStatus(unreadable), "판독 불가");
  assert.equal(suggestedLeaseStatus(createLease()), "자료 없음");
});

test("기초 임대수익률은 매도가 또는 유효 투자금이 없으면 계산하지 않는다", () => {
  assert.equal(grossRentalYield(null, 0, 1_000_000), null);
  assert.equal(grossRentalYield(100_000_000, 100_000_000, 1_000_000), null);
  assert.equal(grossRentalYield(500_000_000, 100_000_000, 2_000_000), 6);
});

test("매매가 기준과 보증금 차감 기준 임대수익률을 구분한다", () => {
  assert.equal(grossRentalYieldOnPrice(7_500_000_000, 15_250_000), 2.44);
  assert.equal(
    depositAdjustedRentalYield(7_500_000_000, 220_000_000, 15_250_000)?.toFixed(2),
    "2.51",
  );
});

test("주목적과 보조목적을 실행 프롬프트에 분리하고 기존 저장본을 보정한다", () => {
  const state = createEmptyState();
  state.case.buyerPurpose = "임대수익";
  state.case.secondaryBuyerPurpose = "자산가치";
  const prompt = createCodexPrompt(state);
  assert.match(prompt, /주요 매수 목적: 임대수익/);
  assert.match(prompt, /보조 매수 목적: 자산가치/);

  const legacy = structuredClone(state);
  delete (legacy.case as Partial<typeof legacy.case>).secondaryBuyerPurpose;
  delete (legacy.outputs as Partial<typeof legacy.outputs>).assetValueEvidence;
  const normalized = normalizeCaseState(legacy);
  assert.equal(normalized.case.secondaryBuyerPurpose, "");
  assert.equal(normalized.outputs.assetValueEvidence, "");
  assert.equal(parseCaseState(legacy).case.secondaryBuyerPurpose, "");
});

test("고객용 문구의 보장 표현과 개인정보·비공개 링크를 감지한다", () => {
  assert.ok(
    detectGuaranteePhrases(
      "권리상 안전합니다. 수익성이 확실합니다. 반드시 개발 가능합니다.",
    ).length >= 3,
  );
  assert.deepEqual(
    new Set(
      detectPersonalData(
        "010-1234-5678 test@example.com https://drive.google.com/file/d/secret",
      ),
    ),
    new Set(["휴대전화번호", "이메일", "Drive 링크"]),
  );
});

test("3단계 승인은 순서를 건너뛸 수 없다", () => {
  const state = createEmptyState();
  state.gates[1].approved = true;
  assert.equal(validateGateOrder(state.gates)[0]?.severity, "error");
});

test("허용된 케이스 형식을 파싱하고 6개 계약은 거부한다", () => {
  const state = createEmptyState();
  assert.equal(parseCaseState(state).case.caseId, state.case.caseId);
  const invalid = structuredClone(state);
  invalid.leases = Array.from({ length: 6 }, () => createLease());
  assert.throws(() => parseCaseState(invalid), /1~5건/);
});

test("최종 품질검수는 필수 동의·마스킹·결과·3단계 승인까지 요구한다", () => {
  const state = createEmptyState();
  assert.equal(qualityPass(state), false);
  state.case.maskedFolderId = "masked-folder-id";
  state.case.consentDate = "2026-07-30";
  state.case.consentScope = "비식별 자료의 브리핑 초안 작성";
  state.outputs.customerBriefing = "확인된 자료를 기준으로 작성한 조건부 초안입니다.";
  state.leases[0] = {
    ...state.leases[0],
    contractDeposit: 10_000_000,
    contractMonthlyRent: 1_000_000,
    contractLeasePeriod: "2026-01-01~2027-01-01",
    ownerDeposit: 10_000_000,
    ownerMonthlyRent: 1_000_000,
    ownerLeasePeriod: "2026-01-01~2027-01-01",
    contractPageStatus: "확인됨",
    reviewStatus: "확인됨",
  };
  state.gates.forEach((gate) => {
    gate.approved = true;
    gate.approvedAt = "2026-07-30T00:00:00.000Z";
  });
  assert.equal(validateState(state).some((issue) => issue.severity === "error"), false);
  assert.equal(qualityPass(state), true);
});

test("공개 요약은 비식별 허용목록 필드만 포함한다", () => {
  const state = createEmptyState();
  state.case.address = "서울시 비공개 주소";
  state.case.maskedFolderId = "private-folder";
  state.timers.push({
    timerId: "before-unmeasured",
    mode: "before",
    stage: "의뢰 접수",
    startedAt: "2026-07-30T00:00:00.000Z",
    endedAt: "2026-07-30T01:00:00.000Z",
    activeMinutes: 60,
    waitingExcluded: true,
    editCount: 0,
    note: "[수정 횟수 미측정]",
  });
  const summary = createPublicationSummary(state, "배운 점");
  assert.deepEqual(Object.keys(summary).sort(), [...PUBLICATION_KEYS].sort());
  assert.equal(summary.beforeEdits, null);
  assert.equal(parsePublicationSummary(summary).beforeEdits, null);
  assert.equal("address" in summary, false);
  assert.equal("maskedFolderId" in summary, false);
  assert.equal(JSON.stringify(summary).includes("서울시 비공개 주소"), false);
  assert.equal(JSON.stringify(summary).includes("private-folder"), false);
});
