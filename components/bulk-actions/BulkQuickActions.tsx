"use client";

import styles from "./bulk-actions.module.css";

export function BulkQuickActions({
  disabled = false,
  onAddToQueue,
  onRemoveFromQueue,
  onPrepareMetadata,
  onPrepareExport,
  onRequestDelete,
}: {
  disabled?: boolean;
  onAddToQueue: () => void;
  onRemoveFromQueue: () => void;
  onPrepareMetadata: () => void;
  onPrepareExport: () => void;
  onRequestDelete: () => void;
}) {
  return (
    <div className={styles.quickActions} role="toolbar" aria-label="Aktionen für ausgewählte Spiele">
      <button type="button" onClick={onAddToQueue} disabled={disabled}>Queue +</button>
      <button type="button" onClick={onRemoveFromQueue} disabled={disabled}>Queue −</button>
      <button type="button" onClick={onPrepareMetadata} disabled={disabled}>Metadaten vorbereiten</button>
      <button type="button" onClick={onPrepareExport} disabled={disabled}>Auswahl exportieren</button>
      <button type="button" className={styles.dangerButton} onClick={onRequestDelete} disabled={disabled}>
        Löschen…
      </button>
    </div>
  );
}
