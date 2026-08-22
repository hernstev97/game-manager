import { describe, expect, it } from "vitest";
import { normalizeGame } from "../game-fields";
import type { SnapshotReference } from "../model/operation-contracts";
import { createLibraryBackup, exportLibraryJson } from "./export";
import { applyLibraryImport, planLibraryImport } from "./import";
import { buildCanonicalLibraryDocument } from "./migration";
import {
  LIBRARY_CREDENTIALS_STORAGE_KEY,
  LIBRARY_STORAGE_KEY,
  createLibraryRepository,
  type LibraryStorage,
} from "./repository";
import { DEFAULT_SETTINGS } from "./schema";

const at = "2026-08-22T12:00:00.000Z";
const later = "2026-08-22T13:00:00.000Z";

function document(games: Array<Record<string, unknown>>) {
  return buildCanonicalLibraryDocument(
    games.map((game) => normalizeGame(game)),
    DEFAULT_SETTINGS,
    at,
  );
}

function memoryStorage(): LibraryStorage & { map: Map<string, string>; failNextDocumentWrite: boolean } {
  const map = new Map<string, string>();
  return {
    map,
    failNextDocumentWrite: false,
    getItem: (key) => map.get(key) ?? null,
    setItem(key, value) {
      if (key === LIBRARY_STORAGE_KEY && this.failNextDocumentWrite) {
        this.failNextDocumentWrite = false;
        throw new Error("document write failed");
      }
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

const snapshot: SnapshotReference = {
  id: "snapshot-1",
  createdAt: at,
  reason: "before-import",
  documentVersion: 2,
};

describe("backup secret policy", () => {
  it("exports a complete v2 document without secrets by default", () => {
    const json = exportLibraryJson(
      [normalizeGame({ id: "a", name: "Alpha", priority: 1 })],
      {
        ...DEFAULT_SETTINGS,
        steamId: "public-steam-id",
        steamApiKey: "secret-api-key",
        igdbClientId: "public-client-id",
        igdbClientSecret: "secret-client-value",
      },
    );
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(2);
    expect(parsed.integrations).toEqual({
      steamId: "public-steam-id",
      igdbClientId: "public-client-id",
    });
    expect(json).not.toContain("secret-api-key");
    expect(json).not.toContain("secret-client-value");
    expect(json).not.toContain("\"priority\"");
  });

  it("includes secrets only with an explicit warning timestamp", () => {
    const backup = createLibraryBackup(
      document([{ id: "a", name: "Alpha" }]),
      { mode: "include", warningAcknowledgedAt: at },
      { steamApiKey: "key", igdbClientSecret: "secret" },
    );
    expect(backup.sensitive).toMatchObject({
      inclusion: "explicit-user-consent",
      warningAcknowledgedAt: at,
      credentials: { steamApiKey: "key", igdbClientSecret: "secret" },
    });
    expect(() =>
      createLibraryBackup(
        document([]),
        { mode: "include", warningAcknowledgedAt: "yesterday" },
        { steamApiKey: "key", igdbClientSecret: "secret" },
      ),
    ).toThrow();
  });
});

describe("validated import plans", () => {
  it("merges by external identity and keeps the existing internal game ID", () => {
    const current = document([
      { id: "local", name: "Old", steamAppId: 10, localExtension: "keep", rating: 2 },
    ]);
    const incoming = document([
      { id: "incoming", name: "New", steamAppId: 10, rating: 9, queuePosition: 20 },
      { id: "added", name: "Added", queuePosition: 20 },
    ]);
    const plan = planLibraryImport(incoming, current, "merge", { now: at });

    expect(plan.canApply).toBe(true);
    expect(plan.candidate.games).toHaveLength(2);
    expect(plan.candidate.games.find((game) => game.id === "local")).toMatchObject({
      name: "New",
      rating: 9,
      localExtension: "keep",
    });
    expect(plan.candidate.games.map((game) => game.queuePosition)).toEqual([1, 2]);
  });

  it("replace removes local entities and normalizes installed system views", () => {
    const current = document([{ id: "local", name: "Local" }]);
    const incoming = document([{ id: "incoming", name: "Incoming" }]);
    const plan = planLibraryImport(incoming, current, "replace", { now: at });
    expect(plan.candidate.games.map((game) => game.id)).toEqual(["incoming"]);
    expect(plan.candidate.savedViews.filter((view) => view.kind === "system")).toHaveLength(7);
  });

  it("reports a custom view using a system ID as a blocking conflict", () => {
    const current = document([]);
    const incoming = structuredClone(document([]));
    incoming.savedViews[0] = {
      ...incoming.savedViews[0]!,
      kind: "custom",
    };
    const plan = planLibraryImport(incoming, current, "merge", { now: at });
    expect(plan.canApply).toBe(false);
    expect(plan.conflicts).toEqual([
      expect.objectContaining({
        code: "custom-view-uses-system-id",
        allowedResolutions: ["keep-existing", "import-as-new", "cancel-import"],
      }),
    ]);

    const resolved = planLibraryImport(incoming, current, "merge", {
      now: at,
      resolutions: { [plan.conflicts[0]!.id]: "import-as-new" },
    });
    expect(resolved.canApply).toBe(true);
    expect(resolved.candidate.savedViews.filter((view) => view.kind === "custom")).toHaveLength(1);
    expect(resolved.candidate.savedViews.find((view) => view.kind === "custom")?.id).not.toMatch(/^system:/);
  });

  it("runs the snapshot hook before one atomic document/credential write", async () => {
    const storage = memoryStorage();
    const repository = createLibraryRepository(storage);
    const current = document([{ id: "local", name: "Local" }]);
    repository.writeAtomic({
      document: current,
      credentials: { steamApiKey: "old-key", igdbClientSecret: "old-secret" },
    });
    const backup = createLibraryBackup(
      document([{ id: "incoming", name: "Incoming" }]),
      { mode: "include", warningAcknowledgedAt: at },
      { steamApiKey: "new-key", igdbClientSecret: "new-secret" },
    );
    const plan = planLibraryImport(backup, current, "replace", { now: at });
    const events: string[] = [];
    const result = await applyLibraryImport(
      plan,
      repository,
      async () => {
        events.push("snapshot");
        expect(JSON.parse(storage.map.get(LIBRARY_STORAGE_KEY)!).games[0].id).toBe("local");
        return snapshot;
      },
      later,
    );
    events.push("applied");

    expect(events).toEqual(["snapshot", "applied"]);
    expect(result.document.games.map((game) => game.id)).toEqual(["incoming"]);
    expect(JSON.parse(storage.map.get(LIBRARY_CREDENTIALS_STORAGE_KEY)!)).toEqual({
      steamApiKey: "new-key",
      igdbClientSecret: "new-secret",
    });
  });

  it("rolls back document and credentials when the atomic write fails", async () => {
    const storage = memoryStorage();
    const repository = createLibraryRepository(storage);
    const current = document([{ id: "local", name: "Local" }]);
    repository.writeAtomic({
      document: current,
      credentials: { steamApiKey: "old-key", igdbClientSecret: "old-secret" },
    });
    const beforeDocument = storage.map.get(LIBRARY_STORAGE_KEY);
    const beforeCredentials = storage.map.get(LIBRARY_CREDENTIALS_STORAGE_KEY);
    const backup = createLibraryBackup(
      document([{ id: "incoming", name: "Incoming" }]),
      { mode: "include", warningAcknowledgedAt: at },
      { steamApiKey: "new-key", igdbClientSecret: "new-secret" },
    );
    const plan = planLibraryImport(backup, current, "replace", { now: at });
    storage.failNextDocumentWrite = true;

    await expect(
      applyLibraryImport(plan, repository, async () => snapshot, later),
    ).rejects.toThrow("document write failed");
    expect(storage.map.get(LIBRARY_STORAGE_KEY)).toBe(beforeDocument);
    expect(storage.map.get(LIBRARY_CREDENTIALS_STORAGE_KEY)).toBe(beforeCredentials);
  });

  it("does not write anything when the snapshot hook fails", async () => {
    const storage = memoryStorage();
    const repository = createLibraryRepository(storage);
    const current = document([{ id: "local", name: "Local" }]);
    repository.writeAtomic({ document: current });
    const before = storage.map.get(LIBRARY_STORAGE_KEY);
    const plan = planLibraryImport(
      document([{ id: "incoming", name: "Incoming" }]),
      current,
      "replace",
      { now: at },
    );
    await expect(
      applyLibraryImport(plan, repository, async () => {
        throw new Error("snapshot failed");
      }),
    ).rejects.toThrow("snapshot failed");
    expect(storage.map.get(LIBRARY_STORAGE_KEY)).toBe(before);
  });
});
