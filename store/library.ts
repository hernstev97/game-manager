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
      theme: readStoredThemePreferences(),
      motion: readStoredMotionPreference(),
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
    ...createIntegrationSlice(context),
    ...createGameSlice(context),
    sort: { by: "name", dir: "asc" },

    hydrate: () => {
      if (get().hydrated) return;
      try {
        const stored = libraryRepository.load();
        const document = stored ?? libraryRepository.empty();
        libraryRepository.save(document);
        set({
          hydrated: true,
          games: document.games,
          sort: sortFromSettings(document.settings, document.games),
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
