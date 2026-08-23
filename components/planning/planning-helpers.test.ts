import { describe, expect, it } from "vitest";
import {
  orderedPlanningGames,
  planningOrderAfterMove,
  planningStatusLabel,
} from "./planning-helpers";
import type { PlanningGame } from "./types";

function game(
  id: string,
  overrides: Partial<PlanningGame> = {},
): PlanningGame {
  return {
    id,
    name: id,
    coverUrl: "",
    steamAppId: null,
    owned: false,
    wishlisted: false,
    played: false,
    finished: false,
    queuePosition: null,
    favoriteRank: null,
    ...overrides,
  };
}

describe("planning list decisions", () => {
  it("keeps queue and personal ranking membership independent", () => {
    const games = [
      game("queue-only", { queuePosition: 2 }),
      game("favorite-only", { favoriteRank: 1 }),
      game("both", { queuePosition: 1, favoriteRank: 2 }),
      game("neither"),
    ];

    expect(orderedPlanningGames(games, "queuePosition").map((item) => item.id))
      .toEqual(["both", "queue-only"]);
    expect(orderedPlanningGames(games, "favoriteRank").map((item) => item.id))
      .toEqual(["favorite-only", "both"]);
  });

  it("ignores invalid positions and resolves duplicate input positions by document order", () => {
    const games = [
      game("first-tie", { queuePosition: 4 }),
      game("invalid-zero", { queuePosition: 0 }),
      game("second-tie", { queuePosition: 4 }),
      game("front", { queuePosition: 1.5 }),
    ];

    expect(orderedPlanningGames(games, "queuePosition").map((item) => item.id))
      .toEqual(["front", "first-tie", "second-tie"]);
  });

  it("returns a complete order for a valid move and no update for a rejected move", () => {
    const games = [game("a"), game("b"), game("c")];

    expect(planningOrderAfterMove(games, "a", "c")).toEqual(["b", "c", "a"]);
    expect(planningOrderAfterMove(games, "a", null)).toBeNull();
    expect(planningOrderAfterMove(games, "missing", "b")).toBeNull();
  });

  it("uses the most progressed compact status without consulting rank or rating", () => {
    expect(planningStatusLabel(game("finished", {
      owned: true,
      played: true,
      finished: true,
      favoriteRank: 1,
    }))).toBe("Durchgespielt");
    expect(planningStatusLabel(game("wishlist", { wishlisted: true })))
      .toBe("Wunschliste");
    expect(planningStatusLabel(game("new"))).toBe("Nicht gespielt");
  });
});
