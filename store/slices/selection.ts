export type SelectionState = {
  selectionMode: boolean;
  selectedIds: string[];
  selectedCount: number;
  /** Consumers must pass this to their drag-and-drop `disabled` input. */
  dndDisabled: boolean;
};

export type SelectionAction =
  | { type: "start"; initialId?: string }
  | { type: "end" }
  | { type: "toggle"; id: string }
  | { type: "select-visible"; ids: readonly string[] }
  | { type: "clear" }
  | { type: "cleanup"; existingIds: readonly string[] };

export type SelectionItemDecision = "open-editor" | "toggle-selection";

export type SelectionSlice = SelectionState & {
  startSelection: (initialId?: string) => void;
  endSelection: () => void;
  toggleSelection: (id: string) => void;
  selectAllVisible: (ids: readonly string[]) => void;
  clearSelection: () => void;
  cleanupSelection: (existingIds: readonly string[]) => void;
  isSelected: (id: string) => boolean;
  activateSelectionItem: (id: string, openEditor: (id: string) => void) => SelectionItemDecision;
};

export const INITIAL_SELECTION_STATE: SelectionState = {
  selectionMode: false,
  selectedIds: [],
  selectedCount: 0,
  dndDisabled: false,
};

function stableUniqueIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const rawId of ids) {
    const id = rawId.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

function withDerivedState(selectionMode: boolean, selectedIds: readonly string[]): SelectionState {
  const ids = stableUniqueIds(selectedIds);
  return {
    selectionMode,
    selectedIds: ids,
    selectedCount: ids.length,
    dndDisabled: selectionMode,
  };
}

export function selectionReducer(
  state: SelectionState,
  action: SelectionAction,
): SelectionState {
  switch (action.type) {
    case "start":
      return withDerivedState(true, action.initialId ? [...state.selectedIds, action.initialId] : state.selectedIds);
    case "end":
      return INITIAL_SELECTION_STATE;
    case "toggle": {
      const selected = new Set(state.selectedIds);
      if (selected.has(action.id)) selected.delete(action.id);
      else selected.add(action.id);
      return withDerivedState(state.selectionMode, [...selected]);
    }
    case "select-visible":
      return withDerivedState(state.selectionMode, [...state.selectedIds, ...action.ids]);
    case "clear":
      return withDerivedState(state.selectionMode, []);
    case "cleanup": {
      const existing = new Set(action.existingIds);
      return withDerivedState(
        state.selectionMode,
        state.selectedIds.filter((id) => existing.has(id)),
      );
    }
  }
}

export function selectionItemDecision(state: Pick<SelectionState, "selectionMode">): SelectionItemDecision {
  return state.selectionMode ? "toggle-selection" : "open-editor";
}

export type SelectionSliceContext<RootState extends SelectionSlice> = {
  get: () => RootState;
  set: (
    update: Partial<RootState> | ((state: RootState) => Partial<RootState>),
  ) => void;
};

/** Standalone Zustand-compatible slice; it deliberately does not depend on the central store types. */
export function createSelectionSlice<RootState extends SelectionSlice>({
  get,
  set,
}: SelectionSliceContext<RootState>): SelectionSlice {
  const dispatch = (action: SelectionAction) => {
    set((state) => selectionReducer(state, action) as Partial<RootState>);
  };

  return {
    ...INITIAL_SELECTION_STATE,
    startSelection: (initialId) => dispatch({ type: "start", initialId }),
    endSelection: () => dispatch({ type: "end" }),
    toggleSelection: (id) => dispatch({ type: "toggle", id }),
    selectAllVisible: (ids) => dispatch({ type: "select-visible", ids }),
    clearSelection: () => dispatch({ type: "clear" }),
    cleanupSelection: (existingIds) => dispatch({ type: "cleanup", existingIds }),
    isSelected: (id) => get().selectedIds.includes(id),
    activateSelectionItem: (id, openEditor) => {
      const decision = selectionItemDecision(get());
      if (decision === "toggle-selection") dispatch({ type: "toggle", id });
      else openEditor(id);
      return decision;
    },
  };
}
