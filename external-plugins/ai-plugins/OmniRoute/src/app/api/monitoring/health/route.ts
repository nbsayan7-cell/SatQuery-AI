import { NextResponse } from "next/server";
import { getProviderConnections } from "@/lib/db/providers";
import { getCachedSettings } from "@/lib/db/readCache";
import { buildHealthPayload } from "@/lib/monitoring/observability";
import { readRunningBuildSha } from "@/lib/monitoring/buildSha";
import { APP_CONFIG } from "@/shared/constants/config";
import { AI_PROVIDERS } from "@/shared/constants/providers";
import { isAuthenticated } from "@/shared/utils/apiAuth";
import { requireManagementAuth } from "@/lib/api/requireManagementAuth";

/**
 * GET /api/monitoring/health — System health overview
 *
 * Returns system info, provider health (circuit breakers),
 * rate limit status, and database stats.
 */
// §8.2 optimization: short-TTL cache for the health payload. Health is a
// frequently-polled endpoint and rebuilding it every request (DB reads +
// status aggregation across 8 subsystems) is wasteful under rapid polling. 1s
// stays near-real-time for monitoring; the cache is invalidated on DELETE
// (circuit-breaker reset) so a manual reset is reflected immediately.
let healthPayloadCache: { payload: unknown; expiresAt: number } | null = null;
const HEALTH_PAYLOAD_TTL_MS = 1000;

// GHSA-mvf8-qc78-5mxm: the full health payload fingerprints the host (version,
// node version, pid, memory, provider config). An anonymous caller — the common
// case on a keyless install, and what a liveness/load-balancer probe needs — gets
// only the liveness verdict; the detail is reserved for a management principal.
function publicHealthView(payload: unknown): Record<string, unknown> {
  const p = (payload ?? {}) as Record<string, unknown>;
  return {
    status: p.status ?? "unknown",
    ...(p.setupComplete !== undefined ? { setupComplete: p.setupComplete } : {}),
  };
}

export async function GET(request: Request) {
  const fullView = (await requireManagementAuth(request, { alwaysRequireAuth: true })) === null;
  const cachedNow = Date.now();
  if (healthPayloadCache && cachedNow <= healthPayloadCache.expiresAt) {
    return NextResponse.json(
      fullView ? healthPayloadCache.payload : publicHealthView(healthPayloadCache.payload)
    );
  }

  const readHealthValue = <T>(label: string, reader: () => T, fallback: T): T => {
    try {
      return reader();
    } catch (error) {
      console.warn(
        `[API] GET /api/monitoring/health ${label} unavailable:`,
        error instanceof Error ? error.message : error
      );
      return fallback;
    }
  };

  const fallbackQuotaMonitorSummary = {
    active: 0,
    alerting: 0,
    exhausted: 0,
    errors: 0,
    statusCounts: { starting: 0, idle: 0, healthy: 0, warning: 0, exhausted: 0, error: 0 },
    byProvider: {},
  };

  try {
    const [
      circuitBreakerModule,
      rateLimitModule,
      accountFallbackModule,
      requestDedupModule,
      quotaMonitorModule,
      sessionManagerModule,
      credentialHealthModule,
      localHealthModule,
      adaptiveAdmissionModule,
      chatAdmissionModule,
      settingsResult,
      connectionsResult,
    ] = await Promise.allSettled([
      import("@/shared/utils/circuitBreaker"),
      import("@omniroute/open-sse/services/rateLimitManager"),
      import("@omniroute/open-sse/services/accountFallback"),
      import("@omniroute/open-sse/services/requestDedup.ts"),
      import("@omniroute/open-sse/services/quotaMonitor.ts"),
      import("@omniroute/open-sse/services/sessionManager.ts"),
      import("@/lib/credentialHealth/cache"),
      import("@/lib/localHealthCheck"),
      import("@omniroute/open-sse/services/admission/runtime.ts"),
      import("@/shared/middleware/chatBodyAdmission"),
      getCachedSettings(),
      getProviderConnections(),
    ]);

    const circuitBreakers =
      circuitBreakerModule.status === "fulfilled"
        ? readHealthValue(
            "circuit breakers",
            () => circuitBreakerModule.value.getAllCircuitBreakerStatuses(),
            []
          )
        : [];
    const rateLimitStatus =
      rateLimitModule.status === "fulfilled"
        ? readHealthValue("rate limits", () => rateLimitModule.value.getAllRateLimitStatus(), {})
        : {};
    const learnedLimits =
      rateLimitModule.status === "fulfilled"
        ? readHealthValue("learned limits", () => rateLimitModule.value.getLearnedLimits(), {})
        : {};
    const lockouts =
      accountFallbackModule.status === "fulfilled"
        ? readHealthValue(
            "model lockouts",
            () => accountFallbackModule.value.getAllModelLockouts(),
            []
          )
        : [];
    const quotaMonitorSummary =
      quotaMonitorModule.status === "fulfilled"
        ? readHealthValue(
            "quota monitor summary",
            () => quotaMonitorModule.value.getQuotaMonitorSummary(),
            fallbackQuotaMonitorSummary
          )
        : fallbackQuotaMonitorSummary;
    const quotaMonitorMonitors =
      quotaMonitorModule.status === "fulfilled"
        ? readHealthValue(
            "quota monitor snapshots",
            () => quotaMonitorModule.value.getQuotaMonitorSnapshots(),
            []
          )
        : [];
    const activeSessions =
      sessionManagerModule.status === "fulfilled"
        ? readHealthValue(
            "active sessions",
            () => sessionManagerModule.value.getActiveSessions(),
            []
          )
        : [];
    const activeSessionsByKey =
      sessionManagerModule.status === "fulfilled"
        ? readHealthValue(
            "active sessions by key",
            () => sessionManagerModule.value.getAllActiveSessionCountsByKey(),
            {}
          )
        : {};
    const credentialHealth =
      credentialHealthModule.status === "fulfilled"
        ? readHealthValue(
            "credential health",
            () => credentialHealthModule.value.getCredentialHealthSummary(),
            undefined
          )
        : undefined;
    const localProviders =
      localHealthModule.status === "fulfilled"
        ? readHealthValue(
            "local providers",
            () => localHealthModule.value.getAllHealthStatuses(),
            {}
          )
        : {};
    const settings = settingsResult.status === "fulfilled" ? settingsResult.value : {};
    const connections = connectionsResult.status === "fulfilled" ? connectionsResult.value : [];
    const adaptiveAdmission =
      adaptiveAdmissionModule.status === "fulfilled"
        ? readHealthValue(
            "adaptive admission",
            () => adaptiveAdmissionModule.value.getAdaptiveAdmissionRuntime().snapshot(),
            null
          )
        : null;
    // #11244: the STRUCTURAL admission gate (chatBodyAdmission.ts — bounded
    // heavyweight lease + shed counters), exposed next to but distinct from the
    // adaptive shadow-mode snapshot above. Additive key — nothing existing moves.
    const chatAdmission =
      chatAdmissionModule.status === "fulfilled"
        ? readHealthValue(
            "chat admission",
            () => chatAdmissionModule.value.perConnectionAdmissionController.snapshot(),
            null
          )
        : null;

    const payload = buildHealthPayload({
      appVersion: APP_CONFIG.version,
      // #10427: surface the artifact's git SHA so a deployment can be audited over HTTP
      // instead of SSH + grepping compiled chunks (the 2026-08-14 gateway outage).
      buildSha: readRunningBuildSha(),
      catalogCount: Object.keys(AI_PROVIDERS).length,
      settings,
      connections,
      circuitBreakers,
      rateLimitStatus,
      learnedLimits,
      lockouts,
      localProviders,
      inflightRequests:
        requestDedupModule.status === "fulfilled"
          ? readHealthValue(
              "inflight requests",
              () => requestDedupModule.value.getInflightCount(),
              0
            )
          : 0,
      quotaMonitorSummary,
      quotaMonitorMonitors,
      activeSessions,
      activeSessionsByKey,
      credentialHealth,
      adaptiveAdmission,
      chatAdmission,
    });

    healthPayloadCache = { payload, expiresAt: Date.now() + HEALTH_PAYLOAD_TTL_MS };
    return NextResponse.json(fullView ? payload : publicHealthView(payload));
  } catch (error) {
    console.error("[API] GET /api/monitoring/health error:", error);
    return NextResponse.json({
      status: "degraded",
      error: "Health check partially unavailable",
      timestamp: new Date().toISOString(),
      providerBreakers: [],
      providerHealth: {},
      rateLimitStatus: {},
      learnedLimits: {},
      lockouts: [],
      quotaMonitor: { ...fallbackQuotaMonitorSummary, monitors: [] },
      sessions: { activeCount: 0, stickyBoundCount: 0, byApiKey: {}, top: [] },
      adaptiveAdmission: null,
      chatAdmission: null,
      dedup: { inflightRequests: 0 },
    });
  }
}

/**
 * DELETE /api/monitoring/health — Reset all circuit breakers
 *
 * Resets all provider circuit breakers to CLOSED state,
 * clearing failure counts and persisted state.
 */
export async function DELETE(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { resetAllCircuitBreakers, getAllCircuitBreakerStatuses } =
      await import("@/shared/utils/circuitBreaker");

    const before = getAllCircuitBreakerStatuses();
    const resetCount = before.length;

    resetAllCircuitBreakers();
    healthPayloadCache = null; // a reset just happened — don't serve a stale GET snapshot

    console.log(`[API] DELETE /api/monitoring/health — Reset ${resetCount} circuit breakers`);

    return NextResponse.json({
      success: true,
      message: `Reset ${resetCount} circuit breaker(s) to healthy state`,
      resetCount,
    });
  } catch (error) {
    console.error("[API] DELETE /api/monitoring/health error:", error);
    return NextResponse.json({ error: "Failed to reset circuit breakers" }, { status: 500 });
  }
}
