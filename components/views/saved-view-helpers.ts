import {
  DEFAULT_SYSTEM_SAVED_VIEW_ID,
  type SavedView,
  type SavedViewComparableState,
} from "@/lib/model/views";
import {
  comparableSavedViewState,
  createCustomSavedView,
  isSystemSavedViewId,
  normalizeSavedViewFilters,
} from "@/lib/persistence/views";

export type SavedViewDirtyActionDecision = {
  dirty: boolean;
  canUpdate: boolean;
  canSaveAsNew: boolean;
  message: string;
};

/** Treat both the installed IDs and declared system kind as immutable. */
export function isSavedViewMutable(view: SavedView): boolean {
  return view.kind === "custom" && !isSystemSavedViewId(view.id);
}

/** Decide which persistence actions the UI may offer for the current draft. */
export function savedViewDirtyActionDecision(
  selectedView: SavedView | undefined,
  dirty: boolean,
): SavedViewDirtyActionDecision {
  if (!selectedView || !dirty) {
    return {
      dirty: false,
      canUpdate: false,
      canSaveAsNew: false,
      message: selectedView ? "Ansicht ist aktuell" : "Keine Ansicht ausgewählt",
    };
  }
  if (!isSavedViewMutable(selectedView)) {
    return {
      dirty: true,
      canUpdate: false,
      canSaveAsNew: true,
      message: "Systemansicht geändert – als neue Ansicht speichern",
    };
  }
  return {
    dirty: true,
    canUpdate: true,
    canSaveAsNew: true,
    message: "Nicht gespeicherte Änderungen",
  };
}

/** Move a custom view by one custom-view position without moving system views. */
export function moveSavedView(
  views: readonly SavedView[],
  viewId: string,
  direction: "up" | "down",
): SavedView[] {
  const selected = views.find((view) => view.id === viewId);
  if (!selected || !isSavedViewMutable(selected)) return [...views];

  const custom = views.filter(isSavedViewMutable);
  const index = custom.findIndex((view) => view.id === viewId);
  const target = index + (direction === "up" ? -1 : 1);
  if (index < 0 || target < 0 || target >= custom.length) return [...views];

  [custom[index], custom[target]] = [custom[target]!, custom[index]!];
  let customIndex = 0;
  return views.map((view) =>
    isSavedViewMutable(view) ? custom[customIndex++]! : view,
  );
}

/** Rename a custom view; blank names and system views are left untouched. */
export function renameSavedView(
  views: readonly SavedView[],
  viewId: string,
  name: string,
): SavedView[] {
  const trimmed = name.trim();
  if (!trimmed) return [...views];
  return views.map((view) =>
    view.id === viewId && isSavedViewMutable(view) ? { ...view, name: trimmed } : view,
  );
}

/** Replace the editable content of a custom view while preserving identity/default state. */
export function updateSavedView(
  views: readonly SavedView[],
  viewId: string,
  current: SavedViewComparableState,
): SavedView[] {
  return views.map((view) =>
    view.id === viewId && isSavedViewMutable(view)
      ? {
          ...view,
          ...current,
          name: current.name.trim() || view.name,
          filters: normalizeSavedViewFilters(current.filters),
          id: view.id,
          kind: "custom",
          isDefault: view.isDefault,
        }
      : view,
  );
}

/** Materialize the current filter/sort/display/group combination as a custom view. */
export function saveSavedViewAsNew(
  views: readonly SavedView[],
  current: SavedViewComparableState,
  newId: string,
  name: string,
): SavedView[] {
  const trimmed = name.trim();
  if (!trimmed) return [...views];
  return [...views, createCustomSavedView({ ...current, name: trimmed }, newId)];
}

/** Duplicate any view as a new custom view and place it after its source. */
export function duplicateSavedView(
  views: readonly SavedView[],
  sourceId: string,
  newId: string,
  name?: string,
): SavedView[] {
  const sourceIndex = views.findIndex((view) => view.id === sourceId);
  if (sourceIndex < 0) return [...views];
  const source = views[sourceIndex]!;
  const state = comparableSavedViewState(source);
  const duplicate = createCustomSavedView(
    { ...state, name: name?.trim() || `${source.name} – Kopie` },
    newId,
  );
  const next = [...views];
  next.splice(sourceIndex + 1, 0, duplicate);
  return next;
}

/** Delete a custom view. System views are always returned unchanged. */
export function deleteSavedView(views: readonly SavedView[], viewId: string): SavedView[] {
  const selected = views.find((view) => view.id === viewId);
  if (!selected || !isSavedViewMutable(selected)) return [...views];
  const remaining = views.filter((view) => view.id !== viewId);
  if (!selected.isDefault) return remaining;
  const fallbackId = remaining.some((view) => view.id === DEFAULT_SYSTEM_SAVED_VIEW_ID)
    ? DEFAULT_SYSTEM_SAVED_VIEW_ID
    : remaining[0]?.id;
  return remaining.map((view) => ({ ...view, isDefault: view.id === fallbackId }));
}

/** Apply the authoritative default marker to exactly one existing view. */
export function setDefaultSavedView(
  views: readonly SavedView[],
  viewId: string,
): SavedView[] {
  if (!views.some((view) => view.id === viewId)) return [...views];
  return views.map((view) => ({ ...view, isDefault: view.id === viewId }));
}
