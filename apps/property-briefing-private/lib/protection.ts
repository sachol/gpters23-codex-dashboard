export function protectionConfirmed(): boolean {
  return process.env.PRIVATE_APP_PROTECTION_CONFIRMED === "true";
}

export function productionDataAccessBlocked(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export function assertOperationalProtection(): void {
  if (productionDataAccessBlocked()) {
    throw new Error(
      "공개 Production 주소에서는 비공개 매물 데이터 처리를 차단합니다.",
    );
  }

  if (process.env.NODE_ENV === "production" && !protectionConfirmed()) {
    throw new Error(
      "비공개 배포 보호가 확인되지 않아 운영 데이터 처리를 차단했습니다.",
    );
  }
}

export function bridgeConfigured(): boolean {
  return Boolean(
    process.env.PRIVATE_APPS_SCRIPT_URL &&
      process.env.PRIVATE_SHEET_WRITE_SECRET,
  );
}
