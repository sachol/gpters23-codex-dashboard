import { callPrivateBridge } from "@/lib/apps-script.ts";
import { errorResponse, jsonResponse } from "@/lib/responses.ts";
import { assertBodySize, parseCaseState } from "@/lib/schema.ts";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const caseId = new URL(request.url).searchParams.get("caseId")?.trim();
    if (!caseId || caseId.length > 120) {
      return errorResponse(new Error("유효한 케이스 ID가 필요합니다."));
    }
    const result = await callPrivateBridge({ action: "getCase", caseId });
    return jsonResponse({ ok: true, data: result.data });
  } catch (error) {
    return errorResponse(error, 503);
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const raw = await request.text();
    assertBodySize(raw);
    const state = parseCaseState(JSON.parse(raw));
    state.case.updatedAt = new Date().toISOString();
    const result = await callPrivateBridge({
      action: "saveCase",
      payload: state,
    });
    return jsonResponse({ ok: true, data: result.data });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
