import "server-only";

import { assertOperationalProtection } from "./protection.ts";

type BridgeAction =
  | { action: "saveCase"; payload: unknown }
  | { action: "getCase"; caseId: string }
  | { action: "publishSummary"; payload: unknown };

interface BridgeResponse {
  ok: boolean;
  data?: unknown;
  error?: string;
}

export async function callPrivateBridge(
  request: BridgeAction,
): Promise<BridgeResponse> {
  assertOperationalProtection();
  const url = process.env.PRIVATE_APPS_SCRIPT_URL;
  const secret = process.env.PRIVATE_SHEET_WRITE_SECRET;
  if (!url || !secret) {
    throw new Error("비공개 Google Sheets 연결 환경변수가 설정되지 않았습니다.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...request, secret }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Apps Script 응답 오류: HTTP ${response.status}`);
    }
    const result = (await response.json()) as BridgeResponse;
    if (!result.ok) throw new Error(result.error || "Apps Script 저장에 실패했습니다.");
    return result;
  } finally {
    clearTimeout(timeout);
  }
}
