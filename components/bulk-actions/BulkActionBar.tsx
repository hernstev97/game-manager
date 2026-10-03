"use client";

import type { ReactNode } from "react";
import styles from "./bulk-actions.module.css";
import { IconClose } from "@/components/m3/icons";

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
        <m3-button variant="text" onClick={onSelectAllVisible} disabled={visibleCount === 0}>
          Alle sichtbaren ({visibleCount})
        </m3-button>
        <m3-button variant="text" onClick={onClear} disabled={selectedCount === 0}>
          Auswahl aufheben
        </m3-button>
      </div>
      {children ? <div className={styles.bulkActions}>{children}</div> : null}
      <m3-icon-button className={styles.closeButton} aria-label="Auswahlmodus schließen" onClick={onClose}>
        <IconClose />
      </m3-icon-button>
    </section>
  );
}
