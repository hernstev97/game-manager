import {
  newGameId,
  normalizeGame,
} from "../../lib/game-fields";
import { EMPTY_FILTERS } from "../../lib/filter-games";
import {
  downloadTextFile,
  exportLibraryJson,
  importLibraryPayload,
} from "../../lib/import-export";
import { sortFromSettings } from "../../lib/storage";
import { assignPriority, movePriorityToFront, reorderVisiblePriorities } from "../../lib/priority";
import { steamCover, type SteamOwnedGame } from "../../lib/steam";
import type {
  LibrarySliceContext,
  LibraryState,
  PersistedLibraryState,
} from "./types";

type GameSlice = Pick<
  LibraryState,
  | "games"
  | "updateGame"
  | "setGamePriority"
  | "moveGameToFront"
  | "reorderPriorities"
  | "addGame"
  | "deleteGame"
  | "clearLibrary"
  | "importJson"
  | "exportJson"
  | "applySteamPlaytime"
  | "refreshSteamIdentity"
>;

function integrationSettings(state: LibraryState) {
  return {
    sortBy: state.sort.by,
    sortDir: state.sort.dir,
    steamId: state.steamId,
    steamApiKey: state.steamApiKey,
    igdbClientId: state.igdbClientId,
    igdbClientSecret: state.igdbClientSecret,
  };
}

export function createGameSlice({ set, get, persist }: LibrarySliceContext): GameSlice {
  return {
    games: [],

    updateGame: (id, patch) => {
      set((state) => ({
        games: state.games.map((game) =>
          game.id === id ? normalizeGame({ ...game, ...patch, id: game.id }) : game,
        ),
      }));
      persist();
    },

    setGamePriority: (id, priority) => {
      set((state) => ({ games: assignPriority(state.games, id, priority) }));
      persist();
    },

    moveGameToFront: (id) => {
      set((state) => ({ games: movePriorityToFront(state.games, id) }));
      persist();
    },

    reorderPriorities: (visibleOrderedIds) => {
      set((state) => ({ games: reorderVisiblePriorities(state.games, visibleOrderedIds) }));
      persist();
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
      persist();
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
      persist();
    },

    clearLibrary: () => {
      set({
        games: [],
        sort: { by: "name", dir: "asc" },
        filters: EMPTY_FILTERS,
        selectedId: null,
        editorOpen: false,
      });
      persist();
    },

    importJson: (raw) => {
      const current = get();
      const result = importLibraryPayload(raw, current.games, integrationSettings(current));
      const next: PersistedLibraryState = {
        games: result.document.games,
        sort: sortFromSettings(result.document.settings, result.document.games),
        steamId: result.document.settings.steamId,
        steamApiKey: result.document.settings.steamApiKey,
        igdbClientId: result.document.settings.igdbClientId,
        igdbClientSecret: result.document.settings.igdbClientSecret,
      };
      persist(next);
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
      const json = exportLibraryJson(state.games, integrationSettings(state));
      downloadTextFile("game-library.json", json);
    },

    applySteamPlaytime: (owned: SteamOwnedGame[]) => {
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
      persist();
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
            genres: patch.genres ?? game.genres,
            franchise:
              patch.franchise !== undefined ? patch.franchise || game.franchise : game.franchise,
            platforms: patch.platforms ?? game.platforms,
            igdbId: patch.igdbId !== undefined ? patch.igdbId : game.igdbId,
            steamAppId: patch.steamAppId !== undefined ? patch.steamAppId : game.steamAppId,
            lastSynced: new Date().toISOString(),
          });
        }),
      }));
      persist();
      return updated;
    },
  };
}
