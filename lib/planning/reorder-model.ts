import type { PositionField } from "../model/shared";
import {
  normalizePositionField,
  reorderVisiblePositions,
  type PositionedGame,
} from "../priority";

export const POSITION_REORDER_LISTS = {
  queue: "queuePosition",
  favorites: "favoriteRank",
} as const satisfies Record<string, PositionField>;

export type PositionReorderList = keyof typeof POSITION_REORDER_LISTS;

export type PositionReorderModel = Readonly<{
  list: PositionReorderList;
  field: PositionField;
  orderedIds: readonly string[];
  visibleOrderedIds: readonly string[];
}>;

export type PositionReorderRequest = Readonly<{
  field: PositionField;
  visibleOrderedIds: readonly string[];
}>;

/** Creates a UI-ready snapshot without coupling it to a concrete component. */
export function createPositionReorderModel<T extends PositionedGame>(
  games: readonly T[],
  list: PositionReorderList,
  visibleIds?: readonly string[],
): PositionReorderModel {
  const field = POSITION_REORDER_LISTS[list];
  const orderedIds = normalizePositionField(games, field)
    .filter((game) => game[field] !== null)
    .sort((left, right) => (left[field] ?? 0) - (right[field] ?? 0))
    .map((game) => game.id);
  const visible = visibleIds === undefined ? null : new Set(visibleIds);

  return {
    list,
    field,
    orderedIds,
    visibleOrderedIds:
      visible === null ? [...orderedIds] : orderedIds.filter((id) => visible.has(id)),
  };
}

/** Converts a UI order into an explicit, serializable domain request. */
export function createPositionReorderRequest(
  model: PositionReorderModel,
  visibleOrderedIds: readonly string[],
): PositionReorderRequest {
  const allowed = new Set(model.visibleOrderedIds);
  const seen = new Set<string>();
  const requested = visibleOrderedIds.filter((id) => {
    if (!allowed.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return {
    field: model.field,
    visibleOrderedIds: requested,
  };
}

export function applyPositionReorderRequest<T extends PositionedGame>(
  games: readonly T[],
  request: PositionReorderRequest,
): T[] {
  return reorderVisiblePositions(
    games,
    request.visibleOrderedIds,
    request.field,
  );
}
