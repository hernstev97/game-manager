"use client";

import { create } from "zustand";
import {
  libraryRepository,
  settingsFromSort,
  sortFromSettings,
} from "@/lib/storage";
import { readStoredMotionPreference } from "@/lib/motion";
import { readStoredThemePreferences } from "@/lib/theme";
import { createGameSlice } from "./slices/games";
import { createIntegrationSlice } from "./slices/integration";
import { createImportBackupSlice } from "./slices/import-backup";
import { createLibraryViewsSlice } from "./slices/library-views";
import { createSelectionSlice } from "./slices/selection";
import { createViewDialogSlice } from "./slices/view-dialog";
import type {
  LibrarySliceContext,
  LibraryState,
  LibraryStateSetter,
  PersistedLibraryState,
} from "./slices/types";

export type { LibraryState } from "./slices/types";

function persistNow(state: PersistedLibraryState): void {
  const settings = settingsFromSort(state.sort, {
    steamId: state.steamId,
    steamApiKey: state.steamApiKey,
    igdbClientId: state.igdbClientId,
    igdbClientSecret: state.igdbClientSecret,
  });
  const document = libraryRepository.build(state.games, settings);
  libraryRepository.writeAtomic({
    document: {
      ...document,
      savedViews: state.savedViews,
      defaultView: state.defaultView,
      franchises: state.franchises,
      theme: readStoredThemePreferences(),
      motion: readStoredMotionPreference(),
      displayMode: state.displayMode,
      groupBy: state.groupBy,
    },
    credentials: {
      steamApiKey: state.steamApiKey,
      igdbClientSecret: state.igdbClientSecret,
    },
  });
}

export const useLibrary = create<LibraryState>((set, get) => {
  const context: LibrarySliceContext = {
    set: set as unknown as LibraryStateSetter,
    get,
    persist: (state) => persistNow(state ?? get()),
  };

  return {
    ...createViewDialogSlice(context),
    ...createLibraryViewsSlice(context),
    ...createIntegrationSlice(context),
    ...createImportBackupSlice(context),
    ...createGameSlice(context),
    ...createSelectionSlice<LibraryState>({ set: context.set, get }),
    sort: { by: "name", dir: "asc" },

    hydrate: () => {
      if (get().hydrated) return;
      try {
        const stored = libraryRepository.load();
        const document = stored ?? libraryRepository.empty();
        libraryRepository.save(document);
        const defaultView = document.savedViews.find(
          (view) => view.id === document.defaultView,
        );
        set({
          hydrated: true,
          games: document.games,
          sort: sortFromSettings(document.settings, document.games),
          filters: defaultView?.filters ?? { query: "", fields: {} },
          savedViews: document.savedViews,
          defaultView: document.defaultView,
          activeViewId: defaultView?.id ?? document.defaultView,
          displayMode: document.displayMode,
          groupBy: document.groupBy,
          franchises: document.franchises,
          steamId: document.settings.steamId,
          steamApiKey: document.settings.steamApiKey,
          igdbClientId: document.settings.igdbClientId,
          igdbClientSecret: document.settings.igdbClientSecret,
        });
      } catch {
        set({
          hydrated: true,
          games: [],
          sort: { by: "name", dir: "asc" },
          filters: { query: "", fields: {} },
          savedViews: libraryRepository.empty().savedViews,
          defaultView: libraryRepository.empty().defaultView,
          activeViewId: libraryRepository.empty().defaultView,
          displayMode: "list",
          groupBy: "none",
          franchises: [],
          steamId: "",
          steamApiKey: "",
          igdbClientId: "",
          igdbClientSecret: "",
        });
      }
    },

    persist: () => persistNow(get()),

    setSort: (sort) => {
      set({ sort });
      persistNow(get());
    },
  };
});
