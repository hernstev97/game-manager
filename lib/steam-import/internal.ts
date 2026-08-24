import type { ImportConflict, LibraryGameRecordV2 } from "@/lib/model";
import type {
  SteamImportComparisonItem,
  SteamImportResolution,
} from "./types";

export type ResolvedSteamTarget = {
  item: SteamImportComparisonItem;
  gameId: string;
  existing?: LibraryGameRecordV2;
};

export function cloneSteamImportValue<T>(value: T): T {
  return structuredClone(value);
}

export function steamImportTimestamp(value?: string): string {
  const date = value === undefined ? new Date() : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Steam import plan requires a valid timestamp");
  }
  return date.toISOString();
}

export function fallbackSteamImportId(
  kind: "plan" | "game" | "job",
): string {
  const random = globalThis.crypto?.randomUUID?.();
  return random
    ? `${kind}-${random}`
    : `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function unresolvedSteamConflict(
  item: SteamImportComparisonItem,
  existingIds: readonly string[],
  suffix = "unresolved",
): ImportConflict {
  return {
    id: `steam:${item.source.steamAppId}:${suffix}`,
    entity: "game",
    code:
      item.reason === "conflicting-external-identities"
        ? "conflicting-external-identities"
        : "ambiguous-identity",
    incomingId: String(item.source.steamAppId),
    existingIds: [...existingIds],
    allowedResolutions: [
      "use-incoming",
      "keep-existing",
      "import-as-new",
      "cancel-import",
    ],
  };
}

export function resolvedSteamConflict(
  conflict: ImportConflict,
  resolution: SteamImportResolution,
): ImportConflict {
  return {
    ...conflict,
    resolution:
      resolution.kind === "existing" ? "use-incoming" : "import-as-new",
  };
}
