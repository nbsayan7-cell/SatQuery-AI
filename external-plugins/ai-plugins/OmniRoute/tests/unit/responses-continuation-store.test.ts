import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// OmniRoute-native `previous_response_id` virtualization: resolvePreviousResponseState
// resolves a response id back to the full input/output a prior call produced by
// reading the already-persisted call-log artifact, so a later request can be
// reconstructed to full history server-side without duplicating conversation
// content into a second store.

const TEST_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "omniroute-responses-continuation-"));
process.env.DATA_DIR = TEST_DATA_DIR;

const core = await import("../../src/lib/db/core.ts");
const store = await import("../../src/lib/db/responsesContinuationStore.ts");

test.after(() => {
  core.resetDbInstance();
  fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

function insertCallLog(row: {
  id: string;
  responseId: string | null;
  apiKeyId: string | null;
  detailState: string;
  artifactRelPath: string | null;
}) {
  const db = core.getDbInstance();
  db.prepare(
    `INSERT INTO call_logs
      (id, timestamp, method, path, status, model, provider, account, duration,
       tokens_in, tokens_out, api_key_id, detail_state, artifact_relpath, response_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    row.id,
    new Date().toISOString(),
    "POST",
    "/v1/responses",
    200,
    "gpt-5.4-pro",
    "openai",
    "acc1",
    100,
    10,
    20,
    row.apiKeyId,
    row.detailState,
    row.artifactRelPath,
    row.responseId
  );
}

function writeArtifact(relPath: string, pipeline: Record<string, unknown>) {
  const absPath = path.join(TEST_DATA_DIR, "call_logs", relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(
    absPath,
    JSON.stringify({
      schemaVersion: 5,
      summary: {},
      requestBody: null,
      responseBody: null,
      error: null,
      pipeline,
    })
  );
}

test("resolvePreviousResponseState reconstructs input/output from the call-log artifact", () => {
  insertCallLog({
    id: "log-1",
    responseId: "resp_abc",
    apiKeyId: "key-1",
    detailState: "ready",
    artifactRelPath: "2026-01-01/log-1.json",
  });
  writeArtifact("2026-01-01/log-1.json", {
    clientRawRequest: { body: { input: [{ type: "message", role: "user", content: "hi" }] } },
    providerRequest: { body: { input: [{ type: "message", role: "user", content: "hi" }] } },
    clientResponse: {
      id: "resp_abc",
      output: [{ type: "message", role: "assistant", content: "hello" }],
    },
  });

  const result = store.resolvePreviousResponseState("resp_abc", "key-1");
  assert.deepEqual(result, {
    input: [{ type: "message", role: "user", content: "hi" }],
    output: [{ type: "message", role: "assistant", content: "hello" }],
  });
});

test("resolvePreviousResponseState reads output from a wrapped (streaming) clientResponse shape", () => {
  // A streaming reply's clientResponse is clientPayloadCollector.build()'s output,
  // which always nests the caller-supplied summary under `.summary` (see
  // createStructuredSSECollector in streamPayloadCollector.ts) rather than
  // carrying `output` at the top level like a non-streaming reply does. This
  // must resolve exactly like the unwrapped shape above -- it was the actual
  // cause of previous_response_id continuation always failing for a streaming
  // Responses-API passthrough connection (fixed alongside the clientPayload
  // builder gap in open-sse/utils/stream.ts).
  insertCallLog({
    id: "log-1-streamed",
    responseId: "resp_streamed",
    apiKeyId: "key-1",
    detailState: "ready",
    artifactRelPath: "2026-01-01/log-1-streamed.json",
  });
  writeArtifact("2026-01-01/log-1-streamed.json", {
    clientRawRequest: { body: { input: [{ type: "message", role: "user", content: "hi" }] } },
    providerRequest: { body: { input: [{ type: "message", role: "user", content: "hi" }] } },
    clientResponse: {
      _streamed: true,
      _format: "sse-json",
      _eventCount: 1,
      summary: {
        id: "resp_streamed",
        object: "response",
        output: [{ type: "message", role: "assistant", content: "hello" }],
      },
    },
  });

  const result = store.resolvePreviousResponseState("resp_streamed", "key-1");
  assert.deepEqual(result, {
    input: [{ type: "message", role: "user", content: "hi" }],
    output: [{ type: "message", role: "assistant", content: "hello" }],
  });
});

test("resolvePreviousResponseState returns null for an unknown response id", () => {
  const result = store.resolvePreviousResponseState("resp_does_not_exist", "key-1");
  assert.equal(result, null);
});

test("resolvePreviousResponseState never crosses tenants (scoped by api_key_id)", () => {
  insertCallLog({
    id: "log-2",
    responseId: "resp_tenant_a",
    apiKeyId: "key-a",
    detailState: "ready",
    artifactRelPath: "2026-01-01/log-2.json",
  });
  writeArtifact("2026-01-01/log-2.json", {
    clientRawRequest: { body: { input: [{ role: "user", content: "secret" }] } },
    providerRequest: { body: { input: [{ role: "user", content: "secret" }] } },
    clientResponse: { id: "resp_tenant_a", output: [{ role: "assistant", content: "reply" }] },
  });

  assert.equal(store.resolvePreviousResponseState("resp_tenant_a", "key-b"), null);
  assert.equal(store.resolvePreviousResponseState("resp_tenant_a", null), null);
  assert.notEqual(store.resolvePreviousResponseState("resp_tenant_a", "key-a"), null);
});

test("resolvePreviousResponseState returns null when the artifact is missing on disk", () => {
  insertCallLog({
    id: "log-3",
    responseId: "resp_missing_file",
    apiKeyId: "key-1",
    detailState: "ready",
    artifactRelPath: "2026-01-01/does-not-exist.json",
  });

  assert.equal(store.resolvePreviousResponseState("resp_missing_file", "key-1"), null);
});

test("resolvePreviousResponseState fails closed when the pipeline payload was size-limit-omitted", () => {
  insertCallLog({
    id: "log-4",
    responseId: "resp_omitted",
    apiKeyId: "key-1",
    detailState: "ready",
    artifactRelPath: "2026-01-01/log-4.json",
  });
  // A size-limit-omitted payload is replaced with a placeholder string, not
  // an object -- resolvePreviousResponseState must never try to reconstruct
  // from it and silently drop history.
  writeArtifact("2026-01-01/log-4.json", {
    clientRawRequest: { body: "[omitted: call log artifact size limit exceeded]" },
    clientResponse: { id: "resp_omitted", output: [] },
  });

  assert.equal(store.resolvePreviousResponseState("resp_omitted", "key-1"), null);
});

test("resolvePreviousResponseState resolves input from clientRawRequest when providerRequest was translated to a different upstream wire shape", () => {
  // Real shape from a live auto-routed free-tier connection: OmniRoute
  // translates the client's Responses-API request into Chat Completions
  // (`messages`, no `input` at all) before forwarding upstream. Reading
  // `input` from providerRequest.body made this permanently unresolvable --
  // previous_response_not_found on every attempt -- for any connection where
  // the selected upstream isn't itself a native Responses-API passthrough.
  // The client's own request is always Responses-API shaped (this store only
  // fires for sourceFormat === OPENAI_RESPONSES, see chat.ts), so
  // clientRawRequest is the correct source regardless of upstream shape.
  insertCallLog({
    id: "log-6",
    responseId: "resp_gen-translate-mode",
    apiKeyId: "key-1",
    detailState: "ready",
    artifactRelPath: "2026-01-01/log-6.json",
  });
  writeArtifact("2026-01-01/log-6.json", {
    clientRawRequest: { body: { input: [{ type: "message", role: "user", content: "hi" }] } },
    providerRequest: {
      body: { model: "laguna-s-2.1-free", messages: [{ role: "user", content: "hi" }] },
    },
    clientResponse: {
      summary: {
        id: "resp_gen-translate-mode",
        output: [{ type: "message", role: "assistant", content: "hello" }],
      },
    },
  });

  const result = store.resolvePreviousResponseState("resp_gen-translate-mode", "key-1");
  assert.deepEqual(result, {
    input: [{ type: "message", role: "user", content: "hi" }],
    output: [{ type: "message", role: "assistant", content: "hello" }],
  });
});

test("resolvePreviousResponseState fails closed when the stored input array was log-truncated", () => {
  // Real production shape: cloneBoundedChatLogPayload (chatCore/logTruncation.ts)
  // and cloneBoundedForLog (utils/requestLogger.ts) both prepend an
  // `_omniroute_truncated_array` sentinel in place of the items they dropped
  // once a logged array exceeds their tail-item cap (~24 items) -- routine
  // for any conversation that's been going a while, not an edge case. Reading
  // that sentinel back as a real Responses-API item and forwarding it upstream
  // produced a live 400: "input item type 'missing' cannot be represented in
  // Chat Completions" -- worse than the plain cache-miss this function is
  // otherwise designed to fail into.
  insertCallLog({
    id: "log-7",
    responseId: "resp_gen-truncated-history",
    apiKeyId: "key-1",
    detailState: "ready",
    artifactRelPath: "2026-01-01/log-7.json",
  });
  writeArtifact("2026-01-01/log-7.json", {
    clientRawRequest: {
      body: {
        input: [
          { _omniroute_truncated_array: true, originalLength: 26, retainedTailItems: 24 },
          { type: "function_call_output", call_id: "call_1", output: "ok" },
        ],
      },
    },
    providerRequest: { body: { input: [] } },
    clientResponse: {
      summary: {
        id: "resp_gen-truncated-history",
        output: [{ type: "message", role: "assistant", content: "hello" }],
      },
    },
  });

  assert.equal(store.resolvePreviousResponseState("resp_gen-truncated-history", "key-1"), null);
});

test("resolvePreviousResponseState returns null when detail logging was never captured for this row", () => {
  insertCallLog({
    id: "log-5",
    responseId: "resp_no_detail",
    apiKeyId: "key-1",
    detailState: "none",
    artifactRelPath: null,
  });

  assert.equal(store.resolvePreviousResponseState("resp_no_detail", "key-1"), null);
});
