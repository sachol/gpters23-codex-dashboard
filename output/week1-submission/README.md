# Week 1 제출 패킷

## 파일 구성

| 파일 | 용도 |
|---|---|
| `week1-assignment.md` | GPTERS Week 1 과제 제출용 본문 |
| `../../docs/automation-priority-matrix.md` | 자동화 후보 비교 근거 |
| `../../docs/before-after-measurement-protocol.md` | 기존 방식과 Codex 적용 방식 시간 측정표 |
| `../../agents/property-briefing-agent.md` | 매물 브리핑 자동화 에이전트 지시서 |
| `../../output/property-briefing-sample/briefing-v0.md` | 비식별 샘플 브리핑 출력 예시 |
| `quick-reply-template.md` | 신화님이 반복 업무 5개를 빠르게 답할 수 있는 양식 |
| `repeated-work-summary.md` | 반복 업무 CSV에서 자동 생성한 제출용 요약 |
| `../../data/repeated-work-items.csv` | 반복 업무 5개 입력 데이터 |

## 아직 채워야 할 실제 데이터

- 최근 반복 업무 5개
- 업무별 대략 또는 실측 소요 시간
- 실제 매물 브리핑 1건의 기존 방식 처리 시간
- Codex 적용 후 처리 시간

## 입력 상태 확인

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ..\..\scripts\Test-RepeatedWorkInput.ps1
```

## 반복 업무 요약 생성

`data/repeated-work-items.csv`를 채운 뒤 아래 명령을 실행하면 `repeated-work-summary.md`가 갱신됩니다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ..\..\scripts\Export-RepeatedWorkSummary.ps1
```

## 제출 전 확인

- 실측 전 수치를 추정값처럼 쓰지 않습니다.
- 공개 가능한 사례만 사용하고 실제 주소, 소유자, 연락처는 비식별 처리합니다.
- 법적 판단, 권리관계, 수익성은 단정하지 않습니다.
