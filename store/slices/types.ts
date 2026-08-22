import type { LibraryFilters, SortState } from "../../lib/filter-games";
import type { GameRecord } from "../../lib/game-fields";
import type { FranchisePresentation } from "../../lib/model/shared";
import type { DisplayMode, GroupByMode, SavedView } from "../../lib/model/views";
import type { ImportApplyResult } from "../../lib/model/import-contracts";
import type { PreparedImportPlan } from "../../lib/import-export";
import type { LibraryDocumentV2 } from "../../lib/model/library-document";
import type { SelectionSlice } from "./selection";
import type { MetadataReviewSlice } from "./metadata-review";

export type LibraryState = SelectionSlice & MetadataReviewSlice & {
  hydrated: boolean;
  games: GameRecord[];
  sort: SortState;
  savedViews: SavedView[];
  defaultView: string;
  activeViewId: string;
  displayMode: DisplayMode;
  groupBy: GroupByMode;
  franchises: FranchisePresentation[];
  steamId: string;
  steamApiKey: string;
  igdbClientId: string;
  igdbClientSecret: string;
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
  setSavedViews: (views: readonly SavedView[], defaultView?: string) => void;
  selectSavedView: (id: string) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setGroupBy: (groupBy: GroupByMode) => void;
  setFranchisePresentation: (presentation: FranchisePresentation) => void;
  selectGame: (id: string | null) => void;
  openEditor: (id: string) => void;
  closeEditor: () => void;
  setAddOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  updateGame: (id: string, patch: Partial<GameRecord>) => void;
  replaceGames: (games: readonly GameRecord[]) => void;
  setGamePriority: (id: string, priority: number | null) => void;
  moveGameToFront: (id: string) => void;
  reorderPriorities: (visibleOrderedIds: string[]) => void;
  setFavoriteRank: (id: string, rank: number | null) => void;
  insertGameQueueFirst: (id: string) => void;
  insertGameQueueLast: (id: string) => void;
  removeGameFromQueue: (id: string) => void;
  reorderQueue: (visibleOrderedIds: readonly string[]) => void;
  reorderFavoriteRanks: (visibleOrderedIds: readonly string[]) => void;
  addGame: (partial: Partial<GameRecord>) => GameRecord;
  deleteGame: (id: string) => void;
  clearLibrary: () => void;
  importJson: (raw: unknown) => { added: number; updated: number; skipped: number; total: number };
  applyImportPlan: (plan: PreparedImportPlan) => Promise<ImportApplyResult>;
  applyLibraryDocument: (document: LibraryDocumentV2) => void;
  exportJson: () => void;
  setSteamCredentials: (steamId: string, steamApiKey: string) => void;
  setIgdbCredentials: (clientId: string, clientSecret: string) => void;
};

export type PersistedLibraryState = Pick<
  LibraryState,
  | "games"
  | "sort"
  | "savedViews"
  | "defaultView"
  | "displayMode"
  | "groupBy"
  | "franchises"
  | "steamId"
  | "steamApiKey"
  | "igdbClientId"
  | "igdbClientSecret"
>;

export type LibraryStateSetter = (
  partial:
    | Partial<LibraryState>
    | ((state: LibraryState) => Partial<LibraryState>),
) => void;

export type LibrarySliceContext = {
  set: LibraryStateSetter;
  get: () => LibraryState;
  persist: (state?: PersistedLibraryState) => void;
};
