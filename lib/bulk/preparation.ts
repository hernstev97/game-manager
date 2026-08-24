import type { GameRecord } from "../game-fields";
import type { JsonObject, JsonValue, LibraryDocumentV2 } from "../model";
import { canonicalDocumentForWrite } from "../persistence/migration";

export type PreparedMetadataJob = {
  kind: "metadata-refresh";
  payload: JsonObject;
};

const SECRET_KEY = /(authorization|credential|password|secret|token|api[-_]?key)/i;

function stripSecrets(value: unknown): JsonValue {
  if (Array.isArray(value)) return value.map(stripSecrets);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SECRET_KEY.test(key) && key !== "sensitive")
        .map(([key, item]) => [key, stripSecrets(item)]),
    );
  }
  return value as JsonValue;
}

function selectedInOrder(
  games: readonly Pick<GameRecord, "id">[],
  selectedIds: readonly string[],
  visibleOrderedIds: readonly string[],
): string[] {
  const selected = new Set(selectedIds);
  const existing = new Set(games.map((game) => game.id));
  const ordered: string[] = [];
  for (const id of [...visibleOrderedIds, ...games.map((game) => game.id)]) {
    if (!existing.has(id) || !selected.delete(id)) continue;
    ordered.push(id);
  }
  return ordered;
}

/** Produces a queueable descriptor; it never enqueues or executes network work. */
export function prepareMetadataJob(
  games: readonly Pick<GameRecord, "id">[],
  selectedIds: readonly string[],
  visibleOrderedIds: readonly string[],
  requestedFields: readonly string[] = [],
): PreparedMetadataJob {
  const fields = [...new Set(requestedFields.map((field) => field.trim()).filter(Boolean))];
  return {
    kind: "metadata-refresh",
    payload: {
      scope: "selected-games",
      gameIds: selectedInOrder(games, selectedIds, visibleOrderedIds),
      requestedFields: fields,
    },
  };
}

/** Creates a canonical v2 partial document and recursively excludes credential-like extensions. */
export function prepareSelectionDocument(
  document: LibraryDocumentV2,
  selectedIds: readonly string[],
  exportedAt: string,
): LibraryDocumentV2 {
  const selected = new Set(selectedIds);
  const sanitized = stripSecrets(document) as LibraryDocumentV2;
  return canonicalDocumentForWrite({
    ...sanitized,
    exportedAt,
    games: sanitized.games.filter((game) => selected.has(game.id)),
  });
}
