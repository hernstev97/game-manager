import { describe, expect, it } from "vitest";
import {
  RECENT_FILTERS_STORAGE_KEY,
  clearRecentFilterPresets,
  parseRecentFilterPresets,
  recordRecentFilterPreset,
} from "./recent-filters";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("recent filter presets", () => {
  it("stores only active field filters and deduplicates normalized combinations", () => {
    const storage = memoryStorage();
    const first = recordRecentFilterPreset({
      query: "not persisted",
      fields: {
        platforms: { kind: "multi", selected: ["PC", "Switch"] },
        owned: { kind: "multi", selected: [] },
      },
    }, storage, new Date("2026-08-22T12:00:00Z"));
    const second = recordRecentFilterPreset({
      query: "different query",
      fields: { platforms: { kind: "multi", selected: ["Switch", "PC"] } },
    }, storage, new Date("2026-08-22T13:00:00Z"));

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(second[0]?.filters.query).toBe("");
    expect(second[0]?.filters.fields.platforms).toEqual({
      kind: "multi",
      selected: ["PC", "Switch"],
    });
  });

  it("ignores malformed data and can clear the stored history", () => {
    const storage = memoryStorage();
    storage.setItem(RECENT_FILTERS_STORAGE_KEY, "not-json");
    expect(parseRecentFilterPresets(storage.getItem(RECENT_FILTERS_STORAGE_KEY))).toEqual([]);
    recordRecentFilterPreset(
      { query: "", fields: { wishlisted: { kind: "multi", selected: ["true"] } } },
      storage,
    );
    clearRecentFilterPresets(storage);
    expect(storage.getItem(RECENT_FILTERS_STORAGE_KEY)).toBeNull();
  });
});
