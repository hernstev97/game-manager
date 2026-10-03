"use client";

import { useMemo, useRef, useState } from "react";
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
  isSavedViewMutable,
  duplicateSavedView,
  moveSavedView,
  renameSavedView,
  saveSavedViewAsNew,
  setDefaultSavedView,
  updateSavedView,
} from "./saved-view-helpers";
import { SavedViewActions } from "./SavedViewActions";
import { SavedViewChips } from "./SavedViewChips";
import { SavedViewSheet } from "./SavedViewSheet";
import {
  SavedViewNameDialog,
  type SavedViewNameDialogMode,
} from "./SavedViewNameDialog";
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetTriggerRef = useRef<HTMLButtonElement | null>(null);
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
  const customViews = views.filter(isSavedViewMutable);
  const selectedCustomIndex = selectedView
    ? customViews.findIndex((view) => view.id === selectedView.id)
    : -1;
  const closeSheet = (restoreFocus = true) => {
    setSheetOpen(false);
    if (restoreFocus) requestAnimationFrame(() => sheetTriggerRef.current?.focus());
  };

  return (
    <div className={styles.controller}>
      <SavedViewChips
        views={views}
        selectedViewId={activeViewId}
        dirty={dirty}
        disabled={disabled}
        onSelect={onSelect}
        onManage={(trigger) => {
          sheetTriggerRef.current = trigger;
          setSheetOpen(true);
        }}
      />
      <SavedViewActions
        selectedView={selectedView}
        dirty={dirty}
        onUpdate={updateSelectedView}
        onSaveAsNew={() => setNameDialog({ mode: "save" })}
        onDiscard={discardChanges}
      />
      <SavedViewSheet
        open={sheetOpen}
        selectedView={selectedView}
        dirty={dirty}
        canMoveUp={selectedCustomIndex > 0}
        canMoveDown={selectedCustomIndex >= 0 && selectedCustomIndex < customViews.length - 1}
        onClose={closeSheet}
        onUpdate={updateSelectedView}
        onSaveAsNew={() => setNameDialog({ mode: "save" })}
        onDiscard={discardChanges}
        onRename={selectedView ? () => setNameDialog({ mode: "rename", source: selectedView }) : undefined}
        onDuplicate={selectedView ? () => setNameDialog({ mode: "duplicate", source: selectedView }) : undefined}
        onDelete={selectedView ? () => onChange(deleteSavedView(views, selectedView.id)) : undefined}
        onSetDefault={selectedView
          ? () => onChange(setDefaultSavedView(views, selectedView.id), selectedView.id)
          : undefined}
        onMove={selectedView
          ? (direction) => onChange(moveSavedView(views, selectedView.id, direction))
          : undefined}
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
    </div>
  );
}
