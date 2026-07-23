# 컨텍스트 압축용 인수인계 메모

## 현재 목표

GPTERS 23기 Codex 앱 4주 스터디 동안 공인중개사 업무 자동화 에이전트 시스템을 기획, 실행, 기록하여 최종 사례글과 발표 자료까지 완성합니다.

## 현재 상태

- 핵심 운영 문서, Week 1 제출 패킷, 매물 브리핑 에이전트 지시서, 샘플 입력/출력, 대시보드, 발표 슬라이드 초안은 준비되어 있습니다.
- `scripts/Test-StudyReadiness.ps1` 점검 결과, 필수 프로젝트 파일은 모두 존재합니다.
- `scripts/Test-RepeatedWorkInput.ps1` 점검 결과, 반복 업무 입력은 아직 `0/5`입니다.
- Goal 상태는 사용량 제한 이후 이어가는 상태이며, 아직 완료가 아닙니다.
- 2026-07-22 첫 수업 후, 작은 자료 1건을 대상으로 `입력 -> Codex 내부 초안 -> 원문 검수 -> 수정된 최종본`을 만드는 첫 실험 방향을 확정했습니다.
- 집 PC에서 작성한 원본 인계 기록은 `docs/handoffs/HANDOFF-2026-07-22-gpters-codex-week1.md`에 보관합니다.

## 집·사무실 PC 간 작업 인계 규칙

1. 작업을 마친 PC에서 중요한 결정, 완료 작업, 미완료 작업, 다음 행동을 날짜별 `HANDOFF` 문서로 남깁니다.
2. 인계 문서는 `docs/handoffs/HANDOFF-YYYY-MM-DD-주제.md` 형식으로 저장합니다.
3. `docs/context-handoff.md`에는 현재 유효한 목표와 다음 행동만 유지합니다.
4. 커밋·푸시 후 다른 PC에서 `git pull`로 최신 상태를 받은 다음 Codex 대화를 시작합니다.
5. 새 대화에서는 `AGENTS.md`, `docs/context-handoff.md`, 가장 최근의 날짜별 `HANDOFF` 문서를 먼저 읽도록 요청합니다.
6. 실제 공부서류와 개인정보 자료는 Git에 올리지 않고, 비식별 자료만 `samples/`에 저장합니다.

## 1차 자동화 주제

`공부서류 기반 매물 브리핑 초안 자동화 에이전트`

이 주제를 우선 유지합니다. 실제 반복 업무 5개를 받은 뒤 최종 확정합니다.

## 주요 파일

- `README.md`: 전체 안내
- `AGENTS.md`: 프로젝트 작업 지침
- `docs/context-handoff.md`: 현재 목표와 PC 간 작업 인계 규칙
- `docs/handoffs/HANDOFF-2026-07-22-gpters-codex-week1.md`: 첫 수업 후 집 PC 작업 인계 원본
- `docs/progress-tracker.md`: 전체 진행 상태
- `docs/recommended-automation-menu.md`: 중개업무·AI 강의 준비 자동화 추천 메뉴
- `docs/benchmark-cola-dashboard.md`: 이전 기수 대시보드 벤치마킹 메모
- `docs/windows-runtime-r6016-troubleshooting.md`: PowerShell R6016 팝업 원인과 대응
- `docs/week1-readiness-checklist.md`: Week 1 준비 체크리스트
- `output/week1-submission/week1-assignment.md`: Week 1 과제 제출본
- `output/week1-submission/quick-reply-template.md`: 신화님 답변 템플릿
- `output/week1-submission/repeated-work-summary.md`: 반복 업무 CSV에서 생성한 제출용 요약
- `data/repeated-work-items.csv`: 반복 업무 5개 입력 CSV
- `agents/property-briefing-agent.md`: 매물 브리핑 에이전트 지시서
- `output/study-dashboard/index.html`: 운영 대시보드
- `output/study-dashboard/document-center.html`: 주요 문서 HTML 문서센터
- `output/final-presentation/index.html`: 3분 발표 슬라이드
- `output/gpters-case-study/post.md`: 최종 사례글 누적 초안

## 검증 명령

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-StudyReadiness.ps1
```

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-RepeatedWorkInput.ps1
```

```powershell
python output\gpters-case-study\scripts\gen_images.py
```

```powershell
.\scripts\Check-SystemPressure.ps1
```

## 다음에 할 일

1. 신화님에게 최근 반복 업무 5개와 각 업무의 소요 시간을 받습니다.
2. 받은 내용을 `data/repeated-work-items.csv`에 반영합니다.
3. `scripts/Export-RepeatedWorkSummary.ps1`를 실행해 `output/week1-submission/repeated-work-summary.md`를 갱신합니다.
4. `docs/automation-priority-matrix.md`와 `output/week1-submission/week1-assignment.md`를 실제 데이터 기준으로 수정합니다.
5. 선택 업무 1건을 기존 방식으로 실측하고 `measurements/`에 기록합니다.
6. 같은 유형 업무를 Codex 적용 방식으로 실측합니다.
7. 결과를 `output/gpters-case-study/post.md`와 `output/final-presentation/index.html`에 반영합니다.

## 압축 후 첫 확인 문장

압축 후 이어갈 때는 다음처럼 시작하면 됩니다.

```text
docs/context-handoff.md와 scripts/Test-StudyReadiness.ps1 결과를 기준으로 GPTERS 23기 Codex 앱 스터디 목표를 이어서 진행해줘.
```
