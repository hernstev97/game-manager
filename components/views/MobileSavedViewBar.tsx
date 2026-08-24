"use client";

import { useRef, useState } from "react";
import type { SavedView } from "@/lib/model/views";
import { isSavedViewMutable } from "./saved-view-helpers";
import { MobileSavedViewSheet } from "./MobileSavedViewSheet";
import styles from "./mobile-saved-view.module.css";

export type MobileSavedViewBarProps = {
  views: readonly SavedView[];
  selectedViewId: string;
  dirty: boolean;
  disabled?: boolean;
  onSelect: (viewId: string) => void;
  onUpdate: () => void;
  onSaveAsNew: () => void;
  onDiscard?: () => void;
  onRename?: (view: SavedView) => void;
  onDuplicate?: (view: SavedView) => void;
  onDelete?: (view: SavedView) => void;
  onSetDefault?: (view: SavedView) => void;
  onMove?: (view: SavedView, direction: "up" | "down") => void;
};

/** Compact mobile picker; all management actions are progressively disclosed. */
export function MobileSavedViewBar({
  views,
  selectedViewId,
  dirty,
  disabled = false,
  onSelect,
  onUpdate,
  onSaveAsNew,
  onDiscard,
  onRename,
  onDuplicate,
  onDelete,
  onSetDefault,
  onMove,
}: MobileSavedViewBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const manageButtonRef = useRef<HTMLButtonElement>(null);
  const selectedView = views.find((view) => view.id === selectedViewId);
  const customViews = views.filter(isSavedViewMutable);
  const selectedCustomIndex = selectedView
    ? customViews.findIndex((view) => view.id === selectedView.id)
    : -1;

  const closeSheet = (restoreFocus = true) => {
    setSheetOpen(false);
    if (restoreFocus) {
      requestAnimationFrame(() => manageButtonRef.current?.focus());
    }
  };

  return (
    <section className={styles.mobileBar} aria-label="Gespeicherte Ansicht">
      <div className={styles.barRow}>
        <label className={styles.picker}>
          <span className={styles.visuallyHidden}>Gespeicherte Ansicht auswählen</span>
          <select
            className={dirty ? styles.dirtySelect : undefined}
            value={selectedViewId}
            disabled={disabled}
            onChange={(event) => onSelect(event.target.value)}
          >
            {views.map((view) => (
              <option key={view.id} value={view.id}>
                {view.isDefault ? "★ " : ""}
                {view.name}
              </option>
            ))}
          </select>
          {dirty ? (
            <span className={styles.dirtyBadge} aria-hidden="true">
              Geändert
            </span>
          ) : null}
          <span className={styles.chevron} aria-hidden="true">⌄</span>
        </label>
        <button
          ref={manageButtonRef}
          type="button"
          className={styles.manageButton}
          aria-label={`Ansicht „${selectedView?.name ?? "Unbekannt"}“ verwalten`}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          disabled={disabled}
          onClick={() => setSheetOpen(true)}
        >
          <span aria-hidden="true">⋮</span>
        </button>
      </div>
      <span className={styles.visuallyHidden} aria-live="polite">
        {dirty ? "Ansicht geändert" : ""}
      </span>

      <MobileSavedViewSheet
        open={sheetOpen}
        selectedView={selectedView}
        dirty={dirty}
        canMoveUp={selectedCustomIndex > 0}
        canMoveDown={
          selectedCustomIndex >= 0 && selectedCustomIndex < customViews.length - 1
        }
        onClose={closeSheet}
        onUpdate={onUpdate}
        onSaveAsNew={onSaveAsNew}
        onDiscard={onDiscard}
        onRename={selectedView && onRename ? () => onRename(selectedView) : undefined}
        onDuplicate={
          selectedView && onDuplicate ? () => onDuplicate(selectedView) : undefined
        }
        onDelete={selectedView && onDelete ? () => onDelete(selectedView) : undefined}
        onSetDefault={
          selectedView && onSetDefault ? () => onSetDefault(selectedView) : undefined
        }
        onMove={
          selectedView && onMove
            ? (direction) => onMove(selectedView, direction)
            : undefined
        }
      />
    </section>
  );
}
