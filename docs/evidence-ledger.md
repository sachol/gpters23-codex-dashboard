# 사례글 증거 장부

GPTERS 최종 사례글은 기억이 아니라 증거를 바탕으로 씁니다. 이 문서는 날짜별로 실제 확인한 자료, 실행한 명령, 만든 결과물, 측정한 시간을 누적하는 장부입니다.

## 증거 기록 규칙

- 실제 실행한 명령만 기록합니다.
- 웹페이지나 외부 자료는 URL과 확인일을 같이 적습니다.
- 영상은 직접 시청하지 않았다면 내용 요약을 쓰지 않습니다.
- 시간 단축 수치는 실측한 경우에만 씁니다.
- 부동산 자료는 민감정보를 공개 사례글에 넣기 전에 주소, 소유자, 연락처 등 식별정보를 비식별 처리합니다.

## 확인한 외부 자료

| 날짜 | 자료 | 확인 내용 | 출처 |
|---|---|---|---|
| 2026-07-04 | GPTERS 23기 과정 페이지 | 공식 페이지 기준 2026-07-20 시작, 2026-08-17 종료, 수요일 21:00~23:00, 스터디장 김진형 | https://www.gpters.org/ai-study-list/post/ceoeum-mannaneun-kodegseu-aebeuro-singineung-hanassig-nae-eobmue-butigi-J4whX5gz8PFnB3q |
| 2026-07-04 | 첨부 과정 소개 텍스트 | 4주 커리큘럼, 주차별 과제, 최종 산출물 확인 | `C:\Users\pc\.codex\attachments\6bc6db01-87c2-4f34-81ab-786719ebd099\pasted-text.txt` |

## 실행한 명령

| 날짜 | 명령 | 결과 |
|---|---|---|
| 2026-07-04 | `vercel --version` | Vercel CLI `54.20.1` 확인 |
| 2026-07-04 | `vercel whoami` | 로그인 계정 `sachol` 확인 |
| 2026-07-04 | `npm list -g vercel --depth=0` | 전역 설치 패키지 `vercel@54.20.1` 확인 |
| 2026-07-04 | `where.exe vercel` | 실행 경로 `C:\Users\pc\AppData\Roaming\npm\vercel.cmd` 확인 |
| 2026-07-04 | `python output\gpters-case-study\scripts\gen_images.py` | 사례글용 이미지 2장 생성 |
| 2026-07-04 | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\New-DailyLog.ps1 -Date "2026-07-05" -Focus "반복 업무 후보 5개 정리" -DryRun` | 일일 로그 생성 스크립트 Dry run 성공 |
| 2026-07-04 | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\New-MeasurementSheet.ps1 -Date "2026-07-08" -TaskName "공부서류 기반 매물 브리핑 초안 작성" -Mode before -DryRun` | 실측표 생성 스크립트 Dry run 성공 |
| 2026-07-04 | `output\study-dashboard\index.html`, `output\final-presentation\index.html` 로컬 링크 검사 | 두 HTML 파일의 로컬 링크가 모두 실제 파일로 연결됨 |
| 2026-07-04 | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-StudyReadiness.ps1` | 핵심 산출물 존재 여부 점검 통과, 남은 수동 입력 5개 확인 |
| 2026-07-04 | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-RepeatedWorkInput.ps1` | 반복 업무 입력 파일 존재 확인, 현재 입력 상태는 PENDING |
| 2026-07-04 | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Export-RepeatedWorkSummary.ps1` | `output/week1-submission/repeated-work-summary.md` 생성 |

## 만든 결과물

| 날짜 | 결과물 | 목적 |
|---|---|---|
| 2026-07-04 | 스터디 운영 문서 세트 | 4주 계획, 자동화 후보, 에이전트 설계 초안 정리 |
| 2026-07-04 | Vercel 설치 상태 기록 | 추후 배포 자동화 준비 |
| 2026-07-04 | 매일 실행 루틴과 증거 장부 | 사례글과 발표 자료에 쓸 증거 누적 |
| 2026-07-04 | 사례글 이미지 자동 생성 스크립트 | 워크플로 다이어그램과 증거 카드 재생성 |
| 2026-07-04 | Week 1 준비 완료 체크리스트 | 첫 수업 전까지 채워야 할 항목 정의 |
| 2026-07-04 | 전체 진행 추적표 | 최종 산출물별 현재 상태와 다음 행동 정리 |
| 2026-07-04 | 일일 실습 기록 | 첫날 실행 내용, 배운 점, 내일 할 일 기록 |
| 2026-07-04 | 매물 브리핑 에이전트 실행 지시서 | 필수 입력, 처리 절차, 출력 형식, 금지 표현 정의 |
| 2026-07-04 | 비식별 샘플 입력자료 | 실제 매물 없이 파일럿 실험 가능한 가상 자료 |
| 2026-07-04 | 샘플 브리핑 출력 예시 | 고객 설명 초안과 내부 검수 체크리스트 분리 테스트 |
| 2026-07-04 | Week 1 과제 제출 초안 | 첫 주 과제용 자동화 업무 설명문 작성 |
| 2026-07-04 | 스터디 운영 대시보드 | 진행 상태, 오늘 할 일, 주요 문서, 검수 리스크를 한 화면에 정리 |
| 2026-07-04 | 자동화 후보 우선순위 평가표 | 가정 기반 후보 점수표와 1차 주제 선택 이유 정리 |
| 2026-07-04 | Before/After 실측 프로토콜 | 기존 방식과 Codex 적용 방식의 단계별 시간 측정표 준비 |
| 2026-07-04 | 일일 기록 도구 | 일일 로그와 실측표 생성 PowerShell 스크립트 추가 및 Dry run 검증 |
| 2026-07-04 | 3분 발표용 HTML 슬라이드 | 최종 발표 자료의 6장짜리 초안 작성 |
| 2026-07-04 | 3분 발표 대본 초안 | 발표 시간대별 멘트와 피해야 할 표현 정리 |
| 2026-07-04 | Week 1 제출 패킷 | GPTERS Week 1 과제 제출용 본문과 안내 파일 작성 |
| 2026-07-04 | 준비 상태 점검 스크립트 | 핵심 산출물 존재 여부와 남은 수동 입력 항목을 확인 |
| 2026-07-04 | 반복 업무 입력 데이터 파일 | Week 1에 필요한 반복 업무 5개를 채우는 CSV 템플릿 작성 |
| 2026-07-04 | 반복 업무 입력 가이드 | 신화님이 채팅 또는 CSV로 답할 수 있는 양식 작성 |
| 2026-07-04 | 반복 업무 입력 점검 스크립트 | CSV 입력 완료 상태를 확인하는 스크립트 작성 |
| 2026-07-04 | 반복 업무 요약 생성 스크립트 | CSV를 Week 1 제출용 Markdown 요약으로 변환 |
| 2026-07-04 | 반복 업무 요약 파일 | 현재 CSV 상태를 반영한 PENDING 요약 생성 |
| 2026-07-04 | 목표 정렬 리뷰 | 전체 목표 대비 현재 산출물, 상태, 남은 병목을 시각 자료로 정리 |

## Before/After 측정 장부

| 날짜 | 업무 | 기존 방식 시간 | Codex 적용 시간 | 단축된 단계 | 사람 검수 단계 |
|---|---|---:|---:|---|---|
|  |  |  |  |  |  |

## 사례글에 쓸 인용 후보

> 저는 ChatGPT 답변에서 멈추지 않고, 실제 공인중개사 업무 결과물과 검수 기준까지 이어지는 흐름을 만들고 싶었습니다.

> 자동화의 핵심은 일을 통째로 맡기는 것이 아니라, 사람이 검수할 수 있는 작은 단위로 나누는 것이라는 점을 배웠습니다.
