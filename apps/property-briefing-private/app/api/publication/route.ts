import { callPrivateBridge } from "@/lib/apps-script.ts";
import { errorResponse, jsonResponse } from "@/lib/responses.ts";
import {
  assertBodySize,
  parsePublicationSummary,
} from "@/lib/schema.ts";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const raw = await request.text();
    assertBodySize(raw);
    const summary = parsePublicationSummary(JSON.parse(raw));
    if (!summary.reviewPassed || !summary.approvedAt) {
      return errorResponse(
        new Error("3단계 검수를 통과하고 최종 승인일이 있는 요약만 공개할 수 있습니다."),
      );
    }
    const result = await callPrivateBridge({
      action: "publishSummary",
      payload: summary,
    });
    return jsonResponse({ ok: true, data: result.data });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
