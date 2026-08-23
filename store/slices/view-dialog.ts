import { EMPTY_FILTERS, type LibraryFilters } from "../../lib/filter-games";
import type { LibrarySliceContext, LibraryState } from "./types";

type ViewDialogSlice = Pick<
  LibraryState,
  | "hydrated"
  | "filters"
  | "selectedId"
  | "editorOpen"
  | "addOpen"
  | "settingsOpen"
  | "setFilters"
  | "clearFilters"
  | "selectGame"
  | "openEditor"
  | "closeEditor"
  | "setAddOpen"
  | "setSettingsOpen"
>;

export function createViewDialogSlice({ set }: LibrarySliceContext): ViewDialogSlice {
  return {
    hydrated: false,
    filters: EMPTY_FILTERS,
    selectedId: null,
    editorOpen: false,
    addOpen: false,
    settingsOpen: false,

    setFilters: (filters: LibraryFilters | ((current: LibraryFilters) => LibraryFilters)) => {
      set((state) => ({
        filters: typeof filters === "function" ? filters(state.filters) : filters,
      }));
    },

    clearFilters: () => set({ filters: EMPTY_FILTERS }),

    selectGame: (id) => set({ selectedId: id }),

    openEditor: (id) => set({ selectedId: id, editorOpen: true }),

    closeEditor: () => set({ editorOpen: false }),

    setAddOpen: (open) => set({ addOpen: open }),

    setSettingsOpen: (open) => set({ settingsOpen: open }),
  };
}
