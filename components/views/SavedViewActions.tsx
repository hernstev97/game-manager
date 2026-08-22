"use client";

import type { SavedView } from "@/lib/model/views";
import { savedViewDirtyActionDecision } from "./saved-view-helpers";
import styles from "./saved-views.module.css";

/** Actions for reconciling a selected view with the current library controls. */
export type SavedViewActionsProps = {
  selectedView?: SavedView;
  dirty: boolean;
  onUpdate: () => void;
  onSaveAsNew: () => void;
  onDiscard?: () => void;
};

export function SavedViewActions({
  selectedView,
  dirty,
  onUpdate,
  onSaveAsNew,
  onDiscard,
}: SavedViewActionsProps) {
  const decision = savedViewDirtyActionDecision(selectedView, dirty);

  return (
    <section className={styles.actions} aria-label="Änderungen an der Ansicht">
      <span className={decision.dirty ? styles.dirtyStatus : styles.cleanStatus} aria-live="polite">
        {decision.message}
      </span>
      {decision.dirty ? (
        <div className={styles.actionButtons}>
          {onDiscard ? (
            <button type="button" className={styles.secondaryButton} onClick={onDiscard}>
              Verwerfen
            </button>
          ) : null}
          {decision.canUpdate ? (
            <button type="button" className={styles.secondaryButton} onClick={onUpdate}>
              Ansicht aktualisieren
            </button>
          ) : null}
          {decision.canSaveAsNew ? (
            <button type="button" className={styles.primaryButton} onClick={onSaveAsNew}>
              Als neue Ansicht speichern
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
