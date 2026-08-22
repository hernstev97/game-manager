import { applyLibraryImport, type PreparedImportPlan } from "../../lib/import-export";
import { createBeforeImportSnapshotHook } from "../../lib/persistence/snapshots";
import {
  getLibrarySnapshotRepository,
  libraryUndoHistory,
} from "../../lib/runtime/library-runtime";
import { libraryRepository, sortFromSettings } from "../../lib/storage";
import type { LibraryFilters } from "../../lib/filter-games";
import type { LibrarySliceContext, LibraryState } from "./types";

type ImportBackupSlice = Pick<LibraryState, "applyImportPlan">;

export function createImportBackupSlice({ set }: LibrarySliceContext): ImportBackupSlice {
  return {
    applyImportPlan: async (plan: PreparedImportPlan) => {
      const before = libraryRepository.load() ?? libraryRepository.empty();
      const result = await applyLibraryImport(
        plan,
        libraryRepository,
        createBeforeImportSnapshotHook(getLibrarySnapshotRepository()),
      );
      const document = libraryRepository.load();
      if (!document) throw new Error("Imported library could not be reloaded");
      const defaultView = document.savedViews.find((view) => view.id === document.defaultView);
      set({
        games: document.games,
        sort: sortFromSettings(document.settings, document.games),
        filters: (defaultView?.filters ?? { query: "", fields: {} }) as LibraryFilters,
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
        selectionMode: false,
        selectedIds: [],
        selectedCount: 0,
        dndDisabled: false,
        selectedId: null,
        editorOpen: false,
      });
      libraryUndoHistory.record("Sicherung importieren", before, result.document);
      return result;
    },
  };
}
