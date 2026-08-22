import { describe, expect, it } from "vitest";
import {
  assignPosition,
  assignPriority,
  movePriorityToFront,
  normalizeGamePositions,
  reorderVisiblePriorities,
} from "./priority";
import { normalizeGame, type GameRecord } from "./game-fields";

function game(id: string, priority: number | null): GameRecord {
  return normalizeGame({ id, name: id, priority });
}

describe("priority", () => {
  it("assigns densely and moves to front", () => {
    const start = [game("a", 1), game("b", 2), game("c", null)];
    const next = assignPriority(start, "c", 2);
    expect(next.map((g) => [g.id, g.priority])).toEqual([
      ["a", 1],
      ["b", 3],
      ["c", 2],
    ]);
    const front = movePriorityToFront(next, "b");
    expect(front.find((g) => g.id === "b")?.priority).toBe(1);
    expect(front.find((g) => g.id === "a")?.priority).toBe(2);
  });

  it("reorders only the visible ranked subset", () => {
    const start = [game("a", 1), game("b", 2), game("c", 3), game("d", null)];
    const reordered = reorderVisiblePriorities(start, ["c", "a"]);
    expect(reordered.find((g) => g.id === "c")?.priority).toBe(1);
    expect(reordered.find((g) => g.id === "b")?.priority).toBe(2);
    expect(reordered.find((g) => g.id === "a")?.priority).toBe(3);
    expect(reordered.find((g) => g.id === "d")?.priority).toBeNull();
  });

  it("normalizes queue and favorites independently", () => {
    const start = [
      { ...game("a", 4), queuePosition: 4.5, favoriteRank: 8, rating: 7 },
      { ...game("b", 2), queuePosition: 4.5, favoriteRank: 2, rating: 9 },
      { ...game("c", null), queuePosition: -1, favoriteRank: null, rating: null },
    ];
    const normalized = normalizeGamePositions(start);
    expect(normalized.map((item) => item.queuePosition)).toEqual([1, 2, null]);
    expect(normalized.map((item) => item.favoriteRank)).toEqual([2, 1, null]);
    expect(normalized.map((item) => item.rating)).toEqual([7, 9, null]);

    const favorite = assignPosition(normalized, "c", "favoriteRank", 1);
    expect(favorite.map((item) => item.queuePosition)).toEqual([1, 2, null]);
    expect(favorite.find((item) => item.id === "c")?.favoriteRank).toBe(1);
  });
});
