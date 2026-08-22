import { defaultGameValues } from "@/lib/game-fields";
import type {
  FieldProvenance,
  LibraryGameRecordV2,
} from "@/lib/model";
import { cloneSteamImportValue } from "./internal";
import type { NormalizedSteamImportGame } from "./types";

export function steamFieldProvenance(
  source: NormalizedSteamImportGame,
  updatedAt: string,
): FieldProvenance {
  return {
    source: "steam",
    updatedAt,
    sourceRef: String(source.steamAppId),
  };
}

export function createSteamImportGame(
  source: NormalizedSteamImportGame,
  id: string,
  createdAt: string,
): LibraryGameRecordV2 {
  const defaults = cloneSteamImportValue(defaultGameValues()) as Record<
    string,
    unknown
  >;
  delete defaults.priority;
  const provenance = steamFieldProvenance(source, createdAt);
  return {
    ...defaults,
    id,
    name: source.name,
    steamAppId: source.steamAppId,
    owned: true,
    playtimeMinutes: source.playtimeMinutes,
    dateAdded: createdAt,
    lastSynced: createdAt,
    queuePosition: null,
    favoriteRank: null,
    landscapeArtwork: null,
    caseArtwork: null,
    provenance: {
      name: cloneSteamImportValue(provenance),
      steamAppId: cloneSteamImportValue(provenance),
      owned: cloneSteamImportValue(provenance),
      ...(source.playtimeMinutes !== null
        ? { playtimeMinutes: cloneSteamImportValue(provenance) }
        : {}),
      lastSynced: cloneSteamImportValue(provenance),
    },
  } as unknown as LibraryGameRecordV2;
}

export function updateSteamImportGame(
  source: NormalizedSteamImportGame,
  existing: LibraryGameRecordV2,
  updatedAt: string,
): LibraryGameRecordV2 | null {
  const changes: Partial<LibraryGameRecordV2> = {};
  const changedFields: string[] = [];
  if (existing.steamAppId === null) {
    changes.steamAppId = source.steamAppId;
    changedFields.push("steamAppId");
  }
  if (!existing.owned) {
    changes.owned = true;
    changedFields.push("owned");
  }
  if (
    source.playtimeMinutes !== null &&
    existing.playtimeMinutes !== source.playtimeMinutes
  ) {
    changes.playtimeMinutes = source.playtimeMinutes;
    changedFields.push("playtimeMinutes");
  }
  if (changedFields.length === 0) return null;

  const provenance = steamFieldProvenance(source, updatedAt);
  return {
    ...cloneSteamImportValue(existing),
    ...changes,
    lastSynced: updatedAt,
    provenance: {
      ...cloneSteamImportValue(existing.provenance),
      ...Object.fromEntries(
        [...changedFields, "lastSynced"].map((field) => [
          field,
          cloneSteamImportValue(provenance),
        ]),
      ),
    },
  };
}
