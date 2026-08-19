import { describe, expect, it } from "vitest";
import { applyFiltersAndSort, EMPTY_FILTERS, type LibraryFilters } from "./filter-games";
import { normalizeGame, type GameRecord } from "./game-fields";

function game(partial: Partial<GameRecord>): GameRecord {
  return normalizeGame({
    id: partial.id ?? `g-${partial.name}`,
    dateAdded: "2026-01-01T00:00:00.000Z",
    ...partial,
  });
}

const library = [
  game({
    id: "a",
    name: "Final Fantasy X",
    franchise: "Final Fantasy",
    genres: ["JRPG"],
    played: true,
    finished: false,
    owned: true,
    wishlisted: false,
    difficultyTo100: "High (Grindy)",
    rating: 8,
    priority: 2,
    notes: "Need the celestial weapons",
    playtimeMinutes: 1200,
  }),
  game({
    id: "b",
    name: "NieR:Automata",
    franchise: "Nier",
    genres: ["Action RPG"],
    played: true,
    finished: true,
    owned: true,
    wishlisted: false,
    difficultyTo100: "Medium",
    rating: null,
    priority: 1,
    notes: "",
    playtimeMinutes: 800,
  }),
  game({
    id: "c",
    name: "Enshrouded",
    franchise: "Enshrouded",
    genres: ["Survival / Crafting"],
    played: false,
    finished: false,
    owned: false,
    wishlisted: true,
    difficultyTo100: "Low",
    rating: 6,
    priority: null,
    notes: "",
    playtimeMinutes: null,
  }),
];

describe("applyFiltersAndSort", () => {
  it("searches name, notes, and franchise", () => {
    expect(applyFiltersAndSort(library, { ...EMPTY_FILTERS, query: "celestial" }, { by: "name", dir: "asc" }).map((g) => g.id)).toEqual(["a"]);
    expect(applyFiltersAndSort(library, { ...EMPTY_FILTERS, query: "nier" }, { by: "name", dir: "asc" }).map((g) => g.id)).toEqual(["b"]);
    expect(applyFiltersAndSort(library, { ...EMPTY_FILTERS, query: "fantasy" }, { by: "name", dir: "asc" }).map((g) => g.id)).toEqual(["a"]);
  });

  it("ANDs across groups and ORs within a multi-select", () => {
    const filters: LibraryFilters = {
      query: "",
      fields: {
        owned: { kind: "multi", selected: ["true"] },
        genres: { kind: "multi", selected: ["JRPG", "Action RPG"] },
      },
    };
    expect(applyFiltersAndSort(library, filters, { by: "name", dir: "asc" }).map((g) => g.id)).toEqual(["a", "b"]);
  });

  it("filters derived boolean pairs", () => {
    const notPlayed: LibraryFilters = {
      query: "",
      fields: { played: { kind: "multi", selected: ["false"] } },
    };
    expect(applyFiltersAndSort(library, notPlayed, { by: "name", dir: "asc" }).map((g) => g.id)).toEqual(["c"]);
  });

  it("filters priority and rating", () => {
    const priority: LibraryFilters = {
      query: "",
      fields: { priority: { kind: "priority", selected: ["top5"] } },
    };
    expect(applyFiltersAndSort(library, priority, { by: "name", dir: "asc" }).map((g) => g.id)).toEqual(["a", "b"]);

    const rated: LibraryFilters = {
      query: "",
      fields: { rating: { kind: "rating", selected: ["gte"], gte: 7 } },
    };
    expect(applyFiltersAndSort(library, rated, { by: "name", dir: "asc" }).map((g) => g.id)).toEqual(["a"]);
  });

  it("filters games that have notes", () => {
    const filters: LibraryFilters = {
      query: "",
      fields: { notes: { kind: "toggle", on: true } },
    };
    expect(applyFiltersAndSort(library, filters, { by: "name", dir: "asc" }).map((g) => g.id)).toEqual(["a"]);
  });

  it("sorts priority and rating with nulls last", () => {
    const byPriority = applyFiltersAndSort(library, EMPTY_FILTERS, { by: "priority", dir: "asc" });
    expect(byPriority.map((g) => g.id)).toEqual(["b", "a", "c"]);

    const byRating = applyFiltersAndSort(library, EMPTY_FILTERS, { by: "rating", dir: "desc" });
    expect(byRating.map((g) => g.id)).toEqual(["a", "c", "b"]);
  });

  it("sorts difficulty alphabetically and status finished first", () => {
    const byDiff = applyFiltersAndSort(library, EMPTY_FILTERS, { by: "difficultyTo100", dir: "asc" });
    expect(byDiff.map((g) => g.difficultyTo100)).toEqual(["High (Grindy)", "Low", "Medium"]);

    const byStatus = applyFiltersAndSort(library, EMPTY_FILTERS, { by: "status", dir: "asc" });
    expect(byStatus.map((g) => g.id)).toEqual(["b", "a", "c"]);
  });
});
