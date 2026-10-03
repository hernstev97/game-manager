"use client";

import type { SavedView } from "@/lib/model/views";
import { savedViewDirtyActionDecision } from "./saved-view-helpers";
import styles from "./saved-views.module.css";

/**
 * Inline banner that only appears once the controls diverge from the selected
 * view. It offers the one likely follow-up; every other option lives in the
 * view sheet behind the selected chip.
 */
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

  if (!decision.dirty) return null;

  return (
    <section className={styles.actions} aria-label="Änderungen an der Ansicht">
      <span className={styles.dirtyStatus} aria-live="polite">
        <span className={styles.dirtyDot} aria-hidden="true" />
        Geändert
      </span>
      <div className={styles.actionButtons}>
        {onDiscard ? (
          <m3-button variant="text" onClick={onDiscard}>
            Verwerfen
          </m3-button>
        ) : null}
        {decision.canUpdate ? (
          <m3-button variant="tonal" aria-label="Ansicht aktualisieren" onClick={onUpdate}>
            Aktualisieren
          </m3-button>
        ) : decision.canSaveAsNew ? (
          <m3-button variant="tonal" aria-label="Als neue Ansicht speichern" onClick={onSaveAsNew}>
            Speichern …
          </m3-button>
        ) : null}
      </div>
    </section>
  );
}
