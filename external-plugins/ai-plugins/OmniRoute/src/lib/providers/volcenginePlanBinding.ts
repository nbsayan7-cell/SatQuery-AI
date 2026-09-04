import {
  createProviderConnection,
  getProviderConnections,
  updateProviderConnection,
} from "@/models";

type JsonRecord = Record<string, unknown>;

export const CONSOLE_TOP_BASE = "https://console.volcengine.com/api/top/ark/cn-beijing/2024-01-01";
const CODING_PLAN_PROVIDER = "volcengine-coding-plan";
const AGENT_PLAN_PROVIDER = "volcengine-agent-plan";

const PLAN_CONFIG = {
  coding: {
    provider: CODING_PLAN_PROVIDER,
    name: "Volcano Ark Coding Plan",
    usageAction: "GetCodingPlanUsage",
    listModelAction: "ListArkCodeLatestModel",
    listModelPayload: {},
    referer: "https://console.volcengine.com/ark/region:cn-beijing/subscription/coding-plan",
    listApiKeysPayload: { ProjectName: "default" },
  },
  agent: {
    provider: AGENT_PLAN_PROVIDER,
    name: "Volcano Ark Agent Plan",
    usageAction: "GetAgentPlanAFPUsage",
    listModelAction: "GetAgentPlanModelMappingMeta",
    listModelPayload: { Edition: "agent_plan_personal" },
    referer: "https://console.volcengine.com/ark/region:cn-beijing/subscription/agent-plan",
    listApiKeysPayload: {
      ProjectName: "default",
      Filter: { Scene: "RealAgentPlanPersonal" },
    },
  },
} as const;

type PlanKind = keyof typeof PLAN_CONFIG;

export interface ConsoleApiResult {
  ok: boolean;
  status: number;
  json: JsonRecord;
  error: string | null;
}

export function stringField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function buildCookieHeader(credentials: JsonRecord): string {
  const rawCookie = stringField(credentials.volcConsoleCookie);
  if (rawCookie) return rawCookie;

  const names = ["digest", "AccountID", "csrfToken", "userInfo"];
  return names
    .map((name) => {
      const value = stringField(credentials[name]);
      return value ? `${name}=${value}` : "";
    })
    .filter(Boolean)
    .join("; ");
}

function extractCsrf(credentials: JsonRecord, cookieHeader: string): string {
  const explicit = stringField(credentials.volcCsrfToken) || stringField(credentials.csrfToken);
  if (explicit) return explicit;
  return cookieHeader.match(/(?:^|;\s*)csrfToken=([^;]+)/)?.[1]?.trim() || "";
}

export async function callConsoleApi(
  action: string,
  payload: JsonRecord,
  cookieHeader: string,
  csrfToken: string,
  referer: string
): Promise<ConsoleApiResult> {
  const response = await fetch(`${CONSOLE_TOP_BASE}/${action}?`, {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
      cookie: cookieHeader,
      origin: "https://console.volcengine.com",
      referer,
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let json: JsonRecord = {};
  try {
    json = record(JSON.parse(text));
  } catch {
    // Non-JSON console failures are reported through `error` below.
  }
  const meta = record(json.ResponseMetadata);
  const err = record(meta.Error);
  const message = stringField(err.Message);
  return {
    ok: response.ok && !message,
    status: response.status,
    json,
    error: message || (response.ok ? null : text.slice(0, 200)),
  };
}

export async function detectPlan(
  kind: PlanKind,
  cookieHeader: string,
  csrfToken: string
): Promise<{ available: boolean; usage: JsonRecord; error: string | null }> {
  const cfg = PLAN_CONFIG[kind];
  const result = await callConsoleApi(cfg.usageAction, {}, cookieHeader, csrfToken, cfg.referer);
  if (!result.ok) {
    return { available: false, usage: {}, error: result.error };
  }
  return { available: true, usage: record(result.json.Result), error: null };
}

function firstApiKeyItem(result: JsonRecord): JsonRecord | null {
  const items = record(result.Result).Items;
  if (!Array.isArray(items)) return null;
  return record(items[0]);
}

async function fetchRawApiKey(
  kind: PlanKind,
  cookieHeader: string,
  csrfToken: string
): Promise<{ apiKey: string; id: number | null; maskedKey: string | null; error: string | null }> {
  const cfg = PLAN_CONFIG[kind];
  const list = await callConsoleApi(
    "ListApiKeys",
    cfg.listApiKeysPayload,
    cookieHeader,
    csrfToken,
    cfg.referer
  );
  if (!list.ok) {
    return { apiKey: "", id: null, maskedKey: null, error: list.error || "ListApiKeys failed" };
  }

  const item = firstApiKeyItem(list.json);
  const id = Number(item?.Id);
  if (!Number.isFinite(id) || id <= 0) {
    return { apiKey: "", id: null, maskedKey: null, error: "No API key found for this plan" };
  }

  const raw = await callConsoleApi(
    "GetRawApiKey",
    { Id: id },
    cookieHeader,
    csrfToken,
    cfg.referer
  );
  if (!raw.ok) {
    return { apiKey: "", id, maskedKey: stringField(item?.Key) || null, error: raw.error };
  }

  const apiKey = stringField(record(raw.json.Result).ApiKey);
  if (!apiKey) {
    return {
      apiKey: "",
      id,
      maskedKey: stringField(item?.Key) || null,
      error: "Raw API key missing",
    };
  }
  return { apiKey, id, maskedKey: stringField(item?.Key) || null, error: null };
}

async function upsertConnection(
  kind: PlanKind,
  apiKey: string,
  cookieHeader: string,
  csrfToken: string,
  apiKeyId: number | null,
  usage: JsonRecord
) {
  const cfg = PLAN_CONFIG[kind];
  const providerSpecificData = {
    volcConsoleCookie: cookieHeader,
    volcCsrfToken: csrfToken,
    volcApiKeyId: apiKeyId,
    volcPlanKind: kind,
    volcLastUsage: usage,
    // Enable 24h model auto-sync (modelSyncScheduler picks up autoSync:true).
    autoSync: true,
  };

  const existing = (await getProviderConnections({ provider: cfg.provider })).find(
    (conn: JsonRecord) => stringField(conn.name) === cfg.name
  );

  if (existing?.id) {
    return await updateProviderConnection(stringField(existing.id), {
      apiKey,
      name: cfg.name,
      providerSpecificData,
      isActive: true,
      testStatus: "active",
    });
  }

  return await createProviderConnection({
    provider: cfg.provider,
    authType: "apikey",
    name: cfg.name,
    apiKey,
    providerSpecificData,
    isActive: true,
    testStatus: "active",
  });
}

export async function bindVolcenginePlansFromConsoleCredentials(credentials: JsonRecord) {
  const cookieHeader = buildCookieHeader(credentials);
  const csrfToken = extractCsrf(credentials, cookieHeader);
  if (!cookieHeader || !csrfToken) {
    throw new Error("Volcano console cookie or csrfToken is missing");
  }

  const results: Array<{
    plan: PlanKind;
    available: boolean;
    ok: boolean;
    connectionId?: string;
    apiKeyId?: number | null;
    maskedKey?: string | null;
    error?: string | null;
  }> = [];

  for (const kind of ["coding", "agent"] as PlanKind[]) {
    const detected = await detectPlan(kind, cookieHeader, csrfToken);
    if (!detected.available) {
      results.push({ plan: kind, available: false, ok: false, error: detected.error });
      continue;
    }

    const key = await fetchRawApiKey(kind, cookieHeader, csrfToken);
    if (!key.apiKey) {
      results.push({
        plan: kind,
        available: true,
        ok: false,
        apiKeyId: key.id,
        maskedKey: key.maskedKey,
        error: key.error,
      });
      continue;
    }

    const connection = await upsertConnection(
      kind,
      key.apiKey,
      cookieHeader,
      csrfToken,
      key.id,
      detected.usage
    );
    results.push({
      plan: kind,
      available: true,
      ok: Boolean(connection?.id),
      connectionId: stringField(connection?.id),
      apiKeyId: key.id,
      maskedKey: key.maskedKey,
    });
  }

  return {
    cookieCaptured: true,
    results,
  };
}
