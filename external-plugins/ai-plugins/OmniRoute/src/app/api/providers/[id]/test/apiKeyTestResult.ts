export interface ApiKeyValidationResult {
  valid: boolean;
  warning?: string | null;
  statusCode?: number | null;
  deployments?: unknown;
}

export interface ApiKeyTestDiagnosis {
  type: string;
  source: string;
  message: string | null;
  code: string | null;
}

export function buildApiKeyConnectionTestResult(
  result: ApiKeyValidationResult,
  error: string | null,
  diagnosis: ApiKeyTestDiagnosis
) {
  return {
    valid: !!result.valid,
    error,
    warning: result.warning || null,
    statusCode: result.valid ? null : (result.statusCode ?? null),
    diagnosis,
    ...(Array.isArray(result.deployments) ? { deployments: result.deployments } : {}),
  };
}
