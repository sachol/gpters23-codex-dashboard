export function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export function errorResponse(error: unknown, status = 400): Response {
  const message =
    error instanceof Error ? error.message : "처리 중 알 수 없는 오류가 발생했습니다.";
  return jsonResponse({ ok: false, error: message }, status);
}
