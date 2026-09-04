import { sanitizeErrorMessage } from "../utils/error.ts";

type JsonRecord = Record<string, unknown>;
type UsageQuota = {
  used: number;
  total: number;
  remaining?: number;
  remainingPercentage?: number;
  resetAt: string | null;
  unlimited: boolean;
  displayName?: string;
  details?: Array<{ name: string; used: number }>;
  currency?: string;
};

const OLLAMA_CLOUD_USAGE_URL =
  process.env.OMNIROUTE_OLLAMA_CLOUD_USAGE_URL ?? "https://ollama.com/settings";
const OLLAMA_CLOUD_SESSION_COOKIE = "__Secure-session";

type OllamaUsageWindow = { usagePercent: number; resetAt: string | null };
type OllamaCloudUsage = {
  session?: OllamaUsageWindow;
  weekly?: OllamaUsageWindow;
  planTier?: string | null;
};
type OllamaCloudConfig =
  { state: "configured"; cookie: string } | { state: "invalid"; error: string } | { state: "none" };

function toRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toPercentage(value: unknown): number {
  return Math.max(0, Math.min(100, toNumber(value, 0)));
}
function getProviderSpecificString(data: JsonRecord | undefined, keys: string[]): string {
  const obj = toRecord(data);
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}
function resolveOllamaCloudConfig(providerSpecificData?: JsonRecord): OllamaCloudConfig {
  const cookie =
    process.env.OMNIROUTE_OLLAMA_USAGE_COOKIE?.trim() ||
    process.env.OLLAMA_USAGE_COOKIE?.trim() ||
    process.env.OLLAMA_CLOUD_USAGE_COOKIE?.trim() ||
    getProviderSpecificString(providerSpecificData, [
      "ollamaUsageCookie",
      "ollamaCloudUsageCookie",
      "ollamaCloudCookie",
      "usageCookie",
      "cookie",
    ]);
  if (!cookie) return { state: "none" };
  if (cookie.includes("\r") || cookie.includes("\n")) {
    return { state: "invalid", error: "Ollama Cloud cookie contains invalid CRLF characters." };
  }
  return { state: "configured", cookie };
}

function normalizeOllamaCloudCookie(value: string): string {
  const trimmed = value.trim();
  return trimmed.toLowerCase().startsWith(`${OLLAMA_CLOUD_SESSION_COOKIE.toLowerCase()}=`)
    ? trimmed.slice(OLLAMA_CLOUD_SESSION_COOKIE.length + 1).trim()
    : trimmed;
}

function extractOllamaUsagePercent(trackHtml: string): number | null {
  const tagHeader = trackHtml.match(/^[^>]*/)?.[0] ?? "";
  const ariaMatch = tagHeader.match(/(\d+(?:\.\d+)?)%\s*used/);
  if (ariaMatch) {
    const pct = toNumber(ariaMatch[1], Number.NaN);
    if (Number.isFinite(pct) && pct >= 0 && pct <= 100) return pct;
  }
  const style = tagHeader.match(/style="([^"]*)"/)?.[1] ?? "";
  const pct = toNumber(style.match(/(?:^|;)\s*width\s*:\s*([0-9.]+)%/)?.[1], Number.NaN);
  return Number.isFinite(pct) && pct >= 0 && pct <= 100 ? pct : null;
}

function parseOllamaCloudSettingsHtml(html: string): OllamaCloudUsage | null {
  const parts = html.split(/\bdata-usage-track\b/);
  if (parts.length < 2) return null;
  const extractTime = (text: string): string | null => {
    const match = text.match(/class="[^"]*local-time[^"]*"[^>]*data-time="([^"]*)"/);
    return match?.[1] || null;
  };
  const sessionPercent = extractOllamaUsagePercent(parts[1]);
  const weeklyPercent = parts[2] ? extractOllamaUsagePercent(parts[2]) : null;
  if (sessionPercent === null && weeklyPercent === null) return null;
  return {
    ...(sessionPercent !== null
      ? { session: { usagePercent: sessionPercent, resetAt: extractTime(parts[1]) } }
      : {}),
    ...(weeklyPercent !== null
      ? { weekly: { usagePercent: weeklyPercent, resetAt: extractTime(parts[2]) } }
      : {}),
    planTier: html.match(/class="[^"]*capitalize[^"]*"[^>]*>([^<]*)</)?.[1]?.trim() || null,
  };
}

async function fetchOllamaCloudUsageFromSettings(
  config: Extract<OllamaCloudConfig, { state: "configured" }>
) {
  const response = await fetch(OLLAMA_CLOUD_USAGE_URL, {
    redirect: "manual",
    headers: {
      Accept: "text/html",
      Cookie: `${OLLAMA_CLOUD_SESSION_COOKIE}=${normalizeOllamaCloudCookie(config.cookie)}`,
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Gecko/20100101 Firefox/152.0",
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status >= 300 && response.status < 400) {
    return { usage: null, message: "Ollama Cloud authentication expired. Refresh the cookie." };
  }
  if (!response.ok)
    return { usage: null, message: `Ollama Cloud settings error (${response.status}).` };
  const usage = parseOllamaCloudSettingsHtml(await response.text());
  return {
    usage,
    message: usage ? undefined : "Ollama Cloud settings page did not contain usage quota tracks.",
  };
}

export async function getOllamaCloudUsage(providerSpecificData?: JsonRecord) {
  const config = resolveOllamaCloudConfig(providerSpecificData);
  if (config.state === "none") {
    return {
      message:
        "Ollama Cloud quota requires OLLAMA_USAGE_COOKIE. Copy the __Secure-session cookie from ollama.com/settings.",
    };
  }
  if (config.state === "invalid") return { message: config.error };

  try {
    const result = await fetchOllamaCloudUsageFromSettings(config);
    if (!result.usage) return { message: result.message || "Ollama Cloud quota data unavailable." };
    const quotas: Record<string, UsageQuota> = {};
    for (const key of ["session", "weekly"] as const) {
      const quota = result.usage[key];
      if (!quota) continue;
      const pct = toPercentage(quota.usagePercent);
      quotas[key] = {
        used: pct,
        total: 100,
        remaining: Math.max(0, 100 - pct),
        remainingPercentage: Math.max(0, 100 - pct),
        resetAt: quota.resetAt,
        unlimited: false,
        displayName: key === "session" ? "Session" : "Weekly",
      };
    }
    return {
      plan: result.usage.planTier ? `Ollama Cloud ${result.usage.planTier}` : "Ollama Cloud",
      quotas,
    };
  } catch (error) {
    return { message: `Ollama Cloud quota error: ${sanitizeErrorMessage(error)}` };
  }
}
