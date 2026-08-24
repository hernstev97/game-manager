"use client";

import type { ReactNode } from "react";
import styles from "./bulk-actions.module.css";

export function BulkActionBar({
  selectedCount,
  visibleCount,
  onSelectAllVisible,
  onClear,
  onClose,
  children,
}: {
  selectedCount: number;
  visibleCount: number;
  onSelectAllVisible: () => void;
  onClear: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  return (
    <section className={styles.bar} aria-label="Sammelbearbeitung">
      <div className={styles.summary} aria-live="polite">
        <strong>{selectedCount}</strong>
        <span>{selectedCount === 1 ? "Spiel ausgewählt" : "Spiele ausgewählt"}</span>
      </div>
      <div className={styles.selectionActions} role="toolbar" aria-label="Auswahl ändern">
        <button type="button" className={styles.textButton} onClick={onSelectAllVisible} disabled={visibleCount === 0}>
          Alle sichtbaren ({visibleCount})
        </button>
        <button type="button" className={styles.textButton} onClick={onClear} disabled={selectedCount === 0}>
          Auswahl aufheben
        </button>
      </div>
      {children ? <div className={styles.bulkActions}>{children}</div> : null}
      <button type="button" className={styles.closeButton} aria-label="Auswahlmodus schließen" onClick={onClose}>
        ×
      </button>
    </section>
  );
}
