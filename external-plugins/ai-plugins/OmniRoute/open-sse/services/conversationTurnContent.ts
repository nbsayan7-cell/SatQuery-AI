/**
 * conversationTurnContent.ts — resolves a conversation_turn_nodes row's
 * actual display text/tool-call shape on demand, instead of storing it.
 *
 * conversation_turn_nodes (migration 156) is identity-only: id/parent/
 * content_hash, no turn text. Every node's originating request is already
 * fully captured by the call-log pipeline artifact its `last_correlation_id`
 * points at (call_logs.artifact_relpath, behind call_log_pipeline_enabled),
 * so display content is re-derived from there on read instead of duplicating
 * it into a second store: load the artifact's raw client request body, run
 * it back through the SAME extractCanonicalTurns/hashTurnContent the write
 * path used, and match by content_hash. This also gives full, untruncated
 * text where the old stored text_preview was capped at 8000 chars.
 */

import { getDbInstance } from "../../src/lib/db/core.ts";
import { readCallArtifact } from "../../src/lib/usage/callLogArtifacts.ts";
import { extractCanonicalTurns, hashTurnContent } from "./conversationTracker.ts";

export type TurnDisplayContent = {
  textPreview: string;
  blockKind: "text" | "tool_use" | "tool_result";
  toolName: string | null;
};

/**
 * Resolve display content for a batch of turn nodes, keyed by content_hash.
 * Content_hash is sha256(role+text) only — real traffic has plenty of
 * byte-identical repeated turns (a tool-polling "still running" ack), so
 * distinct nodes legitimately share one hash; since the hash is exactly the
 * display text's own identity, resolving once per unique hash is correct,
 * not lossy, and avoids redundant artifact reads for a request that touched
 * many nodes at once.
 */
export function resolveTurnDisplayContent(
  nodes: ReadonlyArray<{ lastCorrelationId: string | null }>
): Map<string, TurnDisplayContent> {
  const result = new Map<string, TurnDisplayContent>();
  const correlationIds = [
    ...new Set(nodes.map((n) => n.lastCorrelationId).filter((v): v is string => !!v)),
  ];
  if (correlationIds.length === 0) return result;

  const db = getDbInstance();
  const placeholders = correlationIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT correlation_id, artifact_relpath FROM call_logs
       WHERE correlation_id IN (${placeholders}) AND artifact_relpath IS NOT NULL
       ORDER BY timestamp ASC`
    )
    .all(...correlationIds) as Array<{ correlation_id: string; artifact_relpath: string }>;

  // A retry/combo-fallback attempt can share one correlation_id across a few
  // call_logs rows; they all carry the same client-facing request body, so
  // any one artifact is a valid content source — keep the first.
  const artifactPathByCorrelationId = new Map<string, string>();
  for (const row of rows) {
    if (!artifactPathByCorrelationId.has(row.correlation_id)) {
      artifactPathByCorrelationId.set(row.correlation_id, row.artifact_relpath);
    }
  }

  for (const relPath of artifactPathByCorrelationId.values()) {
    const { artifact, state } = readCallArtifact(relPath);
    if (state !== "ready") continue;
    const clientRawRequest = artifact?.pipeline?.clientRawRequest as { body?: unknown } | undefined;
    const body = clientRawRequest?.body;
    if (!body || typeof body !== "object") continue;

    for (const turn of extractCanonicalTurns(body as Record<string, unknown>)) {
      const hash = hashTurnContent(turn);
      if (result.has(hash)) continue;
      result.set(hash, {
        textPreview: turn.text,
        blockKind: turn.blockKind,
        toolName: turn.toolName,
      });
    }
  }
  return result;
}
