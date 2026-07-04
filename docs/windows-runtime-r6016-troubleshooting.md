# Windows PowerShell R6016 팝업 원인과 대응

## 증상

작업 중 다음과 같은 팝업이 뜰 수 있습니다.

```text
Microsoft Visual C++ Runtime Library
Runtime Error!
Program: C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
R6016
- not enough space for thread data
```

## 현재 판단

이 오류는 대시보드 HTML 오류가 아니라, Windows에서 `powershell.exe` 프로세스가 새 스레드에 필요한 런타임 공간을 확보하지 못할 때 발생하는 시스템 런타임 오류입니다.

현재 작업 환경에서 가능성이 높은 원인은 다음 조합입니다.

1. Codex 앱, MCP, 플러그인, Vercel 관련 `node.exe` 백그라운드 프로세스가 많이 떠 있음
2. 짧은 시간에 여러 PowerShell 명령이 반복 실행됨
3. 일부 명령에서 `powershell.exe` 안에서 다시 `powershell.exe`를 호출하는 중첩 실행이 있었음
4. PowerShell 프로필 또는 외부 도구 초기화가 매번 같이 로드되면 부담이 커질 수 있음

## 현재 프로세스 점검 결과

2026-07-04 점검 시점에는 PowerShell 프로세스가 수십 개 누적된 상태는 아니었습니다. 다만 `node.exe` 계열 백그라운드 프로세스가 상당히 많았고, MCP/플러그인 관련 프로세스가 여러 묶음으로 실행 중이었습니다.

따라서 즉시 프로젝트 파일을 고칠 문제라기보다, 작업 중 명령 실행 방식을 안정화하고 필요할 때 프로세스 압박을 점검하는 방식이 맞습니다.

## 재발 방지 원칙

- Codex에서 PowerShell 명령을 실행할 때 불필요한 `powershell.exe -NoProfile ...` 중첩 호출을 피합니다.
- 가능하면 현재 PowerShell 세션에서 바로 스크립트를 실행합니다.
- 많은 명령을 짧은 시간에 병렬로 실행해야 할 때는 프로세스 수를 먼저 확인합니다.
- Vercel 배포나 GitHub 푸시 후 불필요한 장기 실행 터미널이 남아 있지 않은지 확인합니다.
- 팝업이 반복되면 Codex 앱이나 관련 백그라운드 도구를 재시작해 프로세스 누적을 정리합니다.

## 안전 점검 명령

```powershell
.\scripts\Check-SystemPressure.ps1
```

이 스크립트는 프로세스를 종료하지 않고 PowerShell, Node, Git, Vercel 관련 프로세스 개수와 상위 메모리 사용 프로세스만 보여줍니다.

## 종료가 필요한 경우

프로세스를 강제로 종료하면 Codex 앱, MCP 서버, 브라우저 자동화, 배포 작업이 중단될 수 있습니다. 따라서 자동 종료는 하지 않습니다.

반복적으로 팝업이 뜨는 경우에는 다음 순서가 안전합니다.

1. 진행 중인 Codex 작업을 마무리합니다.
2. 변경사항을 Git에 커밋하거나 저장합니다.
3. 필요하면 Codex 앱을 재시작합니다.
4. 그래도 반복되면 Windows를 재부팅합니다.
