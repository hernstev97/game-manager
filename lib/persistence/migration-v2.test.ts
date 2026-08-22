import { describe, expect, it } from "vitest";
import { normalizeGame } from "../game-fields";
import {
  buildCanonicalLibraryDocument,
  canonicalDocumentForWrite,
  inspectLibraryInput,
  parseLibraryDocument,
  UnsupportedLibraryVersionError,
} from "./migration";
import { DEFAULT_SETTINGS } from "./schema";

const at = "2026-08-22T12:00:00.000Z";

function v1(games: unknown[], extra: Record<string, unknown> = {}) {
  return {
    version: 1,
    exportedAt: at,
    settings: {
      sortBy: "priority",
      sortDir: "asc",
      steamId: "steam-user",
      steamApiKey: "legacy-api-key",
      igdbClientId: "igdb-client",
      igdbClientSecret: "legacy-secret",
    },
    games,
    ...extra,
  };
}

describe("library document migration", () => {
  it("migrates v1 priority without changing rating or cover", () => {
    const parsed = parseLibraryDocument(
      v1([
        { id: "a", name: "A", priority: 20, rating: 8.7, coverUrl: "header-a" },
        { id: "b", name: "B", priority: 5, rating: 4, coverUrl: "header-b" },
        { id: "c", name: "C", priority: 5, rating: null, coverUrl: "" },
      ]),
    );

    expect(parsed.document.version).toBe(2);
    expect(parsed.document.format).toBe("ggrid-library");
    expect(parsed.document.games.map((game) => [game.id, game.queuePosition])).toEqual([
      ["a", 3],
      ["b", 1],
      ["c", 2],
    ]);
    expect(parsed.document.games.map((game) => game.favoriteRank)).toEqual([null, null, null]);
    expect(parsed.document.games.map((game) => game.rating)).toEqual([8.7, 4, null]);
    expect(parsed.document.games.map((game) => game.coverUrl)).toEqual(["header-a", "header-b", ""]);
    expect(parsed.document.games.every((game) => game.landscapeArtwork === null)).toBe(true);
    expect(parsed.document.localUi.activeSort).toEqual({ by: "queuePosition", dir: "asc" });
    expect(parsed.legacyCredentials).toEqual({
      steamApiKey: "legacy-api-key",
      igdbClientSecret: "legacy-secret",
    });
    expect(parsed.document.settings.steamApiKey).toBe("");
  });

  it("migrates bare arrays, skips only nameless legacy games, and preserves extensions", () => {
    const parsed = parseLibraryDocument(
      [
        { id: "a", name: "Alpha", priority: 2, futureGame: { value: 1 } },
        { id: "empty", name: "" },
      ],
      { now: at },
    );
    expect(parsed.sourceVersion).toBe("bare-game-array");
    expect(parsed.skipped).toBe(1);
    expect(parsed.document.games[0]?.futureGame).toEqual({ value: 1 });
    expect(parsed.document.games[0]?.provenance.queuePosition).toMatchObject({
      source: "migration",
      sourceRef: "library-v1",
    });
  });

  it("normalizes both position fields independently and deterministically", () => {
    const document = buildCanonicalLibraryDocument(
      [
        normalizeGame({ id: "a", name: "A" }),
        normalizeGame({ id: "b", name: "B" }),
        normalizeGame({ id: "c", name: "C" }),
      ],
      DEFAULT_SETTINGS,
      at,
    );
    const raw = structuredClone(document) as Record<string, unknown> & { games: Array<Record<string, unknown>> };
    raw.games[0]!.queuePosition = 4.5;
    raw.games[1]!.queuePosition = 4.5;
    raw.games[2]!.queuePosition = -1;
    raw.games[0]!.favoriteRank = 99;
    raw.games[1]!.favoriteRank = 2;

    const parsed = parseLibraryDocument(raw).document;
    expect(parsed.games.map((game) => game.queuePosition)).toEqual([1, 2, null]);
    expect(parsed.games.map((game) => game.favoriteRank)).toEqual([2, 1, null]);
    expect(parsed.games.map((game) => game.rating)).toEqual([null, null, null]);
  });

  it("preserves unknown v2 keys at root, entity, and nested object levels", () => {
    const document = buildCanonicalLibraryDocument(
      [normalizeGame({ id: "a", name: "Alpha" })],
      DEFAULT_SETTINGS,
      at,
    );
    const raw = structuredClone(document) as Record<string, unknown> & { games: Array<Record<string, unknown>> };
    raw.futureRoot = { enabled: true };
    raw.games[0]!.futureGame = "kept";
    raw.games[0]!.provenance = {
      name: { source: "manual", updatedAt: at, futureProvenance: 42 },
    };

    const parsed = parseLibraryDocument(raw).document;
    expect(parsed.futureRoot).toEqual({ enabled: true });
    expect(parsed.games[0]?.futureGame).toBe("kept");
    expect(parsed.games[0]?.provenance.name?.futureProvenance).toBe(42);
  });

  it("keeps unknown filter variants opaque", () => {
    const document = buildCanonicalLibraryDocument([], DEFAULT_SETTINGS, at);
    const raw = structuredClone(document);
    raw.savedViews.push({
      id: "018f6b9a-8a9e-7c11-8b6e-8f8bb1a0a222",
      name: "Future filter",
      filters: {
        query: "",
        fields: {
          futureField: { kind: "future-filter", payload: { future: true } },
        },
      },
      sort: { by: "name", dir: "asc" },
      displayMode: "list",
      groupBy: "none",
      isDefault: false,
      kind: "custom",
    } as never);
    const parsed = parseLibraryDocument(raw).document;
    const custom = parsed.savedViews.find((view) => view.kind === "custom")!;
    expect(custom.filters.fields.futureField).toEqual({
      kind: "future-filter",
      payload: { future: true },
    });
  });

  it("enforces portable remote artwork and landscape/cover consistency", () => {
    const document = buildCanonicalLibraryDocument(
      [normalizeGame({ id: "a", name: "Alpha", coverUrl: "https://img.test/header.jpg" })],
      DEFAULT_SETTINGS,
      at,
    );
    const invalidUrl = structuredClone(document);
    invalidUrl.games[0]!.caseArtwork = {
      url: "data:image/png;base64,AAAA",
      source: "manual",
      updatedAt: at,
    };
    expect(() => parseLibraryDocument(invalidUrl)).toThrow();

    const mismatched = structuredClone(document);
    mismatched.games[0]!.landscapeArtwork = {
      url: "https://img.test/other.jpg",
      source: "igdb",
      updatedAt: at,
    };
    expect(() => parseLibraryDocument(mismatched)).toThrow();

    const incompleteFocus = structuredClone(document);
    incompleteFocus.games[0]!.caseArtwork = {
      url: "https://img.test/case.jpg",
      source: "manual",
      updatedAt: at,
      focalPointX: 0.5,
    };
    expect(() => parseLibraryDocument(incompleteFocus)).toThrow();
  });

  it("rejects malformed v2 data and inspects future versions opaquely", () => {
    expect(() => parseLibraryDocument({ version: 0, games: [] })).toThrow();
    const future = { format: "ggrid-library", version: 9, future: true };
    expect(inspectLibraryInput(future)).toEqual({
      kind: "unsupported-version",
      version: 9,
      raw: future,
    });
    expect(() => parseLibraryDocument(future)).toThrow(UnsupportedLibraryVersionError);
  });

  it("canonical writer removes the legacy priority key", () => {
    const parsed = parseLibraryDocument(v1([{ id: "a", name: "A", priority: 1 }])).document;
    const written = canonicalDocumentForWrite(parsed);
    expect(Object.prototype.hasOwnProperty.call(written.games[0], "priority")).toBe(false);
    expect(JSON.stringify(written)).not.toContain("\"priority\"");
  });
});
