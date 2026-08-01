"use client";

import {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BUYER_PURPOSES,
  EXECUTION_MODES,
  PROPERTY_GROUPS,
  PROPERTY_SUBTYPES,
  TIMER_STAGES,
  canPersistExternally,
  createCodexPrompt,
  createEmptyState,
  createId,
  createLease,
  createPublicationSummary,
  depositAdjustedRentalYield,
  grossRentalYieldOnPrice,
  isoNow,
  leaseDifference,
  leaseTotals,
  normalizeCaseState,
  qualityPass,
  suggestedLeaseStatus,
  timerTotals,
  today,
  validateState,
} from "@/lib/domain.ts";
import {
  EVIDENCE_STATUSES,
  EXECUTION_STATUSES,
  type CaseState,
  type EvidenceStatus,
  type LeaseComparison,
  type SourceEvidence,
  type TimerEntry,
} from "@/lib/types.ts";

const STORAGE_KEY = "gpters23-property-briefing-draft-v1";
const currency = new Intl.NumberFormat("ko-KR");

interface SystemStatus {
  protectionConfirmed: boolean;
  bridgeConfigured: boolean;
}

type Notice = { kind: "success" | "error" | "info"; text: string } | null;

function money(value: number | null): string {
  return value === null ? "—" : `${currency.format(value)}원`;
}

function inputNumber(value: number | null): string {
  return value === null ? "" : String(value);
}

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatMinutes(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 1,
  }).format(Math.round(value * 10) / 10);
}

function createSource(): SourceEvidence {
  return {
    evidenceId: createId("source"),
    sourceType: "건축물대장",
    sourceName: "",
    originalValue: "",
    currentValue: "",
    sourceDate: "",
    checkedAt: today(),
    url: "",
    difference: "",
    status: "추가 확인 필요",
    queryStatus: "조회 미수행",
    reviewerDecision: "",
  };
}

function updateState(
  setter: Dispatch<SetStateAction<CaseState>>,
  updater: (draft: CaseState) => CaseState,
) {
  setter((current) => updater(structuredClone(current)));
}

export function BriefingWorkspace({
  systemStatus,
}: {
  systemStatus: SystemStatus;
}) {
  const [state, setState] = useState<CaseState>(() => createEmptyState());
  const [loadCaseId, setLoadCaseId] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const [learning, setLearning] = useState("");
  const [manualBeforeStage, setManualBeforeStage] = useState<string | null>(
    null,
  );
  const [activeTimer, setActiveTimer] = useState<{
    mode: "before" | "after";
    stage: string;
    startedAt: string;
  } | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const restored = normalizeCaseState(JSON.parse(saved) as CaseState);
        setState(restored);
        setLoadCaseId(restored.case.caseId);
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const totals = useMemo(() => leaseTotals(state.leases), [state.leases]);
  const before = useMemo(() => timerTotals(state.timers, "before"), [state.timers]);
  const after = useMemo(() => timerTotals(state.timers, "after"), [state.timers]);
  const beforeEditsUnmeasured = useMemo(
    () =>
      state.timers.some(
        (timer) =>
          timer.mode === "before" &&
          timer.note.includes("[수정 횟수 미측정]"),
      ),
    [state.timers],
  );
  const issues = useMemo(() => validateState(state), [state]);
  const passed = useMemo(() => qualityPass(state), [state]);
  const isSample =
    state.case.executionMode === "비식별 샘플 테스트 모드";
  const externalPersistenceAllowed = canPersistExternally(state);
  const canPublish = passed && externalPersistenceAllowed;
  const priceBasedYieldRate = grossRentalYieldOnPrice(
    state.case.askingPrice,
    totals.contractMonthlyRent,
  );
  const depositAdjustedYieldRate = depositAdjustedRentalYield(
    state.case.askingPrice,
    totals.contractDeposit,
    totals.contractMonthlyRent,
  );

  function changeCase(
    field: keyof CaseState["case"],
    value: string | number | null,
  ) {
    updateState(setState, (draft) => {
      Object.assign(draft.case, { [field]: value, updatedAt: isoNow() });
      if (field === "propertyGroup") {
        const group = value as CaseState["case"]["propertyGroup"];
        draft.case.propertySubtype = PROPERTY_SUBTYPES[group][0];
        draft.case.propertySubtypeCustom = "";
      }
      return draft;
    });
  }

  function changeExecutionMode(mode: CaseState["case"]["executionMode"]) {
    if (mode === state.case.executionMode) return;
    const confirmed = window.confirm(
      "실행 모드를 바꾸면 현재 브라우저 초안이 비워지고 새 케이스가 시작됩니다. 계속할까요?",
    );
    if (!confirmed) return;
    const nextState = createEmptyState(mode);
    setState(nextState);
    setLoadCaseId(nextState.case.caseId);
    setManualBeforeStage(null);
    setActiveTimer(null);
    setLearning("");
    setNotice({
      kind: "info",
      text:
        mode === "비식별 샘플 테스트 모드"
          ? "가상 샘플용 빈 케이스를 시작했습니다. 실제 사건 자료를 입력하지 마세요."
          : "실제 사건용 빈 케이스를 시작했습니다.",
    });
  }

  function addSource() {
    updateState(setState, (draft) => {
      draft.sources.push(createSource());
      return draft;
    });
  }

  function updateSource(
    index: number,
    field: keyof SourceEvidence,
    value: string,
  ) {
    updateState(setState, (draft) => {
      Object.assign(draft.sources[index], { [field]: value });
      return draft;
    });
  }

  function addLease() {
    if (state.leases.length >= 5) {
      setNotice({ kind: "error", text: "첫 파일럿은 계약서 5건까지 입력합니다." });
      return;
    }
    updateState(setState, (draft) => {
      draft.leases.push(createLease());
      return draft;
    });
  }

  function updateLease(
    index: number,
    field: keyof LeaseComparison,
    value: string | number | null,
  ) {
    updateState(setState, (draft) => {
      Object.assign(draft.leases[index], { [field]: value });
      const lease = draft.leases[index];
      const differences = leaseDifference(lease);
      lease.difference = differences.length
        ? `${differences.join(", ")} 불일치`
        : "입력값 기준 차이 없음";
      lease.reviewStatus = suggestedLeaseStatus(lease);
      return draft;
    });
  }

  function removeLease(index: number) {
    if (state.leases.length === 1) return;
    updateState(setState, (draft) => {
      draft.leases.splice(index, 1);
      return draft;
    });
  }

  function toggleGate(index: number, approved: boolean) {
    const previousApproved = state.gates
      .slice(0, index)
      .every((gate) => gate.approved);
    if (approved && !previousApproved) {
      setNotice({
        kind: "error",
        text: "앞선 검수 단계를 먼저 승인해야 합니다.",
      });
      return;
    }
    updateState(setState, (draft) => {
      const gate = draft.gates[index];
      gate.approved = approved;
      gate.approvedAt = approved ? isoNow() : "";
      if (!approved) {
        draft.gates.slice(index + 1).forEach((next) => {
          next.approved = false;
          next.approvedAt = "";
        });
      }
      return draft;
    });
  }

  function startTimer(mode: "before" | "after", stage: string) {
    if (activeTimer) {
      setNotice({ kind: "error", text: "실행 중인 타이머를 먼저 종료하세요." });
      return;
    }
    setActiveTimer({ mode, stage, startedAt: isoNow() });
    setNotice({ kind: "info", text: `${stage} 활동시간 측정을 시작했습니다.` });
  }

  function stopTimer(editCount: number, note: string) {
    if (!activeTimer) return;
    const endedAt = isoNow();
    const elapsed =
      (new Date(endedAt).getTime() -
        new Date(activeTimer.startedAt).getTime()) /
      60_000;
    const entry: TimerEntry = {
      timerId: createId("timer"),
      ...activeTimer,
      endedAt,
      activeMinutes: Math.max(0.1, Math.round(elapsed * 10) / 10),
      waitingExcluded: true,
      editCount,
      note,
    };
    updateState(setState, (draft) => {
      draft.timers.push(entry);
      return draft;
    });
    setActiveTimer(null);
    setNotice({ kind: "success", text: "활동시간을 기록했습니다." });
  }

  function recordManualBefore(
    minutes: number,
    editCount: number | null,
    basis: "실측" | "추정",
    note: string,
  ) {
    if (!manualBeforeStage) return;
    const recordedAt = isoNow();
    const entry: TimerEntry = {
      timerId: createId("timer"),
      mode: "before",
      stage: manualBeforeStage,
      startedAt: recordedAt,
      endedAt: recordedAt,
      activeMinutes: Math.max(1, Math.round(minutes)),
      waitingExcluded: true,
      editCount:
        editCount === null ? 0 : Math.max(0, Math.round(editCount)),
      note: [
        `[${basis} 직접입력]`,
        editCount === null ? "[수정 횟수 미측정]" : "",
        note,
      ]
        .filter(Boolean)
        .join(" "),
    };
    updateState(setState, (draft) => {
      draft.timers.push(entry);
      return draft;
    });
    setManualBeforeStage(null);
    setNotice({
      kind: "success",
      text: `Before · ${entry.stage} ${entry.activeMinutes}분을 기록했습니다.`,
    });
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(createCodexPrompt(state));
    updateState(setState, (draft) => {
      draft.evidenceLog.push({
        logId: createId("log"),
        step: "Codex 실행 준비",
        summary: "마스킹 폴더와 검수 원칙을 포함한 실행 프롬프트를 복사함",
        createdAt: isoNow(),
      });
      return draft;
    });
    setNotice({ kind: "success", text: "Codex 실행 프롬프트를 복사했습니다." });
  }

  async function saveCase() {
    if (!externalPersistenceAllowed) {
      setNotice({
        kind: "error",
        text: "샘플 테스트는 비공개 DB에 저장하지 않습니다.",
      });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/cases", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(state),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "저장 실패");
      setNotice({ kind: "success", text: "비공개 Sheet DB에 저장했습니다." });
    } catch (error) {
      setNotice({
        kind: "error",
        text: `미저장 상태입니다. ${
          error instanceof Error ? error.message : "다시 시도하세요."
        }`,
      });
    } finally {
      setBusy(false);
    }
  }

  async function loadCase() {
    const requestedCaseId = loadCaseId.trim();
    if (!requestedCaseId) {
      setNotice({ kind: "error", text: "불러올 케이스 ID를 입력하세요." });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        `/api/cases?caseId=${encodeURIComponent(requestedCaseId)}`,
      );
      const result = (await response.json()) as {
        ok: boolean;
        data?: CaseState;
        error?: string;
      };
      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.error || "불러오기 실패");
      }
      const loaded = normalizeCaseState(result.data);
      setState(loaded);
      setLoadCaseId(loaded.case.caseId);
      setNotice({ kind: "success", text: "저장된 케이스를 불러왔습니다." });
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "불러오기 실패",
      });
    } finally {
      setBusy(false);
    }
  }

  async function publishSummary() {
    if (!externalPersistenceAllowed) {
      setNotice({
        kind: "error",
        text: "가상 샘플은 공개 요약으로 전송할 수 없습니다.",
      });
      return;
    }
    const summary = createPublicationSummary(state, learning);
    setBusy(true);
    try {
      const response = await fetch("/api/publication", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(summary),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "공개 실패");
      setNotice({
        kind: "success",
        text: "승인된 비식별 요약만 공개 보드용 DB에 기록했습니다.",
      });
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "공개 요약 저장 실패",
      });
    } finally {
      setBusy(false);
    }
  }

  function resetDraft() {
    sessionStorage.removeItem(STORAGE_KEY);
    setState(createEmptyState());
    setLoadCaseId("");
    setManualBeforeStage(null);
    setActiveTimer(null);
    setLearning("");
    setNotice({ kind: "info", text: "브라우저 임시 초안을 초기화했습니다." });
  }

  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">GPTERS 23기 · Week 2 · 비공개 업무 시스템</p>
          <h1>공적 근거 기반 매물 브리핑</h1>
          <p className="lede">
            의뢰인 설명과 공부서류·임대차계약서·최신 공식 근거를 병렬
            대조하고, 사람 승인 후 고객용 자료와 내부 검수표를 분리합니다.
          </p>
        </div>
        <div className="system-card no-print">
          <StatusLine
            ok={systemStatus.protectionConfirmed}
            label="배포 접근 보호"
            pending="배포 전 확인 필요"
          />
          <StatusLine
            ok={systemStatus.bridgeConfigured}
            label="비공개 Sheet 연결"
            pending="환경변수 미설정"
          />
          <p>브라우저 임시 초안은 현재 탭의 sessionStorage에만 남습니다.</p>
        </div>
      </header>

      {notice && <div className={`notice ${notice.kind}`}>{notice.text}</div>}
      {isSample && (
        <div className="sample-warning" role="alert">
          가상 샘플·미검증·고객 제공 금지
        </div>
      )}

      <nav className="step-nav no-print" aria-label="업무 단계">
        {[
          "1 입력·마스킹",
          "2 공적자료 대조",
          "3 임대차 검수",
          "4 결과 분리",
          "5 승인·기록",
        ].map((label) => (
          <a key={label} href={`#step-${label[0]}`}>
            {label}
          </a>
        ))}
      </nav>

      <section className="panel" id="step-1">
        <SectionHeading
          step="01"
          title="케이스와 비식별 입력"
          description="원본 폴더가 아닌 automation-masked 폴더만 연결합니다."
        />
        <div className="form-grid">
          <Field label="실행 모드">
            <select
              value={state.case.executionMode}
              onChange={(event) =>
                changeExecutionMode(
                  event.target.value as CaseState["case"]["executionMode"],
                )
              }
            >
              {EXECUTION_MODES.map((mode) => (
                <option key={mode}>{mode}</option>
              ))}
            </select>
          </Field>
          <Field label="케이스 ID">
            <input value={state.case.caseId} readOnly />
          </Field>
          <Field label="불러올 케이스 ID">
            <input
              value={loadCaseId}
              placeholder="예: GPTERS23-W2-PILOT-001"
              onChange={(event) => setLoadCaseId(event.target.value)}
            />
          </Field>
          <Field label="대분류">
            <select
              value={state.case.propertyGroup}
              onChange={(event) => changeCase("propertyGroup", event.target.value)}
            >
              {PROPERTY_GROUPS.map((group) => (
                <option key={group}>{group}</option>
              ))}
            </select>
          </Field>
          <Field label="세부유형">
            <select
              value={state.case.propertySubtype}
              onChange={(event) => changeCase("propertySubtype", event.target.value)}
            >
              {PROPERTY_SUBTYPES[state.case.propertyGroup].map((subtype) => (
                <option key={subtype}>{subtype}</option>
              ))}
            </select>
          </Field>
          {state.case.propertySubtype === "기타" && (
            <Field label="세부유형 직접입력">
              <input
                value={state.case.propertySubtypeCustom}
                onChange={(event) =>
                  changeCase("propertySubtypeCustom", event.target.value)
                }
              />
            </Field>
          )}
          <Field label="거래 유형">
            <select
              value={state.case.transactionType}
              onChange={(event) => changeCase("transactionType", event.target.value)}
            >
              <option>매매</option>
              <option>임대</option>
              <option>기타</option>
            </select>
          </Field>
          <Field label="주요 매수 목적">
            <select
              value={state.case.buyerPurpose}
              onChange={(event) => changeCase("buyerPurpose", event.target.value)}
            >
              {BUYER_PURPOSES.map((purpose) => (
                <option key={purpose}>{purpose}</option>
              ))}
            </select>
          </Field>
          <Field label="보조 매수 목적">
            <select
              value={state.case.secondaryBuyerPurpose}
              onChange={(event) =>
                changeCase("secondaryBuyerPurpose", event.target.value)
              }
            >
              <option value="">없음</option>
              {BUYER_PURPOSES.filter(
                (purpose) => purpose !== state.case.buyerPurpose,
              ).map((purpose) => (
                <option key={purpose}>{purpose}</option>
              ))}
            </select>
          </Field>
          <Field label="주소 (비공개)">
            <input
              value={state.case.address}
              onChange={(event) => changeCase("address", event.target.value)}
              placeholder="실제 업무 화면에서만 사용"
            />
          </Field>
          <Field label="매도가 (원)">
            <input
              inputMode="numeric"
              value={inputNumber(state.case.askingPrice)}
              onChange={(event) =>
                changeCase("askingPrice", parseNumber(event.target.value))
              }
            />
          </Field>
          <Field label="마스킹 폴더 ID">
            <input
              value={state.case.maskedFolderId}
              onChange={(event) => changeCase("maskedFolderId", event.target.value)}
              placeholder="원본 폴더 ID 입력 금지"
            />
          </Field>
          <Field label="자료 처리 동의일">
            <input
              type="date"
              value={state.case.consentDate}
              onChange={(event) => changeCase("consentDate", event.target.value)}
            />
          </Field>
          <Field label="동의 범위" wide>
            <textarea
              value={state.case.consentScope}
              onChange={(event) => changeCase("consentScope", event.target.value)}
              placeholder="예: 비식별 자료를 매물 검토 초안 작성 목적으로 처리"
            />
          </Field>
        </div>
        <div className="actions no-print">
          <button type="button" className="primary" onClick={copyPrompt}>
            Codex 실행 프롬프트 복사
          </button>
          <button
            type="button"
            onClick={saveCase}
            disabled={busy || !externalPersistenceAllowed}
            title={
              isSample
                ? "샘플 테스트는 비공개 DB에 저장하지 않습니다."
                : undefined
            }
          >
            비공개 DB 저장
          </button>
          <button
            type="button"
            onClick={loadCase}
            disabled={busy || !loadCaseId.trim()}
          >
            저장본 불러오기
          </button>
        </div>
      </section>

      <section className="panel" id="step-2">
        <SectionHeading
          step="02"
          title="공적 자료·설명값 대조"
          description="충돌 값을 덮어쓰지 않고 원문·최신값·판단을 나란히 남깁니다."
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>자료</th>
                <th>원문 값</th>
                <th>최신 조회값</th>
                <th>기준일 / 확인일</th>
                <th>상태</th>
                <th>차이·대표님 판단</th>
                <th className="no-print">관리</th>
              </tr>
            </thead>
            <tbody>
              {state.sources.map((source, index) => (
                <tr key={source.evidenceId}>
                  <td>
                    <select
                      value={source.sourceType}
                      onChange={(event) =>
                        updateSource(index, "sourceType", event.target.value)
                      }
                    >
                      {[
                        "건축물대장",
                        "등기사항전부증명서",
                        "토지이용계획",
                        "실거래",
                        "임대차계약서",
                        "입지·상권·교통",
                        "법령",
                        "기타",
                      ].map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                    <input
                      value={source.sourceName}
                      onChange={(event) =>
                        updateSource(index, "sourceName", event.target.value)
                      }
                      placeholder="자료명"
                    />
                    <input
                      value={source.url}
                      onChange={(event) =>
                        updateSource(index, "url", event.target.value)
                      }
                      placeholder="공식 URL 또는 원문 식별자"
                    />
                  </td>
                  <td>
                    <textarea
                      value={source.originalValue}
                      onChange={(event) =>
                        updateSource(index, "originalValue", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <textarea
                      value={source.currentValue}
                      onChange={(event) =>
                        updateSource(index, "currentValue", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={source.sourceDate}
                      onChange={(event) =>
                        updateSource(index, "sourceDate", event.target.value)
                      }
                    />
                    <input
                      type="date"
                      value={source.checkedAt}
                      onChange={(event) =>
                        updateSource(index, "checkedAt", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={source.status}
                      onChange={(event) =>
                        updateSource(index, "status", event.target.value)
                      }
                    >
                      {EVIDENCE_STATUSES.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                    <select
                      value={source.queryStatus}
                      aria-label="조회 실행 상태"
                      onChange={(event) =>
                        updateSource(index, "queryStatus", event.target.value)
                      }
                    >
                      {EXECUTION_STATUSES.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <textarea
                      value={source.difference}
                      onChange={(event) =>
                        updateSource(index, "difference", event.target.value)
                      }
                      placeholder="차이"
                    />
                    <textarea
                      value={source.reviewerDecision}
                      onChange={(event) =>
                        updateSource(index, "reviewerDecision", event.target.value)
                      }
                      placeholder="대표님 판단"
                    />
                  </td>
                  <td className="no-print">
                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        updateState(setState, (draft) => {
                          draft.sources.splice(index, 1);
                          return draft;
                        })
                      }
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className="no-print" onClick={addSource}>
          + 근거 자료 추가
        </button>
      </section>

      <section className="panel" id="step-3">
        <SectionHeading
          step="03"
          title="임대차계약서 대조"
          description="의뢰인 설명과 계약서의 보증금·월세·기간을 계약별로 비교합니다."
        />
        <div className="lease-grid">
          {state.leases.map((lease, index) => (
            <article className="lease-card" key={lease.leaseId}>
              <div className="card-title">
                <h3>계약 {index + 1}</h3>
                {state.leases.length > 1 && (
                  <button
                    type="button"
                    className="danger no-print"
                    onClick={() => removeLease(index)}
                  >
                    삭제
                  </button>
                )}
              </div>
              <Field label="층·호">
                <input
                  value={lease.unit}
                  onChange={(event) => updateLease(index, "unit", event.target.value)}
                />
              </Field>
              <div className="comparison-grid">
                <strong>의뢰인 설명</strong>
                <strong>계약서</strong>
                <MoneyField
                  label="보증금"
                  value={lease.ownerDeposit}
                  onChange={(value) => updateLease(index, "ownerDeposit", value)}
                />
                <MoneyField
                  label="보증금"
                  value={lease.contractDeposit}
                  onChange={(value) => updateLease(index, "contractDeposit", value)}
                />
                <MoneyField
                  label="월세"
                  value={lease.ownerMonthlyRent}
                  onChange={(value) => updateLease(index, "ownerMonthlyRent", value)}
                />
                <MoneyField
                  label="월세"
                  value={lease.contractMonthlyRent}
                  onChange={(value) =>
                    updateLease(index, "contractMonthlyRent", value)
                  }
                />
                <Field label="임대차기간">
                  <input
                    value={lease.ownerLeasePeriod}
                    onChange={(event) =>
                      updateLease(index, "ownerLeasePeriod", event.target.value)
                    }
                  />
                </Field>
                <Field label="임대차기간">
                  <input
                    value={lease.contractLeasePeriod}
                    onChange={(event) =>
                      updateLease(index, "contractLeasePeriod", event.target.value)
                    }
                  />
                </Field>
              </div>
              <div className="status-row">
                <Field label="계약서 판독 상태">
                  <select
                    value={lease.contractPageStatus}
                    onChange={(event) =>
                      updateLease(
                        index,
                        "contractPageStatus",
                        event.target.value as EvidenceStatus,
                      )
                    }
                  >
                    {EVIDENCE_STATUSES.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </Field>
                <div>
                  <span className={`badge status-${lease.reviewStatus}`}>
                    {lease.reviewStatus}
                  </span>
                  <p>{lease.difference || "대조값 입력 전"}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <button type="button" className="no-print" onClick={addLease}>
          + 계약 추가 ({state.leases.length}/5)
        </button>
        <div className="metric-grid">
          <Metric label="계약서 보증금 합계" value={money(totals.contractDeposit)} />
          <Metric
            label="계약서 월세 합계"
            value={`${money(totals.contractMonthlyRent)} / 월`}
          />
          <Metric
            label="매매가 기준 단순 임대수익률"
            value={
              priceBasedYieldRate === null
                ? "계산 불가"
                : `${priceBasedYieldRate.toFixed(2)}%`
            }
            note="(월세×12) ÷ 매도가, 비용·공실·세금 제외"
          />
          <Metric
            label="보증금 차감 투자금 기준"
            value={
              depositAdjustedYieldRate === null
                ? "계산 불가"
                : `${depositAdjustedYieldRate.toFixed(2)}%`
            }
            note="(월세×12) ÷ (매도가-보증금), 비용·공실·세금 제외"
          />
        </div>
      </section>

      <section className="panel output-panel" id="step-4">
        <SectionHeading
          step="04"
          title="고객용 결과와 내부 검수 분리"
          description="인쇄 시 내부 메모·비공개 자료·조작 버튼은 제외됩니다."
        />
        <div className="print-only print-heading">
          <p>공적 근거 기반 매물 브리핑</p>
          <h1>매수 목적별 매물 제안서</h1>
          <span>
            공적 자료와 임대차 현황을 대조하여 작성한 검토용 자료입니다.
          </span>
        </div>
        {isSample && (
          <div className="sample-warning">
            가상 샘플·미검증·고객 제공 금지
          </div>
        )}
        <div className="purpose-profile">
          <div>
            <span>주목적</span>
            <strong>{state.case.buyerPurpose}</strong>
          </div>
          <div>
            <span>보조목적</span>
            <strong>{state.case.secondaryBuyerPurpose || "없음"}</strong>
          </div>
          <p>
            목적별 근거를 분리해 작성하고, 계획 단계의 개발·교통 정보는
            가치상승을 보장하는 문구로 사용하지 않습니다.
          </p>
        </div>
        <div className="output-grid">
          <article className="customer-output">
            <p className="output-label">고객용</p>
            <div className="screen-only">
              <Field label="매수 목적별 제안서">
                <textarea
                  className="long-text"
                  value={state.outputs.customerBriefing}
                  onChange={(event) =>
                    updateState(setState, (draft) => {
                      draft.outputs.customerBriefing = event.target.value;
                      return draft;
                    })
                  }
                />
              </Field>
              <Field label="최신 입지·상권·교통·개발 근거">
                <textarea
                  value={state.outputs.locationEvidence}
                  onChange={(event) =>
                    updateState(setState, (draft) => {
                      draft.outputs.locationEvidence = event.target.value;
                      return draft;
                    })
                  }
                />
              </Field>
              <Field label="자산가치 검토 근거·사업 단계">
                <textarea
                  value={state.outputs.assetValueEvidence}
                  onChange={(event) =>
                    updateState(setState, (draft) => {
                      draft.outputs.assetValueEvidence = event.target.value;
                      return draft;
                    })
                  }
                  placeholder="현재 확인 / 계획 반영 / 추진 중 / 추가 확인 필요로 구분"
                />
              </Field>
              <Field label="가격 조정 요인">
                <textarea
                  value={state.outputs.priceAdjustmentFactors}
                  onChange={(event) =>
                    updateState(setState, (draft) => {
                      draft.outputs.priceAdjustmentFactors = event.target.value;
                      return draft;
                    })
                  }
                />
              </Field>
            </div>
            <div className="print-only customer-print-document">
              <PrintField
                label="매수 목적별 제안서"
                value={state.outputs.customerBriefing}
              />
              <PrintField
                label="최신 입지·상권·교통·개발 근거"
                value={state.outputs.locationEvidence}
              />
              <PrintField
                label="자산가치 검토 근거·사업 단계"
                value={state.outputs.assetValueEvidence}
              />
              <PrintField
                label="가격 조정 요인"
                value={state.outputs.priceAdjustmentFactors}
              />
            </div>
          </article>
          <article className="internal-only">
            <p className="output-label">공인중개사 내부용</p>
            <Field label="내부 검수표">
              <textarea
                className="long-text"
                value={state.outputs.internalReview}
                onChange={(event) =>
                  updateState(setState, (draft) => {
                    draft.outputs.internalReview = event.target.value;
                    return draft;
                  })
                }
              />
            </Field>
            <Field label="의뢰인에게 추가 확인할 질문">
              <textarea
                value={state.outputs.questionsToConfirm}
                onChange={(event) =>
                  updateState(setState, (draft) => {
                    draft.outputs.questionsToConfirm = event.target.value;
                    return draft;
                  })
                }
              />
            </Field>
          </article>
        </div>
        <div className="actions no-print">
          <button
            type="button"
            onClick={() => window.print()}
            disabled={isSample}
            title={
              isSample
                ? "가상 샘플은 고객용 인쇄·PDF 저장을 할 수 없습니다."
                : undefined
            }
          >
            고객용 화면 인쇄 / PDF 저장
          </button>
        </div>
      </section>

      <section className="panel no-print" id="step-5">
        <SectionHeading
          step="05"
          title="Before / After 실측과 3단계 승인"
          description="고객 회신 대기시간은 제외하고 실제 활동시간과 수정 횟수를 기록합니다."
        />
        <div className="timer-columns">
          {(["before", "after"] as const).map((mode) => (
            <div key={mode} className="timer-column">
              <h3>{mode === "before" ? "Before · 기존 수작업" : "After · Codex 방식"}</h3>
              <p className="timer-total">
                {formatMinutes(
                  mode === "before" ? before.minutes : after.minutes,
                )}
                분 ·{" "}
                {mode === "before" && beforeEditsUnmeasured
                  ? "수정 횟수 미측정"
                  : `수정 ${mode === "before" ? before.edits : after.edits}회`}
              </p>
              {TIMER_STAGES.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  disabled={Boolean(activeTimer || manualBeforeStage)}
                  onClick={() =>
                    mode === "before"
                      ? setManualBeforeStage(stage)
                      : startTimer(mode, stage)
                  }
                >
                  {stage} {mode === "before" ? "시간 입력" : "시작"}
                </button>
              ))}
            </div>
          ))}
        </div>
        {manualBeforeStage && (
          <ManualBeforeEntry
            stage={manualBeforeStage}
            onCancel={() => setManualBeforeStage(null)}
            onSave={recordManualBefore}
          />
        )}
        {activeTimer && (
          <TimerStopper timer={activeTimer} onStop={stopTimer} />
        )}

        <div className="gate-list">
          {state.gates.map((gate, index) => (
            <article key={gate.gateId} className={gate.approved ? "approved" : ""}>
              <div>
                <span className="gate-number">{index + 1}</span>
                <strong>{gate.label}</strong>
              </div>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={gate.approved}
                  disabled={
                    !state.gates
                      .slice(0, index)
                      .every((previous) => previous.approved)
                  }
                  onChange={(event) => toggleGate(index, event.target.checked)}
                />
                승인
              </label>
              <input
                placeholder="검수자"
                value={gate.reviewer}
                onChange={(event) =>
                  updateState(setState, (draft) => {
                    draft.gates[index].reviewer = event.target.value;
                    return draft;
                  })
                }
              />
              <input
                placeholder="승인 메모"
                value={gate.note}
                onChange={(event) =>
                  updateState(setState, (draft) => {
                    draft.gates[index].note = event.target.value;
                    return draft;
                  })
                }
              />
            </article>
          ))}
        </div>

        <div className="validation-box">
          <div>
            <p className="eyebrow">완료 조건 자동 점검</p>
            <h3>
              {isSample
                ? "샘플 테스트 · 공개 불가"
                : passed
                  ? "공개 요약 생성 가능"
                  : "검수 진행 중"}
            </h3>
          </div>
          <ul>
            {issues.length === 0 ? (
              <li>자동 점검에서 발견된 항목이 없습니다.</li>
            ) : (
              issues.map((issue, index) => (
                <li key={`${issue.field}-${index}`} className={issue.severity}>
                  {issue.message}
                </li>
              ))
            )}
          </ul>
        </div>
        <Field label="비식별 사례 공개용 배운 점">
          <textarea
            value={learning}
            onChange={(event) => setLearning(event.target.value)}
          />
        </Field>
        <div className="actions">
          <button
            type="button"
            className="primary"
            onClick={publishSummary}
            disabled={!canPublish || busy}
            title={
              isSample ? "가상 샘플은 공개 요약으로 전송할 수 없습니다." : undefined
            }
          >
            승인된 비식별 요약 공개
          </button>
          <button type="button" onClick={resetDraft}>
            새 케이스 시작
          </button>
          {process.env.NEXT_PUBLIC_PUBLIC_DASHBOARD_URL && (
            <a
              className="button-link"
              href={process.env.NEXT_PUBLIC_PUBLIC_DASHBOARD_URL}
              target="_blank"
              rel="noreferrer"
            >
              공개 실용보드 보기
            </a>
          )}
        </div>
      </section>

      <footer>
        <p>
          이 도구는 확인 가능한 근거와 사람의 검수를 구조화합니다. 권리 안전성,
          적법성 또는 투자수익을 보장하지 않습니다.
        </p>
      </footer>
    </main>
  );
}

function StatusLine({
  ok,
  label,
  pending,
}: {
  ok: boolean;
  label: string;
  pending: string;
}) {
  return (
    <div className="status-line">
      <span className={ok ? "dot ok" : "dot"} />
      <strong>{label}</strong>
      <span>{ok ? "확인" : pending}</span>
    </div>
  );
}

function SectionHeading({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="section-heading">
      <span>{step}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function PrintField({ label, value }: { label: string; value: string }) {
  return (
    <section className="print-field">
      <h2>{label}</h2>
      <div>{value.trim() || "자료 없음"}</div>
    </section>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <Field label={`${label} (원)`}>
      <input
        inputMode="numeric"
        value={inputNumber(value)}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(parseNumber(event.target.value))
        }
      />
    </Field>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}

function TimerStopper({
  timer,
  onStop,
}: {
  timer: { mode: "before" | "after"; stage: string; startedAt: string };
  onStop: (editCount: number, note: string) => void;
}) {
  const [edits, setEdits] = useState(0);
  const [note, setNote] = useState("");
  return (
    <div className="timer-active">
      <div>
        <span className="pulse" />
        <strong>
          {timer.mode === "before" ? "Before" : "After"} · {timer.stage} 측정 중
        </strong>
      </div>
      <input
        type="number"
        min="0"
        value={edits}
        onChange={(event) => setEdits(Math.max(0, Number(event.target.value)))}
        aria-label="수정 횟수"
      />
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="대기시간 제외·특이사항"
      />
      <button type="button" className="primary" onClick={() => onStop(edits, note)}>
        종료·기록
      </button>
    </div>
  );
}

function ManualBeforeEntry({
  stage,
  onCancel,
  onSave,
}: {
  stage: string;
  onCancel: () => void;
  onSave: (
    minutes: number,
    editCount: number | null,
    basis: "실측" | "추정",
    note: string,
  ) => void;
}) {
  const [minutes, setMinutes] = useState("");
  const [edits, setEdits] = useState("");
  const [basis, setBasis] = useState<"실측" | "추정">("실측");
  const [note, setNote] = useState("");
  const parsedMinutes = Number(minutes);
  const parsedEdits = Number(edits);
  const editsValid =
    edits.trim() === "" ||
    (Number.isFinite(parsedEdits) && parsedEdits >= 0);
  const canSave =
    minutes.trim() !== "" &&
    Number.isFinite(parsedMinutes) &&
    parsedMinutes >= 1 &&
    editsValid;
  return (
    <div className="timer-active">
      <div>
        <strong>Before · {stage} 직접 입력</strong>
      </div>
      <label className="field">
        <span>소요시간 (분)</span>
        <input
          type="number"
          min="1"
          step="1"
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
          placeholder="예: 30"
        />
      </label>
      <label className="field">
        <span>수정 횟수 (회, 선택)</span>
        <input
          type="number"
          min="0"
          step="1"
          value={edits}
          onChange={(event) => setEdits(event.target.value)}
          placeholder="비워두면 미측정"
        />
      </label>
      <label className="field">
        <span>측정 근거</span>
        <select
          value={basis}
          onChange={(event) => setBasis(event.target.value as "실측" | "추정")}
        >
          <option value="실측">실측</option>
          <option value="추정">추정</option>
        </select>
      </label>
      <label className="field">
        <span>메모 (선택)</span>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="업무 범위·대기시간 제외·특이사항"
        />
      </label>
      <button
        type="button"
        className="primary"
        disabled={!canSave}
        onClick={() =>
          onSave(
            Math.round(parsedMinutes),
            edits.trim() === "" ? null : Math.round(parsedEdits),
            basis,
            note,
          )
        }
      >
        입력·기록
      </button>
      <button type="button" onClick={onCancel}>
        취소
      </button>
    </div>
  );
}
