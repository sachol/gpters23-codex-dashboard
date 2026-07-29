# GPTERS 23기 Codex 앱 스터디 운영본부

현직 공인중개사이자 법원경매 사업장 운영자, 공인중개사용 AI 실무 강사인 도시아재(신화)의 4주 Codex 앱 스터디 실행 공간입니다. 목표는 단순 실습 기록이 아니라, 실제 중개·경매·AI 교육 업무에 반복해서 쓰는 개인용 에이전트 시스템을 완성하고 GPTERS 사례글과 발표 자료까지 남기는 것입니다.

## 장기 목표

GPTERS 23기 Codex 앱 4주 스터디 동안 공인중개사 업무 자동화 에이전트 시스템을 계획, 실행, 검증, 확장하여 최종 사례글과 발표 자료까지 완성합니다.

## 현재 운영 구조

1. `GitHub`: 소스 코드, 문서와 변경 이력 관리
2. `Vercel`: 실행 대시보드 배포
3. `Google Apps Script`: 대시보드와 Google Sheets 사이의 안전한 저장 중계
4. `Google Sheets DB`: 주차별 진행, 자동화 후보와 리비전 이력 관리

대시보드의 체크와 메모는 브라우저에 임시 저장되며, 관리자 모드에서 `변경사항 저장`을 누르면 Google Sheets DB에 반영됩니다.

## 현재 진행 상황 (2026-07-29)

- Week 1: `6/6` 완료 - 4주 실행 대시보드 기획·제작·배포·DB 연동과 사례글 작성
- Week 2: `2/6` 진행 - 공부서류 기반 매물 브리핑 자동화를 위한 계획과 Skill·Plugin·MCP 적용 준비
- Week 3: 법원경매 사건서류 검토 보조 예정
- Week 4: 검증된 기능을 에이전트 시스템과 AI 교육 자산으로 통합 예정

## 과정 일정

- 준비 기간: 2026-07-04 ~ 2026-07-21
- 스터디 회차: 2026-07-22, 2026-07-29, 2026-08-05, 2026-08-12 수요일 21:00~23:00
- 공식 페이지 기준 전체 기간: 2026-07-20 ~ 2026-08-17
- 모집 마감: 2026-07-16 14:59

## 이번 기수 핵심 산출물

- 내 업무 자동화 주제 1개
- 기존 업무 방식과 소요 시간 기록
- Codex 앱 기능별 실습 기록
- 업무 자동화 실험 결과
- 반복 사용 가능한 작업지시서
- 개인용 업무 자동화 에이전트 시스템
- GPTERS 사례글과 발표용 요약 자료

## 추천 자동화 주제

1차 추천 주제는 `공부서류 기반 매물 브리핑 초안 자동화 에이전트`입니다.

이 주제는 신화님의 본업과 강의 활동 모두에 바로 연결됩니다. 건축물대장, 등기부, 토지이용계획, 실거래가, 현장 메모를 넣으면 Codex가 브리핑 초안, 검수 체크리스트, 고객 설명 문구, 사례글 기록까지 이어주는 시스템으로 발전시키기 좋습니다.

## Vercel 상태

- Vercel CLI 설치 완료: `55.0.0`
- 로그인 계정: `sachol`
- 실행 경로: `C:\Users\pc\AppData\Roaming\npm\vercel.cmd`
- Node.js: `24.14.0`
- Codex CLI: `0.145.0`
- GitHub 저장소: `sachol/gpters23-codex-dashboard` (`main`)
- 프로덕션: GitHub `main` 브랜치와 Vercel 연동

## 보안 및 데이터 원칙

- 관리자 비밀번호, API Secret과 Google Sheets 원본 URL은 GitHub에 커밋하지 않습니다.
- 부동산 공부서류는 개인정보를 제거한 비식별 자료만 실험에 사용합니다.
- 고객 전달 문구와 중개사 내부 검수 메모를 분리합니다.
- 건축물대장, 등기부, 토지이용계획과 실거래가 자료 간 충돌은 숨기지 않고 `확인 필요`로 표시합니다.
- AI가 만든 수치·법적 표현은 공인중개사가 원문과 교차검증합니다.

## 매일 시작 프롬프트

```text
오늘 날짜 기준으로 GPTERS 23기 Codex 앱 스터디 목표를 이어서 진행해줘.
현재 작업 폴더의 문서를 확인하고, 오늘 해야 할 30분짜리 실천 과제 1개와 기록할 내용을 제안해줘.
부동산 중개 실무 자동화 사례로 남길 수 있게 결과물, 소요 시간, 배운 점을 함께 정리해줘.
```

## 파일 안내

- `docs/course-brief.md`: 과정 내용 요약
- `docs/4week-execution-plan.md`: 4주 실행계획
- `docs/automation-candidates.md`: 자동화 후보와 추천 주제
- `docs/agent-system-spec.md`: 최종 에이전트 시스템 설계 초안
- `docs/daily-operating-routine.md`: 매일 30분 실행 루틴
- `docs/evidence-ledger.md`: 사례글에 쓸 증거 장부
- `docs/final-presentation-outline.md`: 최종 발표 구성안
- `docs/week1-readiness-checklist.md`: 1주차 준비 완료 체크리스트
- `docs/progress-tracker.md`: 전체 산출물 진행 추적표
- `docs/week1-assignment-draft.md`: 1주차 과제 제출 초안
- `docs/automation-priority-matrix.md`: 자동화 후보 우선순위 평가표
- `docs/before-after-measurement-protocol.md`: Before/After 실측 프로토콜
- `docs/pilot-run-guide.md`: 비식별 샘플 파일럿 실행 가이드
- `docs/daily-tools-guide.md`: 일일 로그와 실측표 생성 스크립트 사용법
- `docs/repeated-work-data-guide.md`: 반복 업무 5개 입력 가이드
- `docs/recommended-automation-menu.md`: 중개업무·AI 강의 준비 자동화 추천 메뉴
- `docs/benchmark-cola-dashboard.md`: 이전 기수 대시보드 벤치마킹 메모
- `docs/windows-runtime-r6016-troubleshooting.md`: PowerShell R6016 팝업 원인과 대응
- `docs/context-handoff.md`: 컨텍스트 압축 후 이어가기용 인수인계 메모
- `docs/goal-alignment-review.md`: 목표 대비 현재 정렬 상태 리뷰
- `agents/property-briefing-agent.md`: 매물 브리핑 에이전트 실행 지시서
- `templates/daily-log-template.md`: 매일 실습 기록 템플릿
- `templates/repeated-work-intake.md`: 반복 업무 후보 수집표
- `templates/property-briefing-intake.md`: 매물 브리핑 입력 체크리스트
- `templates/gpters-case-study-template.md`: GPTERS 사례글 템플릿
- `logs/2026-07-04-kickoff.md`: 킥오프 기록
- `logs/2026-07-04-daily-log.md`: 첫날 일일 실습 기록
- `output/gpters-case-study/post.md`: 최종 사례글 누적 초안
- `output/gpters-case-study/scripts/gen_images.py`: 사례글 이미지 자동 생성 스크립트
- `output/gpters-case-study/images/goal-alignment-board.png`: 목표 대비 현재 정렬 상태 이미지
- `samples/property-briefing-sample-input.md`: 비식별 샘플 매물 입력자료
- `output/property-briefing-sample/briefing-v0.md`: 샘플 브리핑 출력 예시
- `output/study-dashboard/index.html`: Vercel·Google Sheets와 연동된 4주 실행 대시보드
- `output/study-dashboard/document-center.html`: 주요 문서 HTML 문서센터
- `output/final-presentation/index.html`: 3분 발표용 HTML 슬라이드
- `output/final-presentation/speaker-notes.md`: 3분 발표 대본 초안
- `output/week1-submission/week1-assignment.md`: Week 1 과제 제출용 본문
- `output/week1-submission/README.md`: Week 1 제출 패킷 안내
- `output/week1-submission/quick-reply-template.md`: 신화님 빠른 답변 템플릿
- `output/week1-submission/repeated-work-summary.md`: 반복 업무 CSV에서 생성한 Week 1 요약
- `data/repeated-work-items.csv`: 반복 업무 5개 입력 데이터
- `scripts/New-DailyLog.ps1`: 날짜별 일일 로그 생성 스크립트
- `scripts/New-MeasurementSheet.ps1`: Before/After 실측표 생성 스크립트
- `scripts/Test-StudyReadiness.ps1`: 핵심 산출물 존재 여부 점검 스크립트
- `scripts/Test-RepeatedWorkInput.ps1`: 반복 업무 입력 상태 점검 스크립트
- `scripts/Export-RepeatedWorkSummary.ps1`: 반복 업무 CSV를 제출용 Markdown으로 변환
- `scripts/Check-SystemPressure.ps1`: PowerShell/Node 프로세스 압박 점검 스크립트
