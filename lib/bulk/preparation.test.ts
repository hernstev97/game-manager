import { describe, expect, it } from "vitest";
import { normalizeGame } from "../game-fields";
import type { LibraryDocumentV2 } from "../model";
import { defaultDocumentPreferences } from "../persistence/schema";
import { prepareMetadataJob, prepareSelectionDocument } from "./preparation";

function document(): LibraryDocumentV2 {
  const preferences = defaultDocumentPreferences();
  return {
    customRoot: { apiToken: "root-secret", keep: "extension" },
    format: "ggrid-library",
    version: 2,
    exportedAt: "2026-08-20T10:00:00.000Z",
    games: [
      normalizeGame({
        id: "a",
        name: "A",
        queuePosition: 4,
        credentials: { password: "game-secret" },
      }),
      normalizeGame({ id: "b", name: "B", queuePosition: 9 }),
    ],
    savedViews: [],
    defaultView: "system:all-games",
    franchises: [],
    ...preferences,
    integrations: {
      steamId: "public-steam-id",
      igdbClientId: "public-igdb-id",
      igdbClientSecret: "must-not-export",
    },
  } as LibraryDocumentV2;
}

describe("bulk preparation", () => {
  it("prepares, but does not execute, metadata work in visible selection order", () => {
    const games = [normalizeGame({ id: "a", name: "A" }), normalizeGame({ id: "b", name: "B" })];
    const prepared = prepareMetadataJob(games, ["a", "b"], ["b", "a"], ["genres", "genres", "coverUrl"]);

    expect(prepared).toEqual({
      kind: "metadata-refresh",
      payload: {
        scope: "selected-games",
        gameIds: ["b", "a"],
        requestedFields: ["genres", "coverUrl"],
      },
    });
  });

  it("creates a complete canonical partial document without credentials", () => {
    const exported = prepareSelectionDocument(
      document(),
      ["b"],
      "2026-08-22T12:00:00.000Z",
    );
    const serialized = JSON.stringify(exported);

    expect(exported).toMatchObject({
      format: "ggrid-library",
      version: 2,
      exportedAt: "2026-08-22T12:00:00.000Z",
      customRoot: { keep: "extension" },
      integrations: { steamId: "public-steam-id", igdbClientId: "public-igdb-id" },
    });
    expect(exported.games.map((game) => [game.id, game.queuePosition])).toEqual([["b", 1]]);
    expect(serialized).not.toMatch(/secret|password|credential|apiToken/i);
  });
});
