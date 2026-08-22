import type {
  MultiFilterValue,
  RatingFilterValue,
  SortState,
  ToggleFilterValue,
} from "../filter-games";
import type { Passthrough } from "./shared";

export const DISPLAY_MODES = ["list", "compact", "grid"] as const;
export type DisplayMode = (typeof DISPLAY_MODES)[number];

export const GROUP_BY_MODES = ["none", "franchise"] as const;
export type GroupByMode = (typeof GROUP_BY_MODES)[number];

export const SAVED_VIEW_KINDS = ["system", "custom"] as const;
export type SavedViewKind = (typeof SAVED_VIEW_KINDS)[number];

export type QueueFilterValue = Passthrough<{
  kind: "queue";
  selected: Array<"has" | "top5" | "none">;
}>;

export type FavoriteFilterValue = Passthrough<{
  kind: "favorite";
  selected: Array<"has" | "top5" | "top10" | "none">;
}>;

export type SavedViewFilterValue =
  | Passthrough<MultiFilterValue>
  | Passthrough<ToggleFilterValue>
  | Passthrough<RatingFilterValue>
  | QueueFilterValue
  | FavoriteFilterValue;

export type SavedViewFilters = Passthrough<{
  query: string;
  fields: Record<string, SavedViewFilterValue>;
}>;

/** The complete set of known v2 SavedView properties. */
export type SavedView = Passthrough<{
  id: string;
  name: string;
  filters: SavedViewFilters;
  sort: SortState;
  displayMode: DisplayMode;
  groupBy: GroupByMode;
  isDefault: boolean;
  kind: SavedViewKind;
}>;

export const SYSTEM_SAVED_VIEW_IDS = {
  allGames: "system:all-games",
  queue: "system:queue",
  currentlyPlaying: "system:currently-playing",
  wishlist: "system:wishlist",
  unrated: "system:unrated",
  recentlyAdded: "system:recently-added",
  favorites: "system:favorites",
} as const;

export type SystemSavedViewId =
  (typeof SYSTEM_SAVED_VIEW_IDS)[keyof typeof SYSTEM_SAVED_VIEW_IDS];

export const SYSTEM_SAVED_VIEW_NAMES = {
  [SYSTEM_SAVED_VIEW_IDS.allGames]: "Alle Spiele",
  [SYSTEM_SAVED_VIEW_IDS.queue]: "Als Nächstes",
  [SYSTEM_SAVED_VIEW_IDS.currentlyPlaying]: "Aktuell gespielt",
  [SYSTEM_SAVED_VIEW_IDS.wishlist]: "Wunschliste",
  [SYSTEM_SAVED_VIEW_IDS.unrated]: "Unbewertet",
  [SYSTEM_SAVED_VIEW_IDS.recentlyAdded]: "Kürzlich hinzugefügt",
  [SYSTEM_SAVED_VIEW_IDS.favorites]: "Favoriten",
} as const satisfies Record<SystemSavedViewId, string>;

export const DEFAULT_SYSTEM_SAVED_VIEW_ID = SYSTEM_SAVED_VIEW_IDS.allGames;

/** Semantic system-view fields that user actions must never overwrite. */
export const SYSTEM_VIEW_IMMUTABLE_FIELDS = [
  "id",
  "name",
  "filters",
  "sort",
  "displayMode",
  "groupBy",
  "kind",
] as const satisfies readonly (keyof SavedView)[];

/** Fields compared structurally to detect a modified selected view. */
export const SAVED_VIEW_DIRTY_FIELDS = [
  "name",
  "filters",
  "sort",
  "displayMode",
  "groupBy",
] as const satisfies readonly (keyof SavedView)[];

export type SavedViewComparableState = Pick<
  SavedView,
  (typeof SAVED_VIEW_DIRTY_FIELDS)[number]
>;

/** Session-only edit state; it is not part of LibraryDocumentV2. */
export type SavedViewEditState = {
  selectedViewId: string;
  baseline: SavedViewComparableState;
  current: SavedViewComparableState;
  dirty: boolean;
};

export const DEFAULT_DISPLAY_MODE: DisplayMode = "list";
export const DEFAULT_GROUP_BY_MODE: GroupByMode = "none";
