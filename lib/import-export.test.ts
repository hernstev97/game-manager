import { describe, expect, it } from "vitest";
import { mergeImportedGames } from "./import-export";
import { normalizeGame } from "./game-fields";
import { parseLibraryDocument } from "./storage";

describe("normalizeGame", () => {
  it("fills registry defaults and keeps extra keys", () => {
    const game = normalizeGame({
      name: "Pragmata",
      customFlag: "keep-me",
    });
    expect(game.franchise).toBe("");
    expect(game.difficultyTo100).toBe("");
    expect(game.owned).toBe(false);
    expect(game.genres).toEqual([]);
    expect(game.customFlag).toBe("keep-me");
    expect(game.steamPrice).toBeNull();
    expect(game.id).toBeTruthy();
  });

  it("keeps a steam price snapshot", () => {
    const game = normalizeGame({
      name: "Elden Ring",
      steamPrice: {
        source: "steam",
        currency: "EUR",
        initialCents: 5999,
        finalCents: 2999,
        discountPercent: 50,
        isFree: false,
        formatted: "29,99 €",
        updatedAt: "2026-08-19T12:00:00.000Z",
      },
    });
    expect(game.steamPrice?.finalCents).toBe(2999);
    expect(game.steamPrice?.discountPercent).toBe(50);
  });

  it("clamps genres to two", () => {
    const game = normalizeGame({
      name: "X",
      genres: ["JRPG", "Action RPG", "MMO"],
    });
    expect(game.genres).toEqual(["JRPG", "Action RPG"]);
  });
});

describe("import merge", () => {
  it("matches by id, then steamAppId, then name; incoming wins", () => {
    const current = [
      normalizeGame({ id: "1", name: "A", steamAppId: 10, rating: 5 }),
      normalizeGame({ id: "2", name: "B", steamAppId: 20, rating: 6 }),
      normalizeGame({ id: "3", name: "C", steamAppId: null, rating: 7 }),
    ];
    const incoming = [
      normalizeGame({ id: "1", name: "A-updated", steamAppId: 10, rating: 9 }),
      normalizeGame({ id: "x", name: "Other", steamAppId: 20, rating: 8 }),
      normalizeGame({ id: "y", name: "C", steamAppId: null, rating: 1 }),
      normalizeGame({ id: "4", name: "D", steamAppId: 40, rating: 4 }),
    ];
    const { games, added, updated } = mergeImportedGames(current, incoming);
    expect(updated).toBe(3);
    expect(added).toBe(1);
    expect(games.find((g) => g.id === "1")?.name).toBe("A-updated");
    expect(games.find((g) => g.id === "2")?.rating).toBe(8);
    expect(games.find((g) => g.id === "3")?.rating).toBe(1);
    expect(games.some((g) => g.name === "D")).toBe(true);
  });

  it("round-trips library JSON aside from exportedAt", () => {
    const games = [
      normalizeGame({ id: "1", name: "Alpha", steamAppId: 10 }),
      normalizeGame({ id: "2", name: "Beta", steamAppId: 20 }),
    ];
    const raw = {
      version: 1,
      exportedAt: "2026-08-18T18:00:00.000Z",
      settings: { sortBy: "name", sortDir: "asc", steamId: "", steamApiKey: "" },
      games,
    };
    const parsed = parseLibraryDocument(raw);
    expect(parsed.skipped).toBe(0);
    expect(parsed.document.games).toHaveLength(2);
    expect(parsed.document.games.map((g) => g.name)).toEqual(["Alpha", "Beta"]);
  });
});
