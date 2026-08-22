"use client";

import { useEffect, useId, useRef } from "react";
import {
  deselectAllMetadataChanges,
  selectAllSafeMetadataChanges,
  setMetadataChangeSelected,
  type MetadataReview,
} from "@/lib/metadata";
import { MetadataFieldReview } from "./MetadataFieldReview";
import { MetadataValue } from "./MetadataValue";
import styles from "./metadata-review.module.css";

export type MetadataReviewDialogProps = {
  open: boolean;
  review: MetadataReview;
  gameName?: string;
  onReviewChange: (review: MetadataReview) => void;
  onConfirm: (review: MetadataReview) => void;
  onCancel: () => void;
};

export function MetadataReviewDialog({
  open,
  review,
  gameName,
  onReviewChange,
  onConfirm,
  onCancel,
}: MetadataReviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const selectedCount = review.metadata.filter((change) => change.selected).length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClose={() => {
        if (open) onCancel();
      }}
    >
      <header className={styles.header}>
        <div>
          <h2 id={titleId}>Metadaten prüfen{gameName ? ` · ${gameName}` : ""}</h2>
          <p id={descriptionId}>
            Vergleiche jeden Vorschlag. Erst „Auswahl übernehmen“ erzeugt den bestätigten Review-Auftrag.
          </p>
        </div>
        <button type="button" className={styles.iconButton} aria-label="Metadaten-Prüfung schließen" onClick={onCancel}>
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className={styles.toolbar} aria-label="Auswahlaktionen">
        <button type="button" onClick={() => onReviewChange(selectAllSafeMetadataChanges(review))}>
          Alle sicheren auswählen
        </button>
        <button type="button" onClick={() => onReviewChange(deselectAllMetadataChanges(review))}>
          Alle abwählen
        </button>
        <span aria-live="polite">{selectedCount} ausgewählt</span>
      </div>

      <div className={styles.body}>
        {review.metadata.length ? (
          <ul className={styles.changeList}>
            {review.metadata.map((change) => (
              <MetadataFieldReview
                key={`${change.source}:${change.fieldId}`}
                review={review}
                change={change}
                onSelectedChange={(selected) =>
                  onReviewChange(
                    setMetadataChangeSelected(
                      review,
                      { fieldId: change.fieldId, source: change.source },
                      selected,
                    ),
                  )
                }
              />
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>Keine regulären Metadatenänderungen gefunden.</p>
        )}

        {review.volatilePrices.length ? (
          <section className={styles.volatileSection} aria-labelledby={`${titleId}-prices`}>
            <h3 id={`${titleId}-prices`}>Volatile Preis-Snapshots</h3>
            <p>Preise sind zeitabhängig und werden bewusst nicht zusammen mit Metadaten übernommen.</p>
            <ul>
              {review.volatilePrices.map((change) => (
                <li key={`${change.source}:${change.fieldId}`}>
                  <div>
                    <span>Aktuell</span>
                    <MetadataValue fieldId={change.fieldId} value={change.currentValue} image={false} />
                  </div>
                  <div>
                    <span>Neuer Snapshot</span>
                    <MetadataValue fieldId={change.fieldId} value={change.incomingValue} image={false} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <footer className={styles.actions}>
        <button type="button" onClick={onCancel}>Abbrechen</button>
        <button
          type="button"
          className={styles.primaryAction}
          disabled={selectedCount === 0}
          onClick={() => onConfirm(review)}
        >
          Auswahl übernehmen
        </button>
      </footer>
    </dialog>
  );
}
