import { describe, expect, it } from "vitest";
import { mergeImportedGames } from "./import-export";
import { normalizeGame } from "./game-fields";
import { parseLibraryDocument } from "./storage";
import { createSeedGames } from "./seed-games";

describe("normalizeGame", () => {
  it("fills registry defaults and keeps extra keys", () => {
    const game = normalizeGame({
      name: "Pragmata",
      customFlag: "keep-me",
    });
    expect(game.franchise).toBe("Other");
    expect(game.owned).toBe(false);
    expect(game.genres).toEqual([]);
    expect(game.customFlag).toBe("keep-me");
    expect(game.id).toBeTruthy();
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

  it("round-trips seed JSON aside from exportedAt", () => {
    const seeds = createSeedGames();
    const raw = {
      version: 1,
      exportedAt: "2026-08-18T18:00:00.000Z",
      settings: { sortBy: "name", sortDir: "asc", steamId: "", steamApiKey: "" },
      games: seeds,
    };
    const parsed = parseLibraryDocument(raw);
    expect(parsed.skipped).toBe(0);
    expect(parsed.document.games).toHaveLength(19);
    expect(parsed.document.games.map((g) => g.name)).toEqual(seeds.map((g) => g.name));
  });
});
