import { BriefingWorkspace } from "@/components/BriefingWorkspace";
import {
  bridgeConfigured,
  productionDataAccessBlocked,
  protectionConfirmed,
} from "@/lib/protection.ts";

export const dynamic = "force-dynamic";

export default function Home() {
  if (productionDataAccessBlocked()) {
    return (
      <main
        style={{
          alignItems: "center",
          background:
            "radial-gradient(circle at top, #e9f4ff 0%, #f7f9fc 48%, #eef2f7 100%)",
          display: "flex",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "24px",
        }}
      >
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #dce3ec",
            borderRadius: "24px",
            boxShadow: "0 24px 60px rgba(35, 53, 84, 0.12)",
            maxWidth: "680px",
            padding: "48px",
          }}
        >
          <p style={{ color: "#1769aa", fontWeight: 700, marginTop: 0 }}>
            GPTERS 23기 Codex 앱 스터디 · Week 2
          </p>
          <h1 style={{ color: "#162338", fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            비공개 매물 브리핑 업무 시스템
          </h1>
          <p style={{ color: "#4b5c72", fontSize: "1.05rem", lineHeight: 1.75 }}>
            이 공개 Production 주소에서는 고객·매물·임대차 자료를 읽거나
            저장하지 않습니다. 실제 업무 화면은 Vercel 로그인이 필요한 보호된
            Preview 배포에서만 운영합니다.
          </p>
          <p
            style={{
              background: "#f2f7fc",
              borderRadius: "14px",
              color: "#304761",
              lineHeight: 1.65,
              marginBottom: 0,
              padding: "16px 18px",
            }}
          >
            공개 화면에는 비식별 진행상태와 승인된 요약만 별도로 전달합니다.
          </p>
        </section>
      </main>
    );
  }

  return (
    <BriefingWorkspace
      systemStatus={{
        protectionConfirmed: protectionConfirmed(),
        bridgeConfigured: bridgeConfigured(),
      }}
    />
  );
}
