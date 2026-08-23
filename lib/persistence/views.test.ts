import { describe, expect, it } from "vitest";
import type { SavedViewComparableState } from "../model/views";
import {
  DEFAULT_SYSTEM_SAVED_VIEW_ID,
  SYSTEM_SAVED_VIEW_IDS,
} from "../model/views";
import {
  createCustomSavedView,
  createSystemSavedViews,
  isSavedViewDirty,
  normalizeSavedViews,
} from "./views";

const customId = "018f6b9a-8a9e-7c11-8b6e-8f8bb1a0a111";

function comparable(overrides: Partial<SavedViewComparableState> = {}): SavedViewComparableState {
  return {
    name: "Meine Ansicht",
    filters: { query: "", fields: {} },
    sort: { by: "name", dir: "asc" },
    displayMode: "list",
    groupBy: "none",
    ...overrides,
  };
}

describe("saved views", () => {
  it("materializes all required protected system views", () => {
    const views = createSystemSavedViews();
    expect(views.map((view) => view.id)).toEqual(Object.values(SYSTEM_SAVED_VIEW_IDS));
    expect(views.find((view) => view.id === SYSTEM_SAVED_VIEW_IDS.queue)).toMatchObject({
      name: "Als Nächstes",
      sort: { by: "queuePosition", dir: "asc" },
      displayMode: "list",
    });
    expect(views.find((view) => view.id === SYSTEM_SAVED_VIEW_IDS.favorites)).toMatchObject({
      name: "Favoriten",
      sort: { by: "favoriteRank", dir: "asc" },
      displayMode: "grid",
    });
  });

  it("normalizes exactly one default and protects system semantics", () => {
    const tampered = {
      ...createSystemSavedViews()[0]!,
      name: "Manipuliert",
      sort: { by: "rating", dir: "desc" as const },
      isDefault: true,
      futureSystem: "kept",
    };
    const normalized = normalizeSavedViews([tampered]);
    const all = normalized.savedViews.find((view) => view.id === DEFAULT_SYSTEM_SAVED_VIEW_ID)!;
    expect(all.name).toBe("Alle Spiele");
    expect(all.sort).toEqual({ by: "name", dir: "asc" });
    expect(all.futureSystem).toBe("kept");
    expect(normalized.defaultView).toBe(DEFAULT_SYSTEM_SAVED_VIEW_ID);
    expect(normalized.savedViews.filter((view) => view.isDefault)).toHaveLength(1);
  });

  it("creates stable UUID custom IDs and rejects system IDs", () => {
    const view = createCustomSavedView(comparable(), customId);
    expect(view.id).toBe(customId);
    expect(view.kind).toBe("custom");
    expect(() => createCustomSavedView(comparable(), "system:queue")).toThrow();
  });

  it("ignores key order and set-like selection order for dirty detection", () => {
    const baseline = comparable({
      filters: {
        query: "",
        fields: { genres: { kind: "multi", selected: ["RPG", "Action"] } },
      },
    });
    const reordered = comparable({
      filters: {
        fields: { genres: { selected: ["Action", "RPG", "RPG"], kind: "multi" } },
        query: "",
      },
    });
    expect(isSavedViewDirty(baseline, reordered)).toBe(false);
    expect(isSavedViewDirty(baseline, { ...reordered, displayMode: "grid" })).toBe(true);
  });

  it("migrates priority filters and sort in custom views", () => {
    const legacy = createCustomSavedView(
      comparable({
        filters: {
          query: "",
          fields: {
            priority: { kind: "priority", selected: ["has"] },
          } as never,
        },
        sort: { by: "priority", dir: "asc" },
      }),
      customId,
    );
    const normalized = normalizeSavedViews([legacy], customId);
    const custom = normalized.savedViews.find((view) => view.id === customId)!;
    expect(custom.filters.fields.queuePosition).toMatchObject({ kind: "queue", selected: ["has"] });
    expect(custom.filters.fields.priority).toBeUndefined();
    expect(custom.sort.by).toBe("queuePosition");
    expect(custom.isDefault).toBe(true);
  });
});
