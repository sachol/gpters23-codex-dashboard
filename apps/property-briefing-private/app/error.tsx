"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="fatal-error">
      <p className="eyebrow">처리 중 오류</p>
      <h1>작업 화면을 불러오지 못했습니다.</h1>
      <p>{error.message}</p>
      <button type="button" className="primary" onClick={reset}>
        다시 시도
      </button>
    </main>
  );
}
