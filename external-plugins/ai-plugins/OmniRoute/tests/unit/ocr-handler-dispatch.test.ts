import { test } from "node:test";
import assert from "node:assert/strict";
import { handleOcr } from "../../open-sse/handlers/ocr.ts";

function fetchStub(
  script: Array<{ status: number; headers?: Record<string, string>; json?: unknown }>
) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const impl = async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const step = script.shift()!;
    return new Response(step.json !== undefined ? JSON.stringify(step.json) : null, {
      status: step.status,
      headers: { "Content-Type": "application/json", ...(step.headers ?? {}) },
    });
  };
  return { impl, calls };
}

const noSleep = async () => {};

test("mistral path posts once and returns the upstream body", async () => {
  const { impl, calls } = fetchStub([
    { status: 200, json: { pages: [{ index: 0, markdown: "ok" }], model: "mistral-ocr-latest" } },
  ]);
  const res = await handleOcr({
    body: {
      model: "mistral/mistral-ocr-latest",
      document: { type: "image_url", image_url: "https://x/y.png" },
    },
    credentials: { apiKey: "sk" },
    fetchImpl: impl,
    sleepImpl: noSleep,
  });
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  const data = await res.json();
  assert.equal(data.pages[0].markdown, "ok");
});

test("azure DI path polls Operation-Location until succeeded", async () => {
  const { impl, calls } = fetchStub([
    { status: 202, headers: { "Operation-Location": "https://poll/op/1" } },
    { status: 200, json: { status: "running" } },
    { status: 200, json: { status: "succeeded", analyzeResult: { content: "# md", pages: [{}] } } },
  ]);
  const res = await handleOcr({
    body: {
      model: "azure-document-intelligence/prebuilt-read",
      document: { type: "document_url", document_url: "https://x/d.pdf" },
    },
    credentials: { apiKey: "azkey", baseUrl: "https://r.cognitiveservices.azure.com" },
    fetchImpl: impl,
    sleepImpl: noSleep,
  });
  assert.equal(res.status, 200);
  assert.ok(calls.length >= 3);
  const data = await res.json();
  assert.equal(data.pages[0].markdown, "# md");
});

test("unknown model lists available providers dynamically and errors do not leak internals", async () => {
  const res = await handleOcr({
    body: { model: "nope/none", document: { type: "image_url", image_url: "https://x" } },
    credentials: { apiKey: "k" },
    fetchImpl: async () => new Response("{}", { status: 200 }),
    sleepImpl: noSleep,
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.error.message.includes("azure-document-intelligence"));
  assert.ok(!body.error.message.includes("at /"));
});

test("azure DI poll returns failed status maps to 502", async () => {
  const { impl } = fetchStub([
    { status: 202, headers: { "Operation-Location": "https://poll/op/1" } },
    { status: 200, json: { status: "failed" } },
  ]);
  const res = await handleOcr({
    body: {
      model: "azure-document-intelligence/prebuilt-read",
      document: { type: "document_url", document_url: "https://x/d.pdf" },
    },
    credentials: { apiKey: "azkey", baseUrl: "https://r.cognitiveservices.azure.com" },
    fetchImpl: impl,
    sleepImpl: noSleep,
  });
  assert.equal(res.status, 502);
  const body = await res.json();
  assert.ok(!body.error.message.includes("at /"));
});

test("azure DI poll returns a non-ok response (401) and fails fast without exhausting the loop", async () => {
  const { impl, calls } = fetchStub([
    { status: 202, headers: { "Operation-Location": "https://poll/op/1" } },
    { status: 401, json: { error: "unauthorized" } },
  ]);
  const res = await handleOcr({
    body: {
      model: "azure-document-intelligence/prebuilt-read",
      document: { type: "document_url", document_url: "https://x/d.pdf" },
    },
    credentials: { apiKey: "azkey", baseUrl: "https://r.cognitiveservices.azure.com" },
    fetchImpl: impl,
    sleepImpl: noSleep,
  });
  assert.equal(res.status, 502);
  // 1 initial POST + 1 poll: the loop stopped immediately, it did not run all 30 attempts.
  assert.equal(calls.length, 2);
  const body = await res.json();
  assert.ok(!body.error.message.includes("at /"));
});

test("azure DI poll never resolves and times out after 30 attempts with a 504", async () => {
  const script = [{ status: 202, headers: { "Operation-Location": "https://poll/op/1" } }];
  for (let i = 0; i < 30; i++) {
    script.push({ status: 200, json: { status: "running" } });
  }
  const { impl, calls } = fetchStub(script);
  const res = await handleOcr({
    body: {
      model: "azure-document-intelligence/prebuilt-read",
      document: { type: "document_url", document_url: "https://x/d.pdf" },
    },
    credentials: { apiKey: "azkey", baseUrl: "https://r.cognitiveservices.azure.com" },
    fetchImpl: impl,
    sleepImpl: noSleep,
  });
  assert.equal(res.status, 504);
  // 1 initial POST + 30 poll attempts (the max cap), no more.
  assert.equal(calls.length, 31);
});
