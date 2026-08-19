import { describe, expect, it } from "vitest";
import {
  GAME_FIELDS,
  collectFieldOptions,
  collectFilterOptions,
  editorFields,
  filterableFields,
  fieldById,
  matchExistingOption,
  normalizeGame,
  sortableFieldOptions,
  type GameRecord,
} from "./game-fields";

function game(partial: Partial<GameRecord>): GameRecord {
  return normalizeGame({
    id: partial.id ?? `g-${partial.name}`,
    dateAdded: "2026-01-01T00:00:00.000Z",
    ...partial,
  });
}

describe("field registry", () => {
  it("drives filters, editor, and sort without hardcoded field lists", () => {
    expect(filterableFields().map((field) => field.id)).toContain("franchise");
    expect(filterableFields().map((field) => field.id)).toContain("difficultyTo100");
    expect(editorFields().every((field) => field.showInEditor)).toBe(true);
    expect(sortableFieldOptions().some((item) => item.id === "name")).toBe(true);
    expect(fieldById("rating")?.type).toBe("rating");
    expect(GAME_FIELDS.some((field) => field.id === "name")).toBe(true);
  });

  it("keeps franchise, genre, and difficulty as open vocabularies", () => {
    expect(fieldById("franchise")?.options).toBeUndefined();
    expect(fieldById("genres")?.options).toBeUndefined();
    expect(fieldById("difficultyTo100")?.options).toBeUndefined();
    expect(fieldById("franchise")?.filterMinCount).toBe(2);
    expect(fieldById("platforms")?.options).toEqual(["PC", "Switch", "PS5", "Xbox"]);
  });
});

describe("collectFieldOptions", () => {
  const library = [
    game({ name: "Final Fantasy X", franchise: "Final Fantasy", genres: ["JRPG"], difficultyTo100: "High" }),
    game({ name: "Final Fantasy VII", franchise: "Final Fantasy", genres: ["JRPG", "Action RPG"], difficultyTo100: "Medium" }),
    game({ name: "NieR", franchise: "Nier", genres: ["Action RPG"], difficultyTo100: "High" }),
  ];

  it("collects open vocabularies from games and sorts them", () => {
    expect(collectFieldOptions(fieldById("franchise")!, library)).toEqual(["Final Fantasy", "Nier"]);
    expect(collectFieldOptions(fieldById("genres")!, library)).toEqual(["Action RPG", "JRPG"]);
    expect(collectFieldOptions(fieldById("difficultyTo100")!, library)).toEqual(["High", "Medium"]);
  });

  it("treats a franchise as filterable only once two games share it", () => {
    expect(collectFilterOptions(fieldById("franchise")!, library)).toEqual(["Final Fantasy"]);
    expect(collectFilterOptions(fieldById("genres")!, library)).toEqual(["Action RPG", "JRPG"]);
    expect(collectFilterOptions(fieldById("difficultyTo100")!, library)).toEqual(["High", "Medium"]);
  });

  it("keeps static platform options and appends extras from games", () => {
    const withDeck = [...library, game({ name: "Handheld", platforms: ["Steam Deck"] })];
    expect(collectFieldOptions(fieldById("platforms")!, withDeck)).toEqual([
      "PC",
      "Switch",
      "PS5",
      "Xbox",
      "Steam Deck",
    ]);
  });

  it("reuses existing option spelling case-insensitively", () => {
    expect(matchExistingOption(["Final Fantasy", "Nier"], "final fantasy")).toBe("Final Fantasy");
    expect(matchExistingOption(["JRPG"], "Soulslike")).toBe("Soulslike");
  });
});
