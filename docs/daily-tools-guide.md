# 일일 기록 도구 사용 가이드

## 목적

GPTERS 23기 Codex 앱 스터디를 4주 동안 이어가려면 매일 같은 방식으로 기록이 남아야 합니다. 이 가이드는 일일 로그와 Before/After 실측표를 빠르게 생성하는 PowerShell 스크립트 사용법입니다.

스크립트 본문과 자동 생성 골격은 Windows PowerShell 5 호환을 위해 영어 기반으로 작성되어 있습니다. 생성된 파일 안의 내용은 신화님 업무 기록에 맞게 한글로 채우면 됩니다.

## 일일 로그 만들기

기본 명령:

```powershell
.\scripts\New-DailyLog.ps1
```

날짜와 오늘 목표를 지정하는 명령:

```powershell
.\scripts\New-DailyLog.ps1 -Date "2026-07-05" -Focus "반복 업무 후보 5개 정리"
```

이미 같은 날짜 로그가 있으면 기본적으로 멈춥니다. 덮어쓰려면 명시적으로 `-Force`를 붙입니다.

```powershell
.\scripts\New-DailyLog.ps1 -Date "2026-07-05" -Force
```

파일을 만들지 않고 결과만 미리 보려면 `-DryRun`을 사용합니다.

```powershell
.\scripts\New-DailyLog.ps1 -Date "2026-07-05" -Focus "반복 업무 후보 5개 정리" -DryRun
```

## Before/After 실측표 만들기

기존 방식과 Codex 적용 방식을 모두 측정할 파일을 만듭니다.

```powershell
.\scripts\New-MeasurementSheet.ps1 -Date "2026-07-08" -TaskName "공부서류 기반 매물 브리핑 초안 작성" -Mode both
```

기존 방식만 먼저 측정할 때:

```powershell
.\scripts\New-MeasurementSheet.ps1 -Date "2026-07-08" -TaskName "공부서류 기반 매물 브리핑 초안 작성" -Mode before
```

Codex 적용 방식만 측정할 때:

```powershell
.\scripts\New-MeasurementSheet.ps1 -Date "2026-07-09" -TaskName "공부서류 기반 매물 브리핑 초안 작성" -Mode after
```

## 생성 위치

| 스크립트 | 생성 파일 |
|---|---|
| `scripts/New-DailyLog.ps1` | `logs/YYYY-MM-DD-daily-log.md` |
| `scripts/New-MeasurementSheet.ps1` | `measurements/YYYY-MM-DD-업무명.md` |

## 기록 후 해야 할 일

1. 생성된 일일 로그에 오늘 실행한 일과 배운 점을 채웁니다.
2. 측정표에 단계별 시작 시각, 종료 시각, 소요 시간을 적습니다.
3. `docs/evidence-ledger.md`에 중요한 산출물과 실행 명령을 기록합니다.
4. `output/gpters-case-study/post.md`에 사례글 재료가 될 문장을 옮깁니다.

## 실행 정책 오류가 날 때

Windows에서 PowerShell 실행 정책 때문에 스크립트 실행이 막히면 아래처럼 1회성 우회로 실행합니다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\New-DailyLog.ps1 -Date "2026-07-05"
```

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\New-MeasurementSheet.ps1 -Date "2026-07-08" -Mode before
```

## 검증된 명령

2026-07-04에 아래 Dry run 명령으로 실제 파일 생성 없이 스크립트 실행을 확인했습니다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\New-DailyLog.ps1 -Date "2026-07-05" -Focus "반복 업무 후보 5개 정리" -DryRun
```

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\New-MeasurementSheet.ps1 -Date "2026-07-08" -TaskName "공부서류 기반 매물 브리핑 초안 작성" -Mode before -DryRun
```
