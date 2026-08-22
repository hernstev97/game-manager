import type { GameRecord } from "./game-fields";
import type { PositionField } from "./model/shared";

type PositionedGame = {
  id: string;
  queuePosition: number | null;
  favoriteRank: number | null;
} & Record<string, unknown>;

function validPosition(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

/** Normalizes one position field without touching the other position or rating. */
export function normalizePositionField<T extends PositionedGame>(
  games: readonly T[],
  field: PositionField,
): T[] {
  const members = games
    .map((game, documentOrder) => ({
      game,
      documentOrder,
      candidate: validPosition(game[field]),
    }))
    .filter(
      (entry): entry is typeof entry & { candidate: number } =>
        entry.candidate !== null,
    )
    .sort(
      (a, b) =>
        a.candidate - b.candidate ||
        a.documentOrder - b.documentOrder ||
        a.game.id.localeCompare(b.game.id),
    );
  const positions = new Map(
    members.map((entry, index) => [entry.game.id, index + 1]),
  );
  return games.map((game) => ({
    ...game,
    [field]: positions.get(game.id) ?? null,
  }));
}

export function normalizeGamePositions<T extends PositionedGame>(
  games: readonly T[],
): T[] {
  return normalizePositionField<T>(
    normalizePositionField<T>(games, "queuePosition"),
    "favoriteRank",
  );
}

function ranked<T extends PositionedGame>(
  games: readonly T[],
  field: PositionField,
): T[] {
  return normalizePositionField(games, field)
    .filter((game) => game[field] !== null)
    .sort((a, b) => (a[field] ?? 0) - (b[field] ?? 0));
}

export function assignPosition<T extends PositionedGame>(
  games: readonly T[],
  id: string,
  field: PositionField,
  position: number | null,
): T[] {
  const normalized = normalizePositionField(games, field);
  if (position === null || !Number.isFinite(position) || position <= 0) {
    return normalizePositionField(
      normalized.map((game) =>
        game.id === id ? ({ ...game, [field]: null } as T) : game,
      ),
      field,
    );
  }

  const target = normalized.find((game) => game.id === id);
  if (!target) return normalized;
  const others = ranked(normalized, field).filter((game) => game.id !== id);
  const slot = Math.max(1, Math.min(Math.round(position), others.length + 1));
  const next = [...others];
  next.splice(slot - 1, 0, target);
  const positions = new Map(next.map((game, index) => [game.id, index + 1]));
  return normalized.map((game) => ({
    ...game,
    [field]: positions.get(game.id) ?? null,
  }));
}

export function reorderVisiblePositions<T extends PositionedGame>(
  games: readonly T[],
  visibleOrderedIds: readonly string[],
  field: PositionField,
): T[] {
  const normalized = normalizePositionField(games, field);
  const allRanked = ranked(normalized, field);
  const existingIds = new Set(allRanked.map((game) => game.id));
  const visible = [...new Set(visibleOrderedIds)].filter((id) =>
    existingIds.has(id),
  );
  const visibleSet = new Set(visible);
  const queue = [...visible];
  const merged = allRanked.map((game) =>
    visibleSet.has(game.id) ? queue.shift() ?? game.id : game.id,
  );
  const positions = new Map(merged.map((id, index) => [id, index + 1]));
  return normalized.map((game) => ({
    ...game,
    [field]: positions.get(game.id) ?? null,
  }));
}

function mirrorLegacyPriority(games: readonly GameRecord[]): GameRecord[] {
  return games.map((game) => ({ ...game, priority: game.queuePosition }));
}

/** @deprecated Use normalizePositionField(games, "queuePosition"). */
export function compactPriorities(games: readonly GameRecord[]): GameRecord[] {
  return mirrorLegacyPriority(normalizePositionField(games, "queuePosition"));
}

/** @deprecated Use assignPosition with queuePosition. */
export function assignPriority(
  games: readonly GameRecord[],
  id: string,
  priority: number | null,
): GameRecord[] {
  return mirrorLegacyPriority(
    assignPosition(games, id, "queuePosition", priority),
  );
}

/** @deprecated Use assignPosition with queuePosition. */
export function movePriorityToFront(
  games: readonly GameRecord[],
  id: string,
): GameRecord[] {
  return assignPriority(games, id, 1);
}

/** @deprecated Use reorderVisiblePositions with queuePosition. */
export function reorderVisiblePriorities(
  games: readonly GameRecord[],
  visibleOrderedIds: string[],
): GameRecord[] {
  return mirrorLegacyPriority(
    reorderVisiblePositions(games, visibleOrderedIds, "queuePosition"),
  );
}
