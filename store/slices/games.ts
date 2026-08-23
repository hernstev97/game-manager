import {
  newGameId,
  normalizeGame,
} from "../../lib/game-fields";
import { EMPTY_FILTERS } from "../../lib/filter-games";
import {
  createLibraryBackup,
  downloadTextFile,
  importLibraryPayload,
  serializeLibraryBackup,
} from "../../lib/import-export";
import { libraryRepository } from "../../lib/storage";
import { sortFromSettings } from "../../lib/storage";
import {
  assignPriority,
  deleteGamesAndNormalizePositions,
  insertQueueFirst,
  insertQueueLast,
  movePriorityToFront,
  removeFavoriteRank,
  removeFromQueue,
  reorderVisibleFavorites,
  reorderVisiblePriorities,
  reorderVisibleQueue,
  setFavoriteRank as assignFavoriteRank,
} from "../../lib/priority";
import { steamCover } from "../../lib/steam";
import type {
  LibrarySliceContext,
  LibraryState,
  PersistedLibraryState,
} from "./types";
import type { FieldProvenance, FieldProvenanceMap } from "../../lib/model/shared";

type GameSlice = Pick<
  LibraryState,
  | "games"
  | "updateGame"
  | "replaceGames"
  | "setGamePriority"
  | "moveGameToFront"
  | "reorderPriorities"
  | "setFavoriteRank"
  | "insertGameQueueFirst"
  | "insertGameQueueLast"
  | "removeGameFromQueue"
  | "reorderQueue"
  | "reorderFavoriteRanks"
  | "addGame"
  | "deleteGame"
  | "clearLibrary"
  | "importJson"
  | "exportJson"
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

function patchWithManualProvenance(
  game: LibraryState["games"][number],
  patch: Partial<LibraryState["games"][number]>,
) {
  const updatedAt = new Date().toISOString();
  const explicit =
    patch.provenance && typeof patch.provenance === "object"
      ? (patch.provenance as FieldProvenanceMap)
      : {};
  const provenance: FieldProvenanceMap = { ...game.provenance };
  for (const fieldId of Object.keys(patch)) {
    if (["id", "priority", "provenance"].includes(fieldId)) continue;
    provenance[fieldId] =
      explicit[fieldId] ?? ({ source: "manual", updatedAt } satisfies FieldProvenance);
  }
  return { ...patch, provenance };
}

export function createGameSlice({ set, get, persist }: LibrarySliceContext): GameSlice {
  return {
    games: [],

    updateGame: (id, patch) => {
      set((state) => ({
        games: state.games.map((game) =>
          game.id === id
            ? normalizeGame({
                ...game,
                ...patchWithManualProvenance(game, patch),
                id: game.id,
              })
            : game,
        ),
      }));
      persist();
    },

    replaceGames: (games) => {
      set({ games: games.map((game) => normalizeGame(game)) });
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

    setFavoriteRank: (id, rank) => {
      set((state) => ({
        games: rank == null
          ? removeFavoriteRank(state.games, id)
          : assignFavoriteRank(state.games, id, rank),
      }));
      persist();
    },

    insertGameQueueFirst: (id) => {
      set((state) => ({ games: insertQueueFirst(state.games, id) }));
      persist();
    },

    insertGameQueueLast: (id) => {
      set((state) => ({ games: insertQueueLast(state.games, id) }));
      persist();
    },

    removeGameFromQueue: (id) => {
      set((state) => ({ games: removeFromQueue(state.games, id) }));
      persist();
    },

    reorderQueue: (visibleOrderedIds) => {
      set((state) => ({ games: reorderVisibleQueue(state.games, visibleOrderedIds) }));
      persist();
    },

    reorderFavoriteRanks: (visibleOrderedIds) => {
      set((state) => ({ games: reorderVisibleFavorites(state.games, visibleOrderedIds) }));
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
        games: deleteGamesAndNormalizePositions(state.games, [id]),
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
        savedViews: result.document.savedViews,
        defaultView: result.document.defaultView,
        displayMode: result.document.displayMode,
        groupBy: result.document.groupBy,
        franchises: result.document.franchises,
        steamId: result.document.settings.steamId,
        steamApiKey: result.document.settings.steamApiKey,
        igdbClientId: result.document.settings.igdbClientId,
        igdbClientSecret: result.document.settings.igdbClientSecret,
      };
      persist(next);
      const defaultView = next.savedViews.find((view) => view.id === next.defaultView);
      set({
        ...next,
        activeViewId: defaultView?.id ?? next.defaultView,
        filters: defaultView?.filters ?? EMPTY_FILTERS,
        sort: next.sort,
        displayMode: next.displayMode,
        groupBy: next.groupBy,
      });
      return {
        added: result.added,
        updated: result.updated,
        skipped: result.skipped,
        total: result.added + result.updated,
      };
    },

    exportJson: () => {
      const state = get();
      persist();
      const document = libraryRepository.load() ??
        libraryRepository.build(state.games, integrationSettings(state));
      const json = serializeLibraryBackup(createLibraryBackup(document));
      downloadTextFile("game-library.json", json);
    },
  };
}
