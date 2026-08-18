import type { GameRecord } from "./game-fields";

function ranked(games: readonly GameRecord[]): GameRecord[] {
  return games
    .filter((game) => game.priority != null)
    .sort(
      (a, b) =>
        (a.priority ?? 0) - (b.priority ?? 0) ||
        a.name.localeCompare(b.name, "de", { sensitivity: "base" }),
    );
}

export function compactPriorities(games: readonly GameRecord[]): GameRecord[] {
  const order = ranked(games);
  const ranks = new Map(order.map((game, index) => [game.id, index + 1]));
  return games.map((game) =>
    ranks.has(game.id) ? { ...game, priority: ranks.get(game.id)! } : { ...game, priority: null },
  );
}

export function assignPriority(
  games: readonly GameRecord[],
  id: string,
  priority: number | null,
): GameRecord[] {
  if (priority == null) {
    return compactPriorities(games.map((game) => (game.id === id ? { ...game, priority: null } : game)));
  }

  const targetGame = games.find((game) => game.id === id);
  if (!targetGame) return [...games];

  const others = ranked(games).filter((game) => game.id !== id);
  const slot = Math.max(1, Math.min(Math.round(priority), others.length + 1));
  const next = [...others];
  next.splice(slot - 1, 0, { ...targetGame, priority: slot });
  const ranks = new Map(next.map((game, index) => [game.id, index + 1]));
  return games.map((game) =>
    ranks.has(game.id) ? { ...game, priority: ranks.get(game.id)! } : { ...game, priority: game.id === id ? null : game.priority },
  );
}

export function movePriorityToFront(games: readonly GameRecord[], id: string): GameRecord[] {
  return assignPriority(games, id, 1);
}

export function reorderVisiblePriorities(
  games: readonly GameRecord[],
  visibleOrderedIds: string[],
): GameRecord[] {
  const allRanked = ranked(games);
  const visibleSet = new Set(visibleOrderedIds);
  const queue = [...visibleOrderedIds];
  const merged = allRanked.map((game) =>
    visibleSet.has(game.id) ? queue.shift() ?? game.id : game.id,
  );
  const ranks = new Map(merged.map((id, index) => [id, index + 1]));
  return games.map((game) =>
    ranks.has(game.id) ? { ...game, priority: ranks.get(game.id)! } : game,
  );
}
