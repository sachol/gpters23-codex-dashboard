# 공적 근거 기반 매물 브리핑 — 비공개 실행 앱

GPTERS 23기 Codex 앱 스터디 Week 2 파일럿용 비공개 업무 화면입니다. 원본 자료를 저장소나 브라우저에 올리지 않고, 비식별 Google Drive 폴더를 Codex Skill·MCP로 검토한 결과를 구조화합니다.

## 안전 경계

- 원본 Drive 폴더와 `automation-masked` 폴더를 분리합니다.
- 서버 환경변수에만 Apps Script URL과 쓰기 비밀값을 둡니다.
- 프로덕션에서는 `PRIVATE_APP_PROTECTION_CONFIRMED=true`가 아니면 저장·조회가 차단됩니다.
- 고객용 결과와 내부 검수 메모를 분리하며, 인쇄 화면에서 내부 영역을 제외합니다.
- 공개 보드에는 `PublicationSummary` 허용목록만 전달합니다.
- 이 도구는 권리 안전성, 적법성 또는 투자수익을 보장하지 않습니다.

## 로컬 실행

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

로컬 개발에서는 외부 DB가 없어도 입력·검증·타이머·인쇄 화면을 확인할 수 있습니다. 저장·불러오기·공개 요약 전송은 별도 Google Sheet 및 전용 Apps Script 설정 후 동작합니다.

## 검증

```powershell
npm test
npm run typecheck
npm run build
```

## 외부 연결 순서

1. 비공개 Google Sheet를 새로 만들고 `integrations/google-apps-script/Code.gs`를 전용 Apps Script 프로젝트에 붙입니다.
2. Script Properties에 `SPREADSHEET_ID`, `PRIVATE_WRITE_SECRET`, `PUBLIC_READ_SECRET`을 설정합니다.
3. `setupPrivateWorkbook()`을 한 번 실행해 시트와 헤더를 만듭니다.
4. 웹 앱으로 배포한 뒤 Vercel 서버 환경변수에 URL과 쓰기 비밀값을 등록합니다.
5. 별도 Vercel 프로젝트에서 Vercel Authentication을 적용하고 실제 비로그인 접근 차단을 검증합니다.
6. 검증 후에만 `PRIVATE_APP_PROTECTION_CONFIRMED=true`를 설정합니다.

외부 리소스 생성·배포·환경변수 설정은 대표님의 별도 승인 후 진행합니다.
