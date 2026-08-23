"use client";

import { useEffect, useId, useRef, type MouseEvent } from "react";
import type { SavedView } from "@/lib/model/views";
import {
  isSavedViewMutable,
  savedViewDirtyActionDecision,
} from "./saved-view-helpers";
import styles from "./mobile-saved-view.module.css";

export type MobileSavedViewSheetProps = {
  open: boolean;
  selectedView?: SavedView;
  dirty: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onClose: (restoreFocus?: boolean) => void;
  onUpdate: () => void;
  onSaveAsNew: () => void;
  onDiscard?: () => void;
  onRename?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  onMove?: (direction: "up" | "down") => void;
};

/** Mobile-only presentation for all actions scoped to the selected saved view. */
export function MobileSavedViewSheet({
  open,
  selectedView,
  dirty,
  canMoveUp,
  canMoveDown,
  onClose,
  onUpdate,
  onSaveAsNew,
  onDiscard,
  onRename,
  onDuplicate,
  onDelete,
  onSetDefault,
  onMove,
}: MobileSavedViewSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const dirtyDecision = savedViewDirtyActionDecision(selectedView, dirty);
  const mutable = selectedView ? isSavedViewMutable(selectedView) : false;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const closeAfter = (action: () => void, restoreFocus = true) => {
    onClose(restoreFocus);
    action();
  };

  const closeFromBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;
    if (outside) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.sheet}
      aria-labelledby={titleId}
      onClick={closeFromBackdrop}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
    >
      <header className={styles.sheetHeader}>
        <div>
          <p className={styles.eyebrow}>Gespeicherte Ansicht</p>
          <h2 id={titleId}>{selectedView?.name ?? "Ansicht verwalten"}</h2>
        </div>
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Ansichtsverwaltung schließen"
          onClick={() => onClose()}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className={styles.sheetBody}>
        {dirtyDecision.dirty ? (
          <section className={styles.dirtyPanel} aria-labelledby={`${titleId}-dirty`}>
            <h3 id={`${titleId}-dirty`}>
              <span className={styles.dirtyDot} aria-hidden="true" />
              Ansicht geändert
            </h3>
            <div className={styles.dirtyActions}>
              {onDiscard ? (
                <button type="button" onClick={() => closeAfter(onDiscard)}>
                  Verwerfen
                </button>
              ) : null}
              {dirtyDecision.canUpdate ? (
                <button type="button" onClick={() => closeAfter(onUpdate)}>
                  Ansicht aktualisieren
                </button>
              ) : null}
              {dirtyDecision.canSaveAsNew ? (
                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={() => closeAfter(onSaveAsNew, false)}
                >
                  Als neue Ansicht speichern
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {selectedView ? (
          <section className={styles.manageSection} aria-labelledby={`${titleId}-manage`}>
            <h3 id={`${titleId}-manage`}>Ansicht verwalten</h3>
            <div className={styles.actionList}>
              {onDuplicate ? (
                <button type="button" onClick={() => closeAfter(onDuplicate, false)}>
                  Duplizieren
                </button>
              ) : null}
              {onSetDefault && !selectedView.isDefault ? (
                <button type="button" onClick={() => closeAfter(onSetDefault)}>
                  Als Standard festlegen
                </button>
              ) : null}
              {mutable && onRename ? (
                <button type="button" onClick={() => closeAfter(onRename, false)}>
                  Umbenennen
                </button>
              ) : null}
              {mutable && onMove ? (
                <>
                  <button
                    type="button"
                    disabled={!canMoveUp}
                    onClick={() => onMove("up")}
                  >
                    Nach oben verschieben
                  </button>
                  <button
                    type="button"
                    disabled={!canMoveDown}
                    onClick={() => onMove("down")}
                  >
                    Nach unten verschieben
                  </button>
                </>
              ) : null}
              {mutable && onDelete ? (
                <button
                  type="button"
                  className={styles.dangerAction}
                  onClick={() => closeAfter(onDelete)}
                >
                  Löschen
                </button>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </dialog>
  );
}
