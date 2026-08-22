import { describe, expect, it } from "vitest";
import { normalizeGame } from "@/lib/game-fields";
import type { LibraryGameRecordV2 } from "@/lib/model";
import {
  compareSteamLibrary,
  defaultSteamImportSelection,
  normalizeSteamLibrary,
  normalizeSteamMatchName,
} from "./index";

function game(
  id: string,
  overrides: Record<string, unknown> = {},
): LibraryGameRecordV2 {
  const canonical = {
    ...normalizeGame({ id, name: id, ...overrides }),
  } as Record<string, unknown>;
  delete canonical.priority;
  return canonical as LibraryGameRecordV2;
}

describe("Steam library normalization", () => {
  it("keeps only public game fields and normalizes numeric values locally", () => {
    const result = normalizeSteamLibrary({
      steamId: "76561198000000000",
      apiKey: "must-not-enter-the-result",
      games: [
        {
          appid: "20",
          name: "  Portal 2 ",
          playtime_forever: "90.8",
          apiKey: "also-must-not-enter-the-result",
        },
        { appId: 10, name: "Half-Life", playtimeMinutes: -1 },
        { appId: 30, name: "   " },
      ],
    });

    expect(result.games).toEqual([
      {
        steamAppId: 10,
        name: "Half-Life",
        playtimeMinutes: null,
        igdbId: null,
      },
      {
        steamAppId: 20,
        name: "Portal 2",
        playtimeMinutes: 90,
        igdbId: null,
      },
    ]);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "invalid-playtime",
      "missing-name",
    ]);
    expect(JSON.stringify(result)).not.toMatch(/apiKey|must-not-enter/);
  });

  it("deduplicates compatible app IDs and rejects conflicting duplicates", () => {
    const result = normalizeSteamLibrary([
      { appId: 10, name: "Portal", playtimeMinutes: 5 },
      { appid: 10, name: "Portal", playtime_forever: 12 },
      { appId: 20, name: "First", igdbId: 1 },
      { appId: 20, name: "Second", igdbId: 2 },
    ]);

    expect(result.games).toEqual([
      {
        steamAppId: 10,
        name: "Portal",
        playtimeMinutes: 12,
        igdbId: null,
      },
    ]);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "duplicate-app-id",
    );
    expect(result.issues.map((issue) => issue.code)).toContain(
      "conflicting-duplicate",
    );
  });

  it("returns a safe validation issue instead of reflecting malformed input", () => {
    expect(normalizeSteamLibrary({ token: "private" })).toEqual({
      games: [],
      issues: [
        {
          code: "invalid-payload",
          severity: "error",
          message: "Die geladene Steam-Bibliothek hat kein gültiges Spiele-Array.",
        },
      ],
      received: 0,
      rejected: 0,
    });
  });
});

describe("Steam duplicate matching", () => {
  it("matches Steam App-ID strictly and distinguishes already-current", () => {
    const existing = [
      game("update", {
        name: "Portal",
        steamAppId: 10,
        owned: false,
        playtimeMinutes: 3,
      }),
      game("current", {
        name: "Half-Life",
        steamAppId: 20,
        owned: true,
        playtimeMinutes: 12,
      }),
    ];
    const comparison = compareSteamLibrary(
      [
        { steamAppId: 10, name: "Portal", playtimeMinutes: 8, igdbId: null },
        { steamAppId: 20, name: "Half-Life", playtimeMinutes: 12, igdbId: null },
      ],
      existing,
    );

    expect(comparison.items[0]).toMatchObject({
      category: "safely-recognized",
      reason: "steam-app-id",
      matchedGameId: "update",
    });
    expect(comparison.items[1]).toMatchObject({
      category: "already-current",
      matchedGameId: "current",
    });
  });

  it("uses an existing IGDB ID as a safe external identity", () => {
    const comparison = compareSteamLibrary(
      [{ steamAppId: 11, name: "Remote Name", playtimeMinutes: 2, igdbId: 99 }],
      [game("igdb", { name: "Local Name", steamAppId: null, igdbId: 99 })],
    );
    expect(comparison.items[0]).toMatchObject({
      category: "safely-recognized",
      reason: "external-id",
      matchedGameId: "igdb",
    });
  });

  it("never automatically merges a normalized-name suggestion", () => {
    expect(normalizeSteamMatchName("  THE   GAME ")).toBe("the game");
    const comparison = compareSteamLibrary(
      [{ steamAppId: 11, name: "THE GAME", playtimeMinutes: 2, igdbId: null }],
      [game("name-only", { name: "The   Game", steamAppId: null, igdbId: null })],
    );

    expect(comparison.items[0]).toMatchObject({
      category: "possible-match",
      reason: "normalized-name",
      candidateGameIds: ["name-only"],
    });
    expect(comparison.items[0].matchedGameId).toBeUndefined();
    expect(defaultSteamImportSelection(comparison)).toEqual([]);
  });

  it("reports ambiguous names and conflicting external identities", () => {
    const existing = [
      game("steam-target", { name: "One", steamAppId: 10, igdbId: null }),
      game("igdb-target", { name: "Twin", steamAppId: null, igdbId: 99 }),
      game("twin-two", { name: "Twin", steamAppId: null, igdbId: null }),
    ];
    const comparison = compareSteamLibrary(
      [
        { steamAppId: 10, name: "One", playtimeMinutes: 0, igdbId: 99 },
        { steamAppId: 20, name: "Twin", playtimeMinutes: 0, igdbId: null },
      ],
      existing,
    );

    expect(comparison.items[0]).toMatchObject({
      category: "conflict",
      reason: "conflicting-external-identities",
    });
    expect(comparison.items[1]).toMatchObject({
      category: "conflict",
      reason: "ambiguous-name",
    });
  });

  it("selects only new and safely recognized entries by default", () => {
    const comparison = compareSteamLibrary(
      [
        { steamAppId: 10, name: "Known", playtimeMinutes: 3, igdbId: null },
        { steamAppId: 20, name: "New", playtimeMinutes: 1, igdbId: null },
      ],
      [game("known", { name: "Known", steamAppId: 10, owned: false })],
    );
    expect(defaultSteamImportSelection(comparison)).toEqual([10, 20]);
  });
});
