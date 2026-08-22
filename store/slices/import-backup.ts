import { applyLibraryImport, type PreparedImportPlan } from "../../lib/import-export";
import { createBeforeImportSnapshotHook } from "../../lib/persistence/snapshots";
import {
  getLibrarySnapshotRepository,
  libraryUndoHistory,
} from "../../lib/runtime/library-runtime";
import { libraryRepository, sortFromSettings } from "../../lib/storage";
import type { LibraryFilters } from "../../lib/filter-games";
import type { LibraryDocumentV2 } from "../../lib/model/library-document";
import { librarySaveStatus } from "../../lib/save-status";
import type { LibrarySliceContext, LibraryState } from "./types";

type ImportBackupSlice = Pick<LibraryState, "applyImportPlan" | "applyLibraryDocument">;

function stateFromDocument(document: ReturnType<typeof libraryRepository.empty>) {
  const defaultView = document.savedViews.find((view) => view.id === document.defaultView);
  return {
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
    metadataReviews: [],
    metadataReviewIndex: 0,
  };
}

export function createImportBackupSlice({ set }: LibrarySliceContext): ImportBackupSlice {
  return {
    applyLibraryDocument: (document: LibraryDocumentV2) => {
      const saveAttempt = librarySaveStatus.begin();
      const credentials = libraryRepository.credentials();
      try {
        libraryRepository.writeAtomic({ document, credentials });
        librarySaveStatus.succeed(saveAttempt);
      } catch (error) {
        librarySaveStatus.fail(saveAttempt, error);
        throw error;
      }
      const stored = libraryRepository.load();
      if (!stored) throw new Error("Library document could not be reloaded");
      set(stateFromDocument(stored));
    },

    applyImportPlan: async (plan: PreparedImportPlan) => {
      const before = libraryRepository.load() ?? libraryRepository.empty();
      const result = await applyLibraryImport(
        plan,
        libraryRepository,
        createBeforeImportSnapshotHook(getLibrarySnapshotRepository()),
      );
      const document = libraryRepository.load();
      if (!document) throw new Error("Imported library could not be reloaded");
      set(stateFromDocument(document));
      libraryUndoHistory.record("Sicherung importieren", before, result.document);
      return result;
    },
  };
}
