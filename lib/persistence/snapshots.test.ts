import { describe, expect, it } from "vitest";
import type { LibraryDocumentV2 } from "../model";
import { MemorySnapshotStorage } from "./snapshots-memory";
import { SnapshotRepositoryError } from "./snapshots-errors";
import { IndexedDbSnapshotStorage } from "./snapshots-indexeddb";
import {
  createBeforeImportSnapshotHook,
  SnapshotRepository,
} from "./snapshots";

function document(marker: string, gameCount = 0): LibraryDocumentV2 {
  return {
    format: "ggrid-library",
    version: 2,
    exportedAt: "2026-08-22T10:00:00.000Z",
    games: Array.from(
      { length: gameCount },
      (_, index) => ({ id: `${marker}-${index}`, name: marker }) as never,
    ),
    savedViews: [],
    defaultView: "system:all-games",
    franchises: [],
    theme: {} as LibraryDocumentV2["theme"],
    motion: "standard",
    displayMode: "list",
    groupBy: "none",
    localUi: { marker },
    integrations: { steamId: "", igdbClientId: "" },
  };
}

function repository(retention = 20) {
  let sequence = 0;
  const storage = new MemorySnapshotStorage();
  const snapshots = new SnapshotRepository(storage, {
    retention,
    createId: () => `snapshot-${++sequence}`,
    now: () => new Date(Date.UTC(2026, 7, 22, 10, 0, sequence)),
  });
  return { snapshots, storage };
}

describe("SnapshotRepository", () => {
  it("stores full documents and useful metadata", async () => {
    const { snapshots } = repository();
    const stored = await snapshots.create("before-import", document("full", 2));

    expect(stored.document.localUi).toEqual({ marker: "full" });
    expect(stored.metadata).toMatchObject({
      gameCount: 2,
      viewCount: 0,
      protected: false,
    });
    expect(stored.metadata.sizeBytes).toBeGreaterThan(0);
  });

  it("adapts directly to the mandatory before-import snapshot hook", async () => {
    const { snapshots } = repository();
    const hook = createBeforeImportSnapshotHook(snapshots);

    const reference = await hook({
      importPlanId: "plan-one",
      mode: "merge",
      current: document("before-import"),
    });

    expect(reference.reason).toBe("before-import");
    expect((await snapshots.get(reference.id))?.document.localUi).toEqual({
      marker: "before-import",
    });
  });

  it("rotates only unprotected snapshots and protects manual snapshots", async () => {
    const { snapshots } = repository(2);
    const oldest = await snapshots.create("daily", document("oldest"));
    const manual = await snapshots.create("manual", document("manual"));
    await snapshots.create("daily", document("middle"));
    await snapshots.create("daily", document("newest"));

    const remaining = await snapshots.list();
    expect(remaining.map((item) => item.reference.id)).not.toContain(
      oldest.reference.id,
    );
    expect(remaining.map((item) => item.reference.id)).toContain(
      manual.reference.id,
    );
    expect(remaining.filter((item) => !item.metadata.protected)).toHaveLength(2);
  });

  it("creates a before-restore safety snapshot before returning a target", async () => {
    const { snapshots } = repository();
    const target = await snapshots.create("daily", document("target"));

    const prepared = await snapshots.prepareRestore(
      target.reference.id,
      document("current"),
    );

    expect(prepared.document.localUi).toEqual({ marker: "target" });
    const safety = await snapshots.get(prepared.safetySnapshot.id);
    expect(safety?.reference.reason).toBe("before-restore");
    expect(safety?.document.localUi).toEqual({ marker: "current" });
    expect(safety?.metadata.protected).toBe(true);
    expect(await snapshots.get(target.reference.id)).toBeDefined();
  });

  it("classifies quota failures without losing the cause category", async () => {
    const snapshots = new SnapshotRepository(
      new MemorySnapshotStorage({ quotaBytes: 10 }),
    );

    await expect(snapshots.create("daily", document("too-large"))).rejects.toMatchObject({
      code: "quota-exceeded",
    } satisfies Partial<SnapshotRepositoryError>);
  });

  it("classifies an unavailable native IndexedDB boundary", async () => {
    const snapshots = new SnapshotRepository(
      new IndexedDbSnapshotStorage({ indexedDB: undefined }),
    );

    await expect(snapshots.create("daily", document("offline"))).rejects.toMatchObject({
      code: "storage-unavailable",
    } satisfies Partial<SnapshotRepositoryError>);
  });
});
