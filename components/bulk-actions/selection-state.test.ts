import { describe, expect, it } from "vitest";
import {
  createSelectionSlice,
  INITIAL_SELECTION_STATE,
  selectionItemDecision,
  selectionReducer,
  type SelectionSlice,
} from "../../store/slices/selection";

describe("selectionReducer", () => {
  it("starts explicitly, toggles stable IDs and ends by clearing selection", () => {
    let state = selectionReducer(INITIAL_SELECTION_STATE, { type: "start", initialId: "game-b" });
    state = selectionReducer(state, { type: "toggle", id: "game-a" });
    state = selectionReducer(state, { type: "toggle", id: "game-b" });

    expect(state).toMatchObject({
      selectionMode: true,
      selectedIds: ["game-a"],
      selectedCount: 1,
      dndDisabled: true,
    });
    expect(selectionReducer(state, { type: "end" })).toEqual(INITIAL_SELECTION_STATE);
  });

  it("adds every visible ID once, keeps hidden selections and can clear in-place", () => {
    const active = selectionReducer(INITIAL_SELECTION_STATE, { type: "start", initialId: "hidden" });
    const all = selectionReducer(active, {
      type: "select-visible",
      ids: ["visible-b", "visible-a", "visible-b", ""],
    });

    expect(all.selectedIds).toEqual(["hidden", "visible-b", "visible-a"]);
    expect(selectionReducer(all, { type: "clear" })).toMatchObject({
      selectionMode: true,
      selectedIds: [],
      selectedCount: 0,
    });
  });

  it("cleans up deleted IDs without coupling selection to view order", () => {
    const selected = {
      ...INITIAL_SELECTION_STATE,
      selectionMode: true,
      dndDisabled: true,
      selectedIds: ["a", "b", "c"],
      selectedCount: 3,
    };
    const cleaned = selectionReducer(selected, {
      type: "cleanup",
      existingIds: ["c", "a"],
    });
    expect(cleaned.selectedIds).toEqual(["a", "c"]);
    expect(cleaned.selectedCount).toBe(2);
  });

  it("routes item activation to selection instead of the editor while active", () => {
    expect(selectionItemDecision({ selectionMode: true })).toBe("toggle-selection");
    expect(selectionItemDecision({ selectionMode: false })).toBe("open-editor");
  });

  it("exposes count/membership and prevents the normal editor callback in selection mode", () => {
    let state: SelectionSlice;
    const slice = createSelectionSlice<SelectionSlice>({
      get: () => state,
      set: (update) => {
        const partial = typeof update === "function" ? update(state) : update;
        state = { ...state, ...partial };
      },
    });
    state = slice;
    const opened: string[] = [];

    state.activateSelectionItem("a", (id) => opened.push(id));
    state.startSelection();
    state.activateSelectionItem("a", (id) => opened.push(id));

    expect(opened).toEqual(["a"]);
    expect(state.isSelected("a")).toBe(true);
    expect(state.selectedCount).toBe(1);
    expect(state.dndDisabled).toBe(true);
  });
});
