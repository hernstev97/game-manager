import { describe, expect, it } from "vitest";
import type { LibraryDocumentV2 } from "../model";
import { UndoHistory, UndoStateConflictError } from "./undo-history";

function document(marker: string): LibraryDocumentV2 {
  return {
    format: "ggrid-library",
    version: 2,
    exportedAt: "2026-08-22T10:00:00.000Z",
    games: [],
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

describe("UndoHistory", () => {
  it("records a grouped transaction and atomically supports undo and redo", () => {
    const history = new UndoHistory({
      createId: () => "tx-1",
      now: () => new Date("2026-08-22T10:00:00.000Z"),
    });
    const before = document("before");
    const after = document("after");

    const transaction = history.record("Bulk edit", before, after, [
      { entity: "game", entityId: "one", before: null, after: { name: "One" } },
      { entity: "game", entityId: "two", before: null, after: { name: "Two" } },
    ]);

    expect(transaction?.changes).toHaveLength(2);
    expect(history.undo(after)?.document.localUi).toEqual({ marker: "before" });
    expect(history.redo(before)?.document.localUi).toEqual({ marker: "after" });
  });

  it("bounds history and clears redo after a new branch", () => {
    const history = new UndoHistory({ limit: 2 });
    history.record("one", document("0"), document("1"));
    history.record("two", document("1"), document("2"));
    history.record("three", document("2"), document("3"));

    expect(history.undoCount).toBe(2);
    const state2 = history.undo(document("3"))!.document;
    expect(history.canRedo).toBe(true);
    history.record("branch", state2, document("branch"));
    expect(history.canRedo).toBe(false);
  });

  it("does not mutate stacks or state when the current document conflicts", () => {
    const history = new UndoHistory();
    history.record("edit", document("before"), document("after"));

    expect(() => history.undo(document("external-change"))).toThrow(
      UndoStateConflictError,
    );
    expect(history.undoCount).toBe(1);
    expect(history.redoCount).toBe(0);
  });

  it("stores detached document copies and ignores no-op transactions", () => {
    const history = new UndoHistory();
    const before = document("before");
    const after = document("after");
    history.record("edit", before, after);
    after.localUi.marker = "mutated";

    expect(history.undo(document("after"))?.document.localUi).toEqual({
      marker: "before",
    });
    expect(history.record("noop", before, { ...before })).toBeNull();
  });
});
