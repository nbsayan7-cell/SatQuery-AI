/**
 * Synced-model catalog `capabilities` builder (#7694).
 *
 * Extracted from catalog.ts (frozen file-size baseline — `config/quality/file-size-baseline.json`)
 * to keep the vision (#4264) and reasoning-effort-tier (#7694) flags merged into a SINGLE
 * `capabilities` object rather than two separate spreads that would silently overwrite one
 * another via object-spread order. A model can be both vision- and reasoning-capable.
 *
 * effort_tiers loop (2026-08-23): a runtime-learned accepted set (#11232,
 * learnedReasoningEffortCaps) REPLACES the synced `supportedThinkingEfforts`
 * when one exists — the proven contract beats the advertised one. Lookup is
 * model-scoped: executors record under connection ids while this module sees
 * provider ids, so an exact provider:model key would always miss.
 *
 * Exclusion gate: `ownedBy` is REQUIRED and checked against
 * `isSkippedEffortProvider` (codex/glm/kimi — providers that already own a
 * conflicting `-{effort}` suffix mechanism, see syncedEffortVariants.ts, #7694).
 * Without this, the blind opencode-plugin mapping (`capabilities.effort_tiers`
 * -> ModelV2 `variants`) would double-handle those providers' native suffix
 * ids. `shouldExposeSyncedEffortVariants` gates only the *synthetic*
 * `<id>-<tier>` catalog entries (open-sse/utils/syncedEffortVariants.ts) — it
 * never runs over the base entry's `capabilities`, so it cannot substitute
 * for this check. Required (not optional) so no call site can silently skip it.
 */
// Use the same canonical alias as catalogModelPolicy.ts (l.1) — a relative path from
// src/app/api/v1/models/ to open-sse/ would need 5 `../` and silently breaks under
// refactors. (Confirmed convention: grep "from \"@omniroute/open-sse" src/app/api/v1/models/)
import { getLearnedReasoningEffortForModel } from "@omniroute/open-sse/services/learnedReasoningEffortCaps.ts";
import { isSkippedEffortProvider } from "@omniroute/open-sse/utils/syncedEffortVariants.ts";
import {
  getRegistryModelThinkingEfforts,
  getRegistryThinkingEfforts,
} from "@omniroute/open-sse/config/providerRegistry.ts";

interface SyncedCapabilityFlags {
  id?: string;
  supportsThinking?: boolean;
  supportsVision?: boolean;
  supportedThinkingEfforts?: string[];
}

function effectiveEffortTiers(sm: SyncedCapabilityFlags, ownedBy: string): string[] | undefined {
  if (isSkippedEffortProvider(ownedBy)) return undefined;
  const learned = sm.id ? getLearnedReasoningEffortForModel(sm.id) : null;
  const synced =
    Array.isArray(sm.supportedThinkingEfforts) && sm.supportedThinkingEfforts.length > 0
      ? sm.supportedThinkingEfforts
      : null;
  const explicit = sm.id ? getRegistryModelThinkingEfforts(ownedBy, sm.id) : undefined;
  if (explicit) {
    const observed = learned ? [...learned] : synced;
    const narrowed = observed
      ? explicit.filter((effort) => observed.includes(effort))
      : [...explicit];
    return narrowed.length > 0 ? narrowed : undefined;
  }
  if (learned) return [...learned];
  if (synced) return synced;
  if (!sm.supportsThinking || !sm.id) return undefined;
  const registryEfforts = getRegistryThinkingEfforts(ownedBy, sm.id);
  return registryEfforts && registryEfforts.length > 0 ? [...registryEfforts] : undefined;
}

/** Build the `capabilities` object for a fresh synced-model catalog entry, or `undefined` when neither flag applies. */
export function buildSyncedCapabilities(
  sm: SyncedCapabilityFlags,
  ownedBy: string
): Record<string, boolean | string[]> | undefined {
  const tiers = effectiveEffortTiers(sm, ownedBy);
  if (!sm.supportsVision && !tiers) return undefined;
  return {
    ...(sm.supportsVision ? { vision: true } : {}),
    ...(tiers ? { effort_tiers: tiers } : {}),
  };
}

/**
 * Merge (not clobber) capabilities onto an already-catalogued entry so syncing a
 * vision/effort-tier flag onto a registry/combo model that already declares other
 * capabilities keeps both. Returns `undefined` when there is nothing to merge.
 */
export function mergeSyncedCapabilities(
  existing: Record<string, unknown> | undefined,
  sm: SyncedCapabilityFlags,
  ownedBy: string
): Record<string, unknown> | undefined {
  const tiers = effectiveEffortTiers(sm, ownedBy);
  if (!sm.supportsVision && !tiers && !existing) return undefined;
  return {
    ...(existing || {}),
    ...(sm.supportsVision ? { vision: true } : {}),
    ...(tiers ? { effort_tiers: tiers } : {}),
  };
}
