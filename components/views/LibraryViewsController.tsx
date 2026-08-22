"use client";

import { useMemo, useState } from "react";
import type { LibraryFilters, SortState } from "@/lib/filter-games";
import type {
  DisplayMode,
  GroupByMode,
  SavedView,
  SavedViewComparableState,
  SavedViewFilters,
} from "@/lib/model/views";
import {
  comparableSavedViewState,
  isSavedViewDirty,
  newCustomSavedViewId,
} from "@/lib/persistence/views";
import {
  deleteSavedView,
  duplicateSavedView,
  moveSavedView,
  renameSavedView,
  saveSavedViewAsNew,
  setDefaultSavedView,
  updateSavedView,
} from "./saved-view-helpers";
import { SavedViewActions } from "./SavedViewActions";
import {
  SavedViewNameDialog,
  type SavedViewNameDialogMode,
} from "./SavedViewNameDialog";
import { MobileSavedViewBar } from "./MobileSavedViewBar";
import { SavedViewRail } from "./SavedViewRail";
import styles from "./saved-views.module.css";

type NameDialogState = {
  mode: SavedViewNameDialogMode;
  source?: SavedView;
} | null;

export function LibraryViewsController({
  views,
  activeViewId,
  filters,
  sort,
  displayMode,
  groupBy,
  disabled = false,
  onSelect,
  onChange,
}: {
  views: readonly SavedView[];
  activeViewId: string;
  filters: LibraryFilters;
  sort: SortState;
  displayMode: DisplayMode;
  groupBy: GroupByMode;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onChange: (views: readonly SavedView[], defaultView?: string) => void;
}) {
  const [nameDialog, setNameDialog] = useState<NameDialogState>(null);
  const selectedView = views.find((view) => view.id === activeViewId);
  const current = useMemo<SavedViewComparableState>(() => ({
    name: selectedView?.name ?? "Neue Ansicht",
    filters: filters as SavedViewFilters,
    sort,
    displayMode,
    groupBy,
  }), [displayMode, filters, groupBy, selectedView?.name, sort]);
  const dirty = selectedView
    ? isSavedViewDirty(comparableSavedViewState(selectedView), current)
    : false;

  const saveWithId = (nextViews: SavedView[], id: string) => {
    onChange(nextViews);
    onSelect(id);
  };
  const updateSelectedView = () => {
    if (selectedView) onChange(updateSavedView(views, selectedView.id, current));
  };
  const discardChanges = () => {
    if (selectedView) onSelect(selectedView.id);
  };

  return (
    <aside className={styles.controller}>
      <MobileSavedViewBar
        views={views}
        selectedViewId={activeViewId}
        dirty={dirty}
        disabled={disabled}
        onSelect={onSelect}
        onRename={(view) => setNameDialog({ mode: "rename", source: view })}
        onDuplicate={(view) => setNameDialog({ mode: "duplicate", source: view })}
        onDelete={(view) => onChange(deleteSavedView(views, view.id))}
        onSetDefault={(view) => onChange(setDefaultSavedView(views, view.id), view.id)}
        onMove={(view, direction) => onChange(moveSavedView(views, view.id, direction))}
        onUpdate={updateSelectedView}
        onSaveAsNew={() => setNameDialog({ mode: "save" })}
        onDiscard={discardChanges}
      />
      <SavedViewRail
        views={views}
        selectedViewId={activeViewId}
        dirty={dirty}
        onSelect={onSelect}
        onRename={(view) => setNameDialog({ mode: "rename", source: view })}
        onDuplicate={(view) => setNameDialog({ mode: "duplicate", source: view })}
        onDelete={(view) => onChange(deleteSavedView(views, view.id))}
        onSetDefault={(view) => onChange(setDefaultSavedView(views, view.id), view.id)}
        onMove={(view, direction) => onChange(moveSavedView(views, view.id, direction))}
      />
      <SavedViewActions
        selectedView={selectedView}
        dirty={dirty}
        onUpdate={updateSelectedView}
        onSaveAsNew={() => setNameDialog({ mode: "save" })}
        onDiscard={discardChanges}
      />
      <SavedViewNameDialog
        open={nameDialog !== null}
        mode={nameDialog?.mode ?? "save"}
        initialName={nameDialog?.source?.name ?? selectedView?.name ?? ""}
        onCancel={() => setNameDialog(null)}
        onConfirm={(name) => {
          if (nameDialog?.mode === "rename" && nameDialog.source) {
            onChange(renameSavedView(views, nameDialog.source.id, name));
          } else if (nameDialog?.mode === "duplicate" && nameDialog.source) {
            const id = newCustomSavedViewId();
            saveWithId(duplicateSavedView(views, nameDialog.source.id, id, name), id);
          } else {
            const id = newCustomSavedViewId();
            saveWithId(saveSavedViewAsNew(views, current, id, name), id);
          }
          setNameDialog(null);
        }}
      />
    </aside>
  );
}
