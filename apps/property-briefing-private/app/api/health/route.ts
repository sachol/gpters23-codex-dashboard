import { bridgeConfigured, protectionConfirmed } from "@/lib/protection.ts";
import { jsonResponse } from "@/lib/responses.ts";

export const dynamic = "force-dynamic";

export function GET(): Response {
  return jsonResponse({
    ok: true,
    service: "property-briefing-private",
    protectionConfirmed: protectionConfirmed(),
    bridgeConfigured: bridgeConfigured(),
  });
}
