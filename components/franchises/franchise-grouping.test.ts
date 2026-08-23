import { describe, expect, it } from "vitest";
import { fieldById } from "@/lib/game-fields";
import type { FranchisePresentation } from "@/lib/model/shared";
import {
  findFranchisePresentation,
  franchiseGroupingMinCount,
  groupVisibleGamesByFranchise,
} from "./franchise-grouping";

type VisibleGame = { id: string; franchise: string };

describe("franchise grouping", () => {
  it("uses the exact franchise filter minimum", () => {
    expect(franchiseGroupingMinCount()).toBe(fieldById("franchise")?.filterMinCount);
  });

  it("groups canonical identities at the minimum and keeps visible order/counts", () => {
    const games: VisibleGame[] = [
      { id: "a1", franchise: " Pokémon " },
      { id: "small", franchise: "Portal" },
      { id: "a2", franchise: "pokémon" },
      { id: "later", franchise: "Pokémon" },
    ];

    const sections = groupVisibleGamesByFranchise(games, [], 2);

    expect(sections[0]).toMatchObject({
      kind: "franchise",
      name: "Pokémon",
      visibleCount: 3,
      games: [{ id: "a1" }, { id: "a2" }, { id: "later" }],
    });
    expect(sections[1]).toMatchObject({ kind: "ungrouped", games: [{ id: "small" }] });
  });

  it("returns missing franchises as one remainder and small franchises ungrouped", () => {
    const games: VisibleGame[] = [
      { id: "none-1", franchise: "" },
      { id: "small", franchise: "Portal" },
      { id: "none-2", franchise: "   " },
    ];

    const sections = groupVisibleGamesByFranchise(games, [], 2);
    const remainder = sections.find((section) => section.kind === "remainder");
    const ungrouped = sections.find((section) => section.kind === "ungrouped");

    expect(remainder).toMatchObject({
      name: "Ohne Franchise",
      visibleCount: 2,
      games: [{ id: "none-1" }, { id: "none-2" }],
    });
    expect(ungrouped).toMatchObject({ games: [{ id: "small" }] });
    expect(sections.every((section) => section.games.length > 0)).toBe(true);
  });

  it("keeps all real franchise sections consecutive before loose games", () => {
    const games: VisibleGame[] = [
      { id: "a1", franchise: "Alpha" },
      { id: "single", franchise: "Standalone" },
      { id: "b1", franchise: "Beta" },
      { id: "none", franchise: "" },
      { id: "a2", franchise: "Alpha" },
      { id: "b2", franchise: "Beta" },
    ];

    const sections = groupVisibleGamesByFranchise(games, [], 2);

    expect(sections.map((section) => section.kind)).toEqual([
      "franchise",
      "franchise",
      "ungrouped",
      "remainder",
    ]);
    expect(sections.map((section) => section.games.map((game) => game.id))).toEqual([
      ["a1", "a2"],
      ["b1", "b2"],
      ["single"],
      ["none"],
    ]);
  });

  it("looks up presentation by normalized case-insensitive identity", () => {
    const presentation: FranchisePresentation = {
      franchise: "  THE LEGEND OF ZELDA ",
      backgroundUrl: "https://example.com/zelda.jpg",
      overlayStrength: 0.7,
    };

    expect(findFranchisePresentation([presentation], "The Legend of Zelda")).toBe(presentation);
    expect(
      groupVisibleGamesByFranchise(
        [
          { id: "z1", franchise: "The Legend of Zelda" },
          { id: "z2", franchise: "the legend of zelda" },
        ],
        [presentation],
        2,
      )[0],
    ).toMatchObject({ presentation });
  });
});
