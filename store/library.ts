"use client";

import { create } from "zustand";
import {
  newGameId,
  normalizeGame,
  type GameRecord,
} from "@/lib/game-fields";
import {
  EMPTY_FILTERS,
  type LibraryFilters,
  type SortState,
} from "@/lib/filter-games";
import { assignPriority, movePriorityToFront, reorderVisiblePriorities } from "@/lib/priority";
import { importLibraryPayload, exportLibraryJson, downloadTextFile } from "@/lib/import-export";
import {
  buildLibraryDocument,
  loadLibraryDocument,
  saveLibraryDocument,
  emptyLibraryDocument,
  settingsFromSort,
  sortFromSettings,
  type LibrarySettings,
} from "@/lib/storage";
import { steamCover, type SteamOwnedGame, type SteamPriceSnapshot } from "@/lib/steam";

type LibraryState = {
  hydrated: boolean;
  games: GameRecord[];
  sort: SortState;
  steamId: string;
  steamApiKey: string;
  filters: LibraryFilters;
  selectedId: string | null;
  editorOpen: boolean;
  addOpen: boolean;
  settingsOpen: boolean;
  hydrate: () => void;
  persist: () => void;
  setFilters: (filters: LibraryFilters | ((current: LibraryFilters) => LibraryFilters)) => void;
  clearFilters: () => void;
  setSort: (sort: SortState) => void;
  selectGame: (id: string | null) => void;
  openEditor: (id: string) => void;
  closeEditor: () => void;
  setAddOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  updateGame: (id: string, patch: Partial<GameRecord>) => void;
  setGamePriority: (id: string, priority: number | null) => void;
  moveGameToFront: (id: string) => void;
  reorderPriorities: (visibleOrderedIds: string[]) => void;
  addGame: (partial: Partial<GameRecord>) => GameRecord;
  deleteGame: (id: string) => void;
  clearLibrary: () => void;
  importJson: (raw: unknown) => { added: number; updated: number; skipped: number; total: number };
  exportJson: () => void;
  setSteamCredentials: (steamId: string, steamApiKey: string) => void;
  applySteamPlaytime: (owned: SteamOwnedGame[]) => { updated: number; markedOwned: number };
  refreshSteamIdentity: (
    updates: Array<{
      id: string;
      name?: string;
      coverUrl?: string;
      released?: boolean;
      steamPrice?: SteamPriceSnapshot | null;
    }>,
  ) => number;
};

function persistNow(state: Pick<LibraryState, "games" | "sort" | "steamId" | "steamApiKey">) {
  const settings: LibrarySettings = settingsFromSort(state.sort, {
    steamId: state.steamId,
    steamApiKey: state.steamApiKey,
  });
  saveLibraryDocument(buildLibraryDocument(state.games, settings));
}

export const useLibrary = create<LibraryState>((set, get) => ({
  hydrated: false,
  games: [],
  sort: { by: "name", dir: "asc" },
  steamId: "",
  steamApiKey: "",
  filters: EMPTY_FILTERS,
  selectedId: null,
  editorOpen: false,
  addOpen: false,
  settingsOpen: false,

  hydrate: () => {
    if (get().hydrated) return;
    try {
      const stored = loadLibraryDocument();
      const document = stored ?? emptyLibraryDocument();
      if (!stored) {
        saveLibraryDocument(document);
      }
      set({
        hydrated: true,
        games: document.games,
        sort: sortFromSettings(document.settings, document.games),
        steamId: document.settings.steamId,
        steamApiKey: document.settings.steamApiKey,
      });
    } catch {
      set({
        hydrated: true,
        games: [],
        sort: { by: "name", dir: "asc" },
        steamId: "",
        steamApiKey: "",
      });
    }
  },

  persist: () => {
    persistNow(get());
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: typeof filters === "function" ? filters(state.filters) : filters,
    }));
  },

  clearFilters: () => set({ filters: EMPTY_FILTERS }),

  setSort: (sort) => {
    set({ sort });
    persistNow(get());
  },

  selectGame: (id) => set({ selectedId: id }),

  openEditor: (id) => set({ selectedId: id, editorOpen: true }),

  closeEditor: () => set({ editorOpen: false }),

  setAddOpen: (open) => set({ addOpen: open }),

  setSettingsOpen: (open) => set({ settingsOpen: open }),

  updateGame: (id, patch) => {
    set((state) => ({
      games: state.games.map((game) =>
        game.id === id ? normalizeGame({ ...game, ...patch, id: game.id }) : game,
      ),
    }));
    persistNow(get());
  },

  setGamePriority: (id, priority) => {
    set((state) => ({ games: assignPriority(state.games, id, priority) }));
    persistNow(get());
  },

  moveGameToFront: (id) => {
    set((state) => ({ games: movePriorityToFront(state.games, id) }));
    persistNow(get());
  },

  reorderPriorities: (visibleOrderedIds) => {
    set((state) => ({ games: reorderVisiblePriorities(state.games, visibleOrderedIds) }));
    persistNow(get());
  },

  addGame: (partial) => {
    const game = normalizeGame({
      ...partial,
      id: partial.id && String(partial.id).trim() ? partial.id : newGameId(),
      dateAdded: partial.dateAdded ?? new Date().toISOString(),
      coverUrl:
        partial.coverUrl ||
        (typeof partial.steamAppId === "number" ? steamCover(partial.steamAppId, "header") : ""),
    });
    set((state) => ({
      games: [game, ...state.games],
      selectedId: game.id,
      editorOpen: true,
      addOpen: false,
    }));
    persistNow(get());
    return game;
  },

  deleteGame: (id) => {
    set((state) => ({
      games: assignPriority(
        state.games.filter((game) => game.id !== id),
        id,
        null,
      ),
      selectedId: state.selectedId === id ? null : state.selectedId,
      editorOpen: state.selectedId === id ? false : state.editorOpen,
    }));
    persistNow(get());
  },

  clearLibrary: () => {
    set({
      games: [],
      sort: { by: "name", dir: "asc" },
      filters: EMPTY_FILTERS,
      selectedId: null,
      editorOpen: false,
    });
    persistNow(get());
  },

  importJson: (raw) => {
    const current = get();
    const result = importLibraryPayload(raw, current.games, {
      sortBy: current.sort.by,
      sortDir: current.sort.dir,
      steamId: current.steamId,
      steamApiKey: current.steamApiKey,
    });
    const next = {
      games: result.document.games,
      sort: sortFromSettings(result.document.settings, result.document.games),
      steamId: result.document.settings.steamId,
      steamApiKey: result.document.settings.steamApiKey,
    };
    persistNow(next);
    set(next);
    return {
      added: result.added,
      updated: result.updated,
      skipped: result.skipped,
      total: result.added + result.updated,
    };
  },

  exportJson: () => {
    const state = get();
    const json = exportLibraryJson(state.games, {
      sortBy: state.sort.by,
      sortDir: state.sort.dir,
      steamId: state.steamId,
      steamApiKey: state.steamApiKey,
    });
    downloadTextFile("game-library.json", json);
  },

  setSteamCredentials: (steamId, steamApiKey) => {
    set({ steamId, steamApiKey });
    persistNow(get());
  },

  applySteamPlaytime: (owned) => {
    const byApp = new Map(owned.map((game) => [game.appId, game]));
    const now = new Date().toISOString();
    let updated = 0;
    let markedOwned = 0;
    set((state) => ({
      games: state.games.map((game) => {
        if (game.steamAppId == null) return game;
        const match = byApp.get(game.steamAppId);
        if (!match) return game;
        updated += 1;
        const nextOwned = game.owned || true;
        if (!game.owned) markedOwned += 1;
        return normalizeGame({
          ...game,
          owned: nextOwned,
          playtimeMinutes: match.playtimeMinutes,
          lastSynced: now,
          name: game.name || match.name,
        });
      }),
    }));
    persistNow(get());
    return { updated, markedOwned };
  },

  refreshSteamIdentity: (updates) => {
    const byId = new Map(updates.map((item) => [item.id, item]));
    let updated = 0;
    set((state) => ({
      games: state.games.map((game) => {
        const patch = byId.get(game.id);
        if (!patch) return game;
        updated += 1;
        return normalizeGame({
          ...game,
          name: patch.name || game.name,
          coverUrl: patch.coverUrl || game.coverUrl,
          released: patch.released ?? game.released,
          steamPrice: patch.steamPrice !== undefined ? patch.steamPrice : game.steamPrice,
          lastSynced: new Date().toISOString(),
        });
      }),
    }));
    persistNow(get());
    return updated;
  },
}));
