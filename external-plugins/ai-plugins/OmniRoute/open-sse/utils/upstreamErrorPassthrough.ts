/**
 * Selective upstream 4xx error passthrough (Claude Code auto-recover contract).
 *
 * Claude Code matches the upstream error WORDING to auto-disable capabilities
 * (thinking / output_config) for the rest of the conversation. Wrapping the body
 * via buildErrorBody() truncates the message and breaks that recovery. For
 * upstream-originated 4xx errors the body is the provider's public API message —
 * not our internals — so it is safe and required to relay it verbatim.
 * OmniRoute-generated errors MUST keep using buildErrorBody() (Hard Rule #12).
 */
const PASSTHROUGH_MIN = 400;
const PASSTHROUGH_MAX = 499;
// 401/403/407: auth-adjacent — our own credential context may leak via provider
// echoes; keep those sanitized. 400/404/408/413/422/429 carry the capability and
// quota wording the client needs.
const EXCLUDED_STATUSES = new Set([401, 403, 407]);
const INTERNAL_LEAK_RE = /\sat\s\/|node_modules|omniroute\//i;
// #10898-sec / secret-in-error hardening: some providers echo the offending
// request (including an Authorization header or api key) inside a 400/422/429
// validation body. Passthrough relays the body VERBATIM (the Claude Code
// capability-recovery contract needs the exact wording), so we cannot key-drop
// via sanitizeUpstreamDetails without breaking that contract. Instead, if the
// body actually carries a credential pattern, REFUSE passthrough and let the
// caller fall back to the sanitized buildErrorBody path. Bodies without a
// secret (the overwhelming majority, carrying capability/quota wording) still
// relay verbatim. Mirrors the vocabulary of redactSensitiveErrorText in error.ts.
const CREDENTIAL_LEAK_RE =
  /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}|\bsk-[A-Za-z0-9._-]{8,}|(?:api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|cookie|secret)\\?["']?\s*[:=]\s*\\?["']?[^"'\\,\s}]{6,}/i;

export function shouldPassthroughUpstreamError(statusCode: number, upstreamBody: unknown): boolean {
  if (statusCode < PASSTHROUGH_MIN || statusCode > PASSTHROUGH_MAX) return false;
  if (EXCLUDED_STATUSES.has(statusCode)) return false;
  if (!upstreamBody || typeof upstreamBody !== "object") return false;
  const text = JSON.stringify(upstreamBody);
  if (INTERNAL_LEAK_RE.test(text)) return false;
  // Refuse passthrough when the provider echoed a credential back to us.
  if (CREDENTIAL_LEAK_RE.test(text)) return false;
  return true;
}

export function buildPassthroughErrorResponse(
  statusCode: number,
  upstreamBody: unknown,
  headers?: Record<string, string>
): Response | null {
  if (!shouldPassthroughUpstreamError(statusCode, upstreamBody)) return null;
  return new Response(JSON.stringify(upstreamBody), {
    status: statusCode,
    headers: { "Content-Type": "application/json", ...(headers || {}) },
  });
}
