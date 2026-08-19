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
    expect(game.igdbId).toBeNull();
    expect(game.id).toBeTruthy();
  });

  it("keeps a positive igdbId and drops invalid ones", () => {
    expect(normalizeGame({ name: "X", igdbId: 1026 }).igdbId).toBe(1026);
    expect(normalizeGame({ name: "X", igdbId: 0 }).igdbId).toBeNull();
    expect(normalizeGame({ name: "X", igdbId: -1 }).igdbId).toBeNull();
    expect(normalizeGame({ name: "X", igdbId: 1.5 }).igdbId).toBeNull();
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

  it("drops malformed steam price snapshots", () => {
    const base = {
      source: "steam" as const,
      currency: "EUR",
      initialCents: 5999,
      finalCents: 2999,
      discountPercent: 50,
      isFree: false,
      formatted: "29,99 €",
      updatedAt: "2026-08-19T12:00:00.000Z",
    };
    expect(normalizeGame({ name: "X", steamPrice: { ...base, source: "itad" } }).steamPrice).toBeNull();
    expect(normalizeGame({ name: "X", steamPrice: { ...base, finalCents: -1 } }).steamPrice).toBeNull();
    expect(normalizeGame({ name: "X", steamPrice: { ...base, discountPercent: 12.5 } }).steamPrice).toBeNull();
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
  it("matches by id, then steamAppId, then igdbId, then name; incoming wins", () => {
    const current = [
      normalizeGame({ id: "1", name: "A", steamAppId: 10, rating: 5 }),
      normalizeGame({ id: "2", name: "B", steamAppId: 20, rating: 6 }),
      normalizeGame({ id: "3", name: "C", steamAppId: null, rating: 7 }),
      normalizeGame({ id: "5", name: "E", igdbId: 1026, rating: 4 }),
    ];
    const incoming = [
      normalizeGame({ id: "1", name: "A-updated", steamAppId: 10, rating: 9 }),
      normalizeGame({ id: "x", name: "Other", steamAppId: 20, rating: 8 }),
      normalizeGame({ id: "y", name: "C", steamAppId: null, rating: 1 }),
      normalizeGame({ id: "4", name: "D", steamAppId: 40, rating: 4 }),
      normalizeGame({ id: "z", name: "Wind Waker", igdbId: 1026, rating: 10 }),
    ];
    const { games, added, updated } = mergeImportedGames(current, incoming);
    expect(updated).toBe(4);
    expect(added).toBe(1);
    expect(games.find((g) => g.id === "1")?.name).toBe("A-updated");
    expect(games.find((g) => g.id === "2")?.rating).toBe(8);
    expect(games.find((g) => g.id === "3")?.rating).toBe(1);
    expect(games.find((g) => g.id === "5")?.rating).toBe(10);
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
      settings: {
        sortBy: "name",
        sortDir: "asc",
        steamId: "",
        steamApiKey: "",
        igdbClientId: "",
        igdbClientSecret: "",
      },
      games,
    };
    const parsed = parseLibraryDocument(raw);
    expect(parsed.skipped).toBe(0);
    expect(parsed.document.games).toHaveLength(2);
    expect(parsed.document.games.map((g) => g.name)).toEqual(["Alpha", "Beta"]);
  });
});
