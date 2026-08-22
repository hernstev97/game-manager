import type { LibraryFilters, SortState } from "../../lib/filter-games";
import type { GameRecord } from "../../lib/game-fields";
import type { FranchisePresentation } from "../../lib/model/shared";
import type { DisplayMode, GroupByMode, SavedView } from "../../lib/model/views";
import type { ImportApplyResult } from "../../lib/model/import-contracts";
import type { PreparedImportPlan } from "../../lib/import-export";
import type { SteamOwnedGame, SteamPriceSnapshot } from "../../lib/steam";
import type { SelectionSlice } from "./selection";

export type LibraryState = SelectionSlice & {
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
  addGame: (partial: Partial<GameRecord>) => GameRecord;
  deleteGame: (id: string) => void;
  clearLibrary: () => void;
  importJson: (raw: unknown) => { added: number; updated: number; skipped: number; total: number };
  applyImportPlan: (plan: PreparedImportPlan) => Promise<ImportApplyResult>;
  exportJson: () => void;
  setSteamCredentials: (steamId: string, steamApiKey: string) => void;
  setIgdbCredentials: (clientId: string, clientSecret: string) => void;
  applySteamPlaytime: (owned: SteamOwnedGame[]) => { updated: number; markedOwned: number };
  refreshSteamIdentity: (
    updates: Array<{
      id: string;
      name?: string;
      coverUrl?: string;
      released?: boolean;
      steamPrice?: SteamPriceSnapshot | null;
      genres?: string[];
      franchise?: string;
      platforms?: string[];
      igdbId?: number | null;
      steamAppId?: number | null;
    }>,
  ) => number;
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
