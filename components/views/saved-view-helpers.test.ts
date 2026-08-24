import { describe, expect, it } from "vitest";
import { DEFAULT_SYSTEM_SAVED_VIEW_ID, type SavedView } from "@/lib/model/views";
import { createSystemSavedViews } from "@/lib/persistence/views";
import {
  deleteSavedView,
  moveSavedView,
  renameSavedView,
  saveSavedViewAsNew,
  savedViewDirtyActionDecision,
  setDefaultSavedView,
  updateSavedView,
} from "./saved-view-helpers";

function custom(id: string, name: string, isDefault = false): SavedView {
  return {
    id,
    name,
    filters: { query: "", fields: {} },
    sort: { by: "name", dir: "asc" },
    displayMode: "list",
    groupBy: "none",
    isDefault,
    kind: "custom",
  };
}

describe("saved-view controllers", () => {
  it("reorders only custom slots and preserves all installed system definitions", () => {
    const systems = createSystemSavedViews();
    const first = custom("11111111-1111-4111-8111-111111111111", "Eins");
    const second = custom("22222222-2222-4222-8222-222222222222", "Zwei");
    const input = [systems[0]!, first, systems[1]!, second, ...systems.slice(2)];

    const moved = moveSavedView(input, second.id, "up");

    expect(moved.filter((view) => view.kind === "system")).toEqual(systems);
    expect(moved.filter((view) => view.kind === "custom").map((view) => view.id)).toEqual([
      second.id,
      first.id,
    ]);
  });

  it("guards system views from rename, delete, update, and reorder", () => {
    const input = createSystemSavedViews();
    const system = input[0]!;
    const current = {
      name: "Manipuliert",
      filters: { query: "test", fields: {} },
      sort: { by: "rating", dir: "desc" as const },
      displayMode: "grid" as const,
      groupBy: "franchise" as const,
    };

    expect(renameSavedView(input, system.id, "Neu")).toEqual(input);
    expect(deleteSavedView(input, system.id)).toEqual(input);
    expect(updateSavedView(input, system.id, current)).toEqual(input);
    expect(moveSavedView(input, system.id, "down")).toEqual(input);
  });

  it("distinguishes dirty actions for custom and system views", () => {
    const system = createSystemSavedViews()[0]!;
    const own = custom("11111111-1111-4111-8111-111111111111", "Eigene");

    expect(savedViewDirtyActionDecision(system, true)).toMatchObject({
      canUpdate: false,
      canSaveAsNew: true,
    });
    expect(savedViewDirtyActionDecision(own, true)).toMatchObject({
      canUpdate: true,
      canSaveAsNew: true,
    });
    expect(savedViewDirtyActionDecision(own, false)).toMatchObject({
      canUpdate: false,
      canSaveAsNew: false,
    });
  });

  it("sets one existing default and ignores an unknown target", () => {
    const input = [
      ...createSystemSavedViews(),
      custom("11111111-1111-4111-8111-111111111111", "Eigene"),
    ];
    const target = input.at(-1)!;
    const updated = setDefaultSavedView(input, target.id);

    expect(updated.filter((view) => view.isDefault)).toEqual([
      expect.objectContaining({ id: target.id }),
    ]);
    expect(setDefaultSavedView(input, "missing")).toEqual(input);
  });

  it("falls back to the installed all-games view when deleting the default", () => {
    const own = custom("11111111-1111-4111-8111-111111111111", "Eigene", true);
    const input = [
      ...createSystemSavedViews().map((view) => ({ ...view, isDefault: false })),
      own,
    ];

    const remaining = deleteSavedView(input, own.id);

    expect(remaining.filter((view) => view.isDefault)).toEqual([
      expect.objectContaining({ id: DEFAULT_SYSTEM_SAVED_VIEW_ID }),
    ]);
  });

  it("saves the complete current view combination as a custom view", () => {
    const current = {
      name: "Draft",
      filters: {
        query: "zelda",
        fields: { franchise: { kind: "multi" as const, selected: ["Zelda"] } },
      },
      sort: { by: "rating", dir: "desc" as const },
      displayMode: "compact" as const,
      groupBy: "franchise" as const,
    };
    const created = saveSavedViewAsNew(
      createSystemSavedViews(),
      current,
      "11111111-1111-4111-8111-111111111111",
      " Zelda-Abend ",
    ).at(-1);

    expect(created).toMatchObject({
      name: "Zelda-Abend",
      filters: current.filters,
      sort: current.sort,
      displayMode: "compact",
      groupBy: "franchise",
      kind: "custom",
      isDefault: false,
    });
  });
});
