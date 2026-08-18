import { describe, expect, it } from "vitest";
import { assignPriority, movePriorityToFront, reorderVisiblePriorities } from "./priority";
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
});
