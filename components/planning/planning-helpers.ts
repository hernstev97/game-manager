import type {
  PlanningGame,
  PlanningPositionField,
} from "@/components/planning/types";

function isPosition(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Projects a library into one normalized-looking planning list without
 * mutating source records. The persistence layer remains responsible for
 * writing contiguous positions.
 */
export function orderedPlanningGames(
  games: readonly PlanningGame[],
  field: PlanningPositionField,
): PlanningGame[] {
  return games
    .map((game, documentIndex) => ({ game, documentIndex }))
    .filter((entry) => isPosition(entry.game[field]))
    .sort((left, right) => {
      const byPosition = left.game[field]! - right.game[field]!;
      if (byPosition !== 0) return byPosition;
      const byDocumentOrder = left.documentIndex - right.documentIndex;
      if (byDocumentOrder !== 0) return byDocumentOrder;
      return left.game.id.localeCompare(right.game.id);
    })
    .map((entry) => entry.game);
}

/** Returns the complete ordered ID list for an accepted DnD move. */
export function planningOrderAfterMove(
  games: readonly PlanningGame[],
  activeId: string,
  overId: string | null,
): string[] | null {
  if (!overId || activeId === overId) return null;
  const ids = games.map((game) => game.id);
  const oldIndex = ids.indexOf(activeId);
  const newIndex = ids.indexOf(overId);
  if (oldIndex < 0 || newIndex < 0) return null;

  const next = [...ids];
  const [moved] = next.splice(oldIndex, 1);
  next.splice(newIndex, 0, moved);
  return next;
}

export function planningStatusLabel(game: PlanningGame): string {
  if (game.finished) return "Durchgespielt";
  if (game.played) return "Gespielt";
  if (game.wishlisted) return "Wunschliste";
  if (game.owned) return "Im Besitz";
  return "Nicht gespielt";
}

/** Moves one game to the start or end of an ordered planning list. */
export function planningOrderWithEdgeMove(
  games: readonly PlanningGame[],
  gameId: string,
  edge: "start" | "end",
): string[] | null {
  const ids = games.map((game) => game.id);
  const index = ids.indexOf(gameId);
  if (index < 0) return null;
  if ((edge === "start" && index === 0) || (edge === "end" && index === ids.length - 1)) {
    return null;
  }
  ids.splice(index, 1);
  if (edge === "start") ids.unshift(gameId);
  else ids.push(gameId);
  return ids;
}
