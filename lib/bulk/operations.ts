import { normalizeGame, type GameRecord } from "../game-fields";
import { normalizeGamePositions } from "../priority";
import { createBulkMutationResult, type BulkMutationResult } from "./result";

export const BULK_BOOLEAN_FIELDS = [
  "owned",
  "wishlisted",
  "played",
  "finished",
  "released",
  "completed100",
] as const;

export type BulkBooleanField = (typeof BULK_BOOLEAN_FIELDS)[number];
export type BulkListField = "platforms" | "genres";

function selectedSet(selectedIds: readonly string[]): Set<string> {
  return new Set(selectedIds);
}

function updateSelected(
  games: readonly GameRecord[],
  selectedIds: readonly string[],
  update: (game: GameRecord) => GameRecord,
): GameRecord[] {
  const selected = selectedSet(selectedIds);
  return games.map((game) =>
    selected.has(game.id) ? normalizeGame(update(structuredClone(game))) : structuredClone(game),
  );
}

function valueKey(value: string): string {
  return value.trim().normalize("NFKC").toLocaleLowerCase("de-DE");
}

function uniqueValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.flatMap((rawValue) => {
    const value = rawValue.trim().normalize("NFKC");
    const key = valueKey(value);
    if (!value || seen.has(key)) return [];
    seen.add(key);
    return [value];
  });
}

export function setBulkBooleanField(
  games: readonly GameRecord[],
  selectedIds: readonly string[],
  field: BulkBooleanField,
  value: boolean,
): BulkMutationResult {
  const after = updateSelected(games, selectedIds, (game) => ({ ...game, [field]: value }));
  return createBulkMutationResult(games, after, `${field} auf ${value ? "Ja" : "Nein"} setzen`);
}

export function setBulkOwnership(
  games: readonly GameRecord[],
  selectedIds: readonly string[],
  value: boolean,
): BulkMutationResult {
  return setBulkBooleanField(games, selectedIds, "owned", value);
}

export function setBulkWishlist(
  games: readonly GameRecord[],
  selectedIds: readonly string[],
  value: boolean,
): BulkMutationResult {
  return setBulkBooleanField(games, selectedIds, "wishlisted", value);
}

export function addBulkListValues(
  games: readonly GameRecord[],
  selectedIds: readonly string[],
  field: BulkListField,
  values: readonly string[],
): BulkMutationResult {
  const additions = uniqueValues(values);
  const after = updateSelected(games, selectedIds, (game) => ({
    ...game,
    [field]: uniqueValues([...(game[field] as string[]), ...additions]),
  }));
  return createBulkMutationResult(games, after, `${field} ergänzen`);
}

export function removeBulkListValues(
  games: readonly GameRecord[],
  selectedIds: readonly string[],
  field: BulkListField,
  values: readonly string[],
): BulkMutationResult {
  const removals = new Set(values.map(valueKey));
  const after = updateSelected(games, selectedIds, (game) => ({
    ...game,
    [field]: uniqueValues(game[field] as string[]).filter((value) => !removals.has(valueKey(value))),
  }));
  return createBulkMutationResult(games, after, `${field} entfernen`);
}

export function setBulkFranchise(
  games: readonly GameRecord[],
  selectedIds: readonly string[],
  franchise: string,
): BulkMutationResult {
  const normalized = franchise.trim().normalize("NFKC");
  const after = updateSelected(games, selectedIds, (game) => ({ ...game, franchise: normalized }));
  return createBulkMutationResult(games, after, "Franchise setzen");
}

function selectedInVisibleOrder(
  games: readonly GameRecord[],
  selectedIds: readonly string[],
  visibleOrderedIds: readonly string[],
): string[] {
  const existing = new Set(games.map((game) => game.id));
  const selected = new Set(selectedIds.filter((id) => existing.has(id)));
  const result: string[] = [];
  for (const id of [...visibleOrderedIds, ...games.map((game) => game.id)]) {
    if (!selected.delete(id)) continue;
    result.push(id);
  }
  return result;
}

export function appendBulkQueue(
  games: readonly GameRecord[],
  selectedIds: readonly string[],
  visibleOrderedIds: readonly string[],
): BulkMutationResult {
  const normalized = normalizeGamePositions(games);
  const selected = selectedSet(selectedIds);
  const remainingQueue = normalized
    .filter((game) => game.queuePosition !== null && !selected.has(game.id))
    .sort((left, right) => (left.queuePosition ?? 0) - (right.queuePosition ?? 0))
    .map((game) => game.id);
  const appended = selectedInVisibleOrder(normalized, selectedIds, visibleOrderedIds);
  const positions = new Map([...remainingQueue, ...appended].map((id, index) => [id, index + 1]));
  const after = normalized.map((game) => ({
    ...game,
    queuePosition: positions.get(game.id) ?? null,
  }));
  return createBulkMutationResult(games, after, "Zur Warteschlange hinzufügen");
}

export function removeBulkQueue(
  games: readonly GameRecord[],
  selectedIds: readonly string[],
): BulkMutationResult {
  const after = updateSelected(games, selectedIds, (game) => ({ ...game, queuePosition: null }));
  return createBulkMutationResult(games, after, "Aus Warteschlange entfernen");
}

export function deleteSelectedGames(
  games: readonly GameRecord[],
  selectedIds: readonly string[],
): BulkMutationResult {
  const selected = selectedSet(selectedIds);
  const after = games.filter((game) => !selected.has(game.id)).map((game) => structuredClone(game));
  return createBulkMutationResult(games, after, "Ausgewählte Spiele löschen");
}
