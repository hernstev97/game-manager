import type { GameRecord } from "./game-fields";
import type { PositionField } from "./model/shared";

export type PositionedGame = {
  id: string;
  queuePosition: number | null;
  favoriteRank: number | null;
} & Record<string, unknown>;

function validPosition(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function rankedDocumentOrders<T extends PositionedGame>(
  games: readonly T[],
  field: PositionField,
): number[] {
  return games
    .map((game, documentOrder) => ({
      candidate: validPosition(game[field]),
      documentOrder,
      id: game.id,
    }))
    .filter(
      (entry): entry is typeof entry & { candidate: number } =>
        entry.candidate !== null,
    )
    .sort(
      (left, right) =>
        left.candidate - right.candidate ||
        left.documentOrder - right.documentOrder ||
        left.id.localeCompare(right.id),
    )
    .map((entry) => entry.documentOrder);
}

function applyDocumentOrder<T extends PositionedGame>(
  games: readonly T[],
  field: PositionField,
  rankedOrders: readonly number[],
): T[] {
  const positions = new Map(
    rankedOrders.map((documentOrder, index) => [documentOrder, index + 1]),
  );
  return games.map(
    (game, documentOrder) =>
      ({ ...game, [field]: positions.get(documentOrder) ?? null }) as T,
  );
}

/** Normalizes one position field without touching the other position or rating. */
export function normalizePositionField<T extends PositionedGame>(
  games: readonly T[],
  field: PositionField,
): T[] {
  return applyDocumentOrder(games, field, rankedDocumentOrders(games, field));
}

/** Normalizes both independent lists after whole-game mutations such as delete. */
export function normalizeGamePositions<T extends PositionedGame>(
  games: readonly T[],
): T[] {
  return normalizePositionField(
    normalizePositionField(games, "queuePosition"),
    "favoriteRank",
  );
}

export function assignPosition<T extends PositionedGame>(
  games: readonly T[],
  id: string,
  field: PositionField,
  position: number | null,
): T[] {
  const normalized = normalizePositionField(games, field);
  const targetOrder = normalized.findIndex((game) => game.id === id);
  if (targetOrder < 0) return normalized;

  if (position === null || !Number.isFinite(position) || position <= 0) {
    return normalizePositionField(
      normalized.map((game, documentOrder) =>
        documentOrder === targetOrder
          ? ({ ...game, [field]: null } as T)
          : game,
      ),
      field,
    );
  }

  const rankedOrders = rankedDocumentOrders(normalized, field).filter(
    (documentOrder) => documentOrder !== targetOrder,
  );
  const slot = Math.max(
    1,
    Math.min(Math.round(position), rankedOrders.length + 1),
  );
  rankedOrders.splice(slot - 1, 0, targetOrder);
  return applyDocumentOrder(normalized, field, rankedOrders);
}

/** Reorders only the supplied visible members; hidden members keep their slots. */
export function reorderVisiblePositions<T extends PositionedGame>(
  games: readonly T[],
  visibleOrderedIds: readonly string[],
  field: PositionField,
): T[] {
  const normalized = normalizePositionField(games, field);
  const rankedOrders = rankedDocumentOrders(normalized, field);
  const firstOrderById = new Map<string, number>();
  for (const documentOrder of rankedOrders) {
    const id = normalized[documentOrder]?.id;
    if (id !== undefined && !firstOrderById.has(id)) {
      firstOrderById.set(id, documentOrder);
    }
  }

  const visibleOrders: number[] = [];
  const seen = new Set<number>();
  for (const id of visibleOrderedIds) {
    const documentOrder = firstOrderById.get(id);
    if (documentOrder === undefined || seen.has(documentOrder)) continue;
    seen.add(documentOrder);
    visibleOrders.push(documentOrder);
  }

  const visibleSet = new Set(visibleOrders);
  const replacements = [...visibleOrders];
  const merged = rankedOrders.map((documentOrder) =>
    visibleSet.has(documentOrder)
      ? (replacements.shift() ?? documentOrder)
      : documentOrder,
  );
  return applyDocumentOrder(normalized, field, merged);
}

export function deleteGamesAndNormalizePositions<T extends PositionedGame>(
  games: readonly T[],
  deletedIds: readonly string[],
): T[] {
  const deleted = new Set(deletedIds);
  return normalizeGamePositions(games.filter((game) => !deleted.has(game.id)));
}

export function setFavoriteRank<T extends PositionedGame>(
  games: readonly T[],
  id: string,
  rank: number,
): T[] {
  return assignPosition(games, id, "favoriteRank", rank);
}

export function removeFavoriteRank<T extends PositionedGame>(
  games: readonly T[],
  id: string,
): T[] {
  return assignPosition(games, id, "favoriteRank", null);
}

export function moveFavoriteToFirst<T extends PositionedGame>(
  games: readonly T[],
  id: string,
): T[] {
  return setFavoriteRank(games, id, 1);
}

export function reorderVisibleFavorites<T extends PositionedGame>(
  games: readonly T[],
  visibleOrderedIds: readonly string[],
): T[] {
  return reorderVisiblePositions(games, visibleOrderedIds, "favoriteRank");
}

export function insertQueueFirst<T extends PositionedGame>(
  games: readonly T[],
  id: string,
): T[] {
  return assignPosition(games, id, "queuePosition", 1);
}

export function insertQueueLast<T extends PositionedGame>(
  games: readonly T[],
  id: string,
): T[] {
  return assignPosition(games, id, "queuePosition", games.length + 1);
}

export function removeFromQueue<T extends PositionedGame>(
  games: readonly T[],
  id: string,
): T[] {
  return assignPosition(games, id, "queuePosition", null);
}

export function reorderVisibleQueue<T extends PositionedGame>(
  games: readonly T[],
  visibleOrderedIds: readonly string[],
): T[] {
  return reorderVisiblePositions(games, visibleOrderedIds, "queuePosition");
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

/** @deprecated Use insertQueueFirst. */
export function movePriorityToFront(
  games: readonly GameRecord[],
  id: string,
): GameRecord[] {
  return mirrorLegacyPriority(insertQueueFirst(games, id));
}

/** @deprecated Use reorderVisibleQueue. */
export function reorderVisiblePriorities(
  games: readonly GameRecord[],
  visibleOrderedIds: string[],
): GameRecord[] {
  return mirrorLegacyPriority(reorderVisibleQueue(games, visibleOrderedIds));
}
