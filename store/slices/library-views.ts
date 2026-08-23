import type { LibraryFilters } from "../../lib/filter-games";
import type { FranchisePresentation } from "../../lib/model/shared";
import {
  DEFAULT_DISPLAY_MODE,
  DEFAULT_GROUP_BY_MODE,
  DEFAULT_SYSTEM_SAVED_VIEW_ID,
  type SavedView,
} from "../../lib/model/views";
import {
  normalizeFranchiseIdentity,
} from "../../lib/import-export";
import { createSystemSavedViews, normalizeSavedViews } from "../../lib/storage";
import type { LibrarySliceContext, LibraryState } from "./types";

type LibraryViewsSlice = Pick<
  LibraryState,
  | "savedViews"
  | "defaultView"
  | "activeViewId"
  | "displayMode"
  | "groupBy"
  | "franchises"
  | "setSavedViews"
  | "selectSavedView"
  | "setDisplayMode"
  | "setGroupBy"
  | "setFranchisePresentation"
>;

function viewState(view: SavedView) {
  return {
    activeViewId: view.id,
    filters: view.filters as LibraryFilters,
    sort: view.sort,
    displayMode: view.displayMode,
    groupBy: view.groupBy,
  };
}

export function createLibraryViewsSlice({
  set,
  get,
  persist,
}: LibrarySliceContext): LibraryViewsSlice {
  const initialViews = createSystemSavedViews();
  return {
    savedViews: initialViews,
    defaultView: DEFAULT_SYSTEM_SAVED_VIEW_ID,
    activeViewId: DEFAULT_SYSTEM_SAVED_VIEW_ID,
    displayMode: DEFAULT_DISPLAY_MODE,
    groupBy: DEFAULT_GROUP_BY_MODE,
    franchises: [],

    setSavedViews: (views, requestedDefault) => {
      const current = get();
      const normalized = normalizeSavedViews(
        views,
        requestedDefault ?? views.find((view) => view.isDefault)?.id ?? current.defaultView,
      );
      const active = normalized.savedViews.find((view) => view.id === current.activeViewId);
      const fallback = normalized.savedViews.find((view) => view.id === normalized.defaultView);
      const next = {
        ...normalized,
        ...(active ? {} : fallback ? viewState(fallback) : {}),
      };
      set(next);
      persist({ ...current, ...next });
    },

    selectSavedView: (id) => {
      const current = get();
      const view = current.savedViews.find((candidate) => candidate.id === id);
      if (!view) return;
      const next = viewState(view);
      set(next);
      persist({ ...current, ...next });
    },

    setDisplayMode: (displayMode) => {
      const current = get();
      set({ displayMode });
      persist({ ...current, displayMode });
    },

    setGroupBy: (groupBy) => {
      const current = get();
      set({ groupBy });
      persist({ ...current, groupBy });
    },

    setFranchisePresentation: (presentation) => {
      const current = get();
      const identity = normalizeFranchiseIdentity(presentation.franchise);
      const existingIndex = current.franchises.findIndex(
        (candidate) => normalizeFranchiseIdentity(candidate.franchise) === identity,
      );
      const franchises: FranchisePresentation[] = existingIndex < 0
        ? [...current.franchises, presentation]
        : current.franchises.map((candidate, index) =>
            index === existingIndex ? presentation : candidate,
          );
      set({ franchises });
      persist({ ...current, franchises });
    },
  };
}
