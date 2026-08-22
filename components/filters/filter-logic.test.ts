import { describe, expect, it } from "vitest";
import { fieldById, normalizeGame } from "@/lib/game-fields";
import type { LibraryFilters } from "@/lib/filter-games";
import { facetChoices, resetFilterGroup, type FilterGroup } from "./filter-logic";

const games = [
  normalizeGame({ id: "one", name: "One", franchise: "Final Fantasy", platforms: ["PC"] }),
  normalizeGame({ id: "two", name: "Two", franchise: "Final Fantasy", platforms: ["Switch"] }),
  normalizeGame({ id: "three", name: "Three", franchise: "Nier", platforms: ["PC"] }),
  normalizeGame({ id: "four", name: "Four", franchise: "Nier", platforms: ["Switch"] }),
];

describe("facetChoices", () => {
  it("counts choices while preserving all other active filters", () => {
    const franchise = fieldById("franchise");
    if (!franchise) throw new Error("franchise field missing");
    const filters: LibraryFilters = {
      query: "",
      fields: { platforms: { kind: "multi", selected: ["PC"] } },
    };

    expect(facetChoices(franchise, games, filters)).toEqual([
      { token: "Final Fantasy", label: "Final Fantasy", count: 1 },
      { token: "Nier", label: "Nier", count: 1 },
    ]);
  });
});

describe("resetFilterGroup", () => {
  it("clears only fields owned by the selected group", () => {
    const franchise = fieldById("franchise");
    const platforms = fieldById("platforms");
    if (!franchise || !platforms) throw new Error("filter fields missing");
    const group: FilterGroup = { key: "identity", label: "Identität", fields: [franchise] };
    const filters: LibraryFilters = {
      query: "final",
      fields: {
        franchise: { kind: "multi", selected: ["Final Fantasy"] },
        platforms: { kind: "multi", selected: ["PC"] },
      },
    };

    expect(resetFilterGroup(filters, group)).toEqual({
      query: "final",
      fields: { platforms: { kind: "multi", selected: ["PC"] } },
    });
  });
});
