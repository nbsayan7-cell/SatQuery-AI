import { randomUUID } from "node:crypto";

import {
  BaseExecutor,
  mergeUpstreamExtraHeaders,
  type ExecuteInput,
  type ProviderCredentials,
} from "./base.ts";
import { PROVIDERS } from "../config/constants.ts";
import { buildErrorBody } from "../utils/error.ts";

type JsonRecord = Record<string, unknown>;
type OpenAIMessage = {
  role?: string;
  content?: unknown;
};

const CHAT_URL = "https://api.1min.ai/api/chat-with-ai";
const ROLE_LABELS: Record<string, string> = {
  system: "System",
  developer: "System",
  user: "User",
  assistant: "Assistant",
};

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function extractTextContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (!part || typeof part !== "object") return "";
      const item = part as Record<string, unknown>;
      return item.type === "text" && typeof item.text === "string" ? item.text : "";
    })
    .filter((text) => text.length > 0)
    .join("\n");
}

/**
 * 1min.ai's Chat with AI API takes one `promptObject.prompt` string, not an
 * OpenAI `messages` array — multi-turn context is normally carried server-side
 * via `promptObject.conversationId` (see docs.1min.ai/docs/api/chat-with-ai-api),
 * which requires a prior POST /api/conversations call and a stable conversation
 * identity that stateless OpenAI-compatible clients don't provide. Rather than
 * half-implement that, a single user message passes through unchanged and
 * multi-turn history is flattened into a labeled transcript.
 */
export function buildPrompt(messages: OpenAIMessage[] | undefined): string {
  const list = Array.isArray(messages) ? messages : [];
  if (list.length === 1 && list[0]?.role === "user") {
    return extractTextContent(list[0].content);
  }
  return list
    .map((message) => {
      const role = String(message?.role || "user").toLowerCase();
      const text = extractTextContent(message?.content);
      const label = ROLE_LABELS[role] || role;
      return `${label}: ${text}`;
    })
    .filter((line) => line.length > 0)
    .join("\n\n");
}

function buildSseChunk(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function buildOpenAiJsonCompletion(content: string, model: string, id: string, created: number): Response {
  return new Response(
    JSON.stringify({
      id,
      object: "chat.completion",
      created,
      model,
      choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
      // 1min.ai's response shape carries no token-usage fields.
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function toOpenAiErrorResponse(status: number, message: string, upstreamDetails?: unknown): Response {
  return new Response(JSON.stringify(buildErrorBody(status, message, upstreamDetails)), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Parse 1min.ai's real Server-Sent Events (event: content|result|done|error,
 * data: {...}) from the upstream Response body and re-emit them as standard
 * OpenAI chat.completion.chunk SSE.
 */
function translateSseStream(upstreamBody: ReadableStream<Uint8Array>, model: string, id: string, created: number): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          buildSseChunk({
            id,
            object: "chat.completion.chunk",
            created,
            model,
            choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null }],
          })
        )
      );

      const reader = upstreamBody.getReader();
      let buffer = "";
      let finished = false;

      const finish = () => {
        if (finished) return;
        finished = true;
        controller.enqueue(
          encoder.encode(
            buildSseChunk({
              id,
              object: "chat.completion.chunk",
              created,
              model,
              choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
            })
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      };

      const emitContent = (text: string) => {
        if (!text) return;
        controller.enqueue(
          encoder.encode(
            buildSseChunk({
              id,
              object: "chat.completion.chunk",
              created,
              model,
              choices: [{ index: 0, delta: { content: text }, finish_reason: null }],
            })
          )
        );
      };

      // SSE event framing: "event:"/"data:" lines, blank-line separated records.
      const processEvent = (eventText: string) => {
        let eventType = "message";
        const dataLines: string[] = [];
        for (const rawLine of eventText.split("\n")) {
          if (rawLine.startsWith("event:")) {
            eventType = rawLine.slice(6).trim();
          } else if (rawLine.startsWith("data:")) {
            dataLines.push(rawLine.slice(5).trim());
          }
        }
        const data = dataLines.join("\n");
        if (eventType === "content") {
          try {
            const parsed = asRecord(JSON.parse(data));
            if (typeof parsed.content === "string") emitContent(parsed.content);
          } catch {
            // Ignore malformed content events rather than surfacing partial JSON.
          }
        } else if (eventType === "error") {
          emitContent(`\n[1min.ai error: ${data}]`);
          finish();
        } else if (eventType === "done") {
          finish();
        }
        // "result" carries the final full aiRecord, redundant with the content
        // events already streamed — intentionally ignored.
      };

      try {
        while (!finished) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let separatorIndex = buffer.indexOf("\n\n");
          while (separatorIndex !== -1) {
            processEvent(buffer.slice(0, separatorIndex));
            buffer = buffer.slice(separatorIndex + 2);
            separatorIndex = buffer.indexOf("\n\n");
          }
        }
        if (!finished && buffer.trim()) processEvent(buffer);
        finish();
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

export class OneMinAiExecutor extends BaseExecutor {
  constructor() {
    super("oneminai", PROVIDERS["oneminai"] || { format: "openai", baseUrl: CHAT_URL });
  }

  buildUrl(_model: string, stream: boolean): string {
    return stream ? `${CHAT_URL}?isStreaming=true` : CHAT_URL;
  }

  buildHeaders(credentials: ProviderCredentials | null): Record<string, string> {
    const key = credentials?.apiKey || credentials?.accessToken || "";
    return {
      "Content-Type": "application/json",
      "API-KEY": key,
    };
  }

  transformRequest(model: string, body: unknown): JsonRecord {
    const payload = asRecord(body);
    const messages = Array.isArray(payload.messages) ? (payload.messages as OpenAIMessage[]) : [];
    return {
      type: "UNIFY_CHAT_WITH_AI",
      model,
      promptObject: { prompt: buildPrompt(messages) },
    };
  }

  async execute({ model, body, stream, credentials, signal, upstreamExtraHeaders }: ExecuteInput) {
    const url = this.buildUrl(model, stream);
    const headers = this.buildHeaders(credentials);
    mergeUpstreamExtraHeaders(headers, upstreamExtraHeaders);
    const payload = this.transformRequest(model, body);

    const id = `chatcmpl-oneminai-${randomUUID()}`;
    const created = Math.floor(Date.now() / 1000);

    try {
      this.assertOutboundUrlAllowed(url);
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let message = `1min.ai API failed with status ${response.status}`;
        try {
          const parsed = asRecord(JSON.parse(errorText));
          const err = asRecord(parsed.error);
          if (typeof err.message === "string") message = err.message;
        } catch {
          if (errorText) message = errorText;
        }
        return {
          response: toOpenAiErrorResponse(response.status, message),
          url,
          headers,
          transformedBody: payload,
        };
      }

      if (stream) {
        if (!response.body) {
          return {
            response: toOpenAiErrorResponse(502, "1min.ai returned an empty stream"),
            url,
            headers,
            transformedBody: payload,
          };
        }
        return {
          response: new Response(translateSseStream(response.body, model, id, created), {
            status: 200,
            headers: { "Content-Type": "text/event-stream" },
          }),
          url,
          headers,
          transformedBody: payload,
        };
      }

      const json = asRecord(await response.json());
      const aiRecord = asRecord(json.aiRecord);
      const detail = asRecord(aiRecord.aiRecordDetail);
      const resultObject = Array.isArray(detail.resultObject) ? detail.resultObject : [];
      const content = resultObject.filter((part): part is string => typeof part === "string").join("");

      return {
        response: buildOpenAiJsonCompletion(content, model, id, created),
        url,
        headers,
        transformedBody: payload,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error || "Unknown error");
      return {
        response: toOpenAiErrorResponse(502, `1min.ai fetch error: ${message}`),
        url,
        headers,
        transformedBody: payload,
      };
    }
  }
}

export default OneMinAiExecutor;
