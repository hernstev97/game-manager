import { describe, expect, it } from "vitest";
import type { StoredLibrarySnapshot } from "@/lib/persistence/snapshots";
import {
  INITIAL_SNAPSHOT_UI_STATE,
  confirmationForSnapshot,
  presentSnapshot,
  snapshotUiReducer,
} from ".";

function snapshot(): StoredLibrarySnapshot {
  return {
    reference: {
      id: "snapshot-1",
      createdAt: "2026-08-22T10:00:00.000Z",
      reason: "manual",
      documentVersion: 2,
    },
    document: {
      format: "ggrid-library",
      version: 2,
      exportedAt: "2026-08-22T10:00:00.000Z",
      games: [{ id: "game-1", name: "Testspiel" } as never],
      savedViews: [{ id: "view-1", name: "Meine Ansicht" } as never],
      defaultView: "view-1",
      franchises: [],
      theme: {} as never,
      motion: "standard",
      displayMode: "list",
      groupBy: "none",
      localUi: {},
      integrations: { steamId: "", igdbClientId: "" },
    },
    metadata: { gameCount: 1, viewCount: 1, sizeBytes: 2048, protected: true },
  };
}

describe("snapshot presentation", () => {
  it("summarizes full snapshots without exposing their document contract to the UI", () => {
    const presented = presentSnapshot(snapshot(), { timeZone: "UTC" });
    expect(presented).toMatchObject({
      reasonLabel: "Manueller Snapshot",
      gameNames: ["Testspiel"],
      viewNames: ["Meine Ansicht"],
      sizeLabel: "2 KB",
      protected: true,
    });
  });

  it("requires the safety snapshot in restore confirmation copy", () => {
    expect(confirmationForSnapshot("restore", { createdAtLabel: "22.08.2026" }).detail)
      .toContain("Sicherheitssnapshot");
  });
});

describe("snapshot UI reducer", () => {
  it("locks dialog changes while an operation is pending", () => {
    const opened = snapshotUiReducer(INITIAL_SNAPSHOT_UI_STATE, {
      type: "open",
      dialog: { kind: "restore", snapshotId: "snapshot-1" },
    });
    const pending = snapshotUiReducer(opened, {
      type: "start",
      pending: { kind: "restore", snapshotId: "snapshot-1" },
    });
    expect(snapshotUiReducer(pending, { type: "close" })).toEqual(pending);
  });
});
