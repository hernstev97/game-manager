import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, LIBRARY_STORAGE_KEY, buildLibraryDocument } from "@/lib/storage";
import { SYSTEM_SAVED_VIEW_IDS } from "@/lib/model/views";
import { normalizeGame } from "@/lib/game-fields";
import { useLibrary } from "@/store/library";

function installMemoryWindow() {
  const values = new Map<string, string>();
  const previous = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    },
  });
  return {
    values,
    restore: () => {
      if (previous === undefined) Reflect.deleteProperty(globalThis, "window");
      else Object.defineProperty(globalThis, "window", { configurable: true, value: previous });
    },
  };
}

describe("library store v2 integration", () => {
  let restore: (() => void) | undefined;

  afterEach(() => {
    restore?.();
    restore = undefined;
    useLibrary.setState({
      hydrated: false,
      selectionMode: false,
      selectedIds: [],
      selectedCount: 0,
      dndDisabled: false,
    });
  });

  it("hydrates current view preferences and keeps selection session-only", () => {
    const memory = installMemoryWindow();
    restore = memory.restore;
    const base = buildLibraryDocument([], DEFAULT_SETTINGS, "2026-08-22T00:00:00.000Z");
    memory.values.set(LIBRARY_STORAGE_KEY, JSON.stringify({
      ...base,
      displayMode: "grid",
      groupBy: "franchise",
      localUi: { activeSort: { by: "dateAdded", dir: "desc" } },
    }));

    useLibrary.getState().hydrate();
    expect(useLibrary.getState()).toMatchObject({
      displayMode: "grid",
      groupBy: "franchise",
      sort: { by: "dateAdded", dir: "desc" },
      activeViewId: SYSTEM_SAVED_VIEW_IDS.allGames,
    });

    useLibrary.getState().startSelection("game-1");
    useLibrary.getState().setDisplayMode("compact");
    const stored = JSON.parse(memory.values.get(LIBRARY_STORAGE_KEY)!);
    expect(stored.displayMode).toBe("compact");
    expect(stored).not.toHaveProperty("selectionMode");
    expect(stored).not.toHaveProperty("selectedIds");
  });

  it("applies a complete saved view and persists its portable controls", () => {
    const memory = installMemoryWindow();
    restore = memory.restore;
    const base = buildLibraryDocument([], DEFAULT_SETTINGS, "2026-08-22T00:00:00.000Z");
    memory.values.set(LIBRARY_STORAGE_KEY, JSON.stringify(base));
    useLibrary.getState().hydrate();

    useLibrary.getState().selectSavedView(SYSTEM_SAVED_VIEW_IDS.wishlist);
    const state = useLibrary.getState();
    expect(state.filters.fields.wishlisted).toEqual({ kind: "multi", selected: ["true"] });
    expect(state.displayMode).toBe("grid");
    const stored = JSON.parse(memory.values.get(LIBRARY_STORAGE_KEY)!);
    expect(stored.displayMode).toBe("grid");
    expect(stored.localUi.activeSort).toEqual({ by: "name", dir: "asc" });
  });

  it("mutates queue and favorite ranking independently and normalizes deletion", () => {
    const memory = installMemoryWindow();
    restore = memory.restore;
    const games = [
      normalizeGame({ id: "a", name: "A", queuePosition: 1, favoriteRank: 2, rating: 8 }),
      normalizeGame({ id: "b", name: "B", queuePosition: 2, favoriteRank: 1, rating: 6 }),
      normalizeGame({ id: "c", name: "C", queuePosition: null, favoriteRank: null, rating: 9 }),
    ];
    const base = buildLibraryDocument(games, DEFAULT_SETTINGS, "2026-08-22T00:00:00.000Z");
    memory.values.set(LIBRARY_STORAGE_KEY, JSON.stringify(base));
    useLibrary.getState().hydrate();

    useLibrary.getState().setFavoriteRank("c", 1);
    useLibrary.getState().insertGameQueueLast("c");
    expect(
      useLibrary.getState().games
        .filter((game) => game.favoriteRank != null)
        .sort((left, right) => left.favoriteRank! - right.favoriteRank!)
        .map((game) => [game.id, game.favoriteRank]),
    ).toEqual([["c", 1], ["b", 2], ["a", 3]]);
    expect(useLibrary.getState().games.find((game) => game.id === "c")?.queuePosition).toBe(3);

    useLibrary.getState().deleteGame("b");
    expect(useLibrary.getState().games.map((game) => [
      game.id,
      game.queuePosition,
      game.favoriteRank,
      game.rating,
    ])).toEqual([
      ["a", 1, 2, 8],
      ["c", 2, 1, 9],
    ]);
  });
});
