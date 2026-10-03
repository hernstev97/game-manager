"use client";

import { useId } from "react";
import {
  deselectAllMetadataChanges,
  selectAllSafeMetadataChanges,
  setMetadataChangeSelected,
  type MetadataReview,
} from "@/lib/metadata";
import { M3Dialog } from "@/components/m3/host";
import { IconClose } from "@/components/m3/icons";
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
  const pricesId = useId();
  const selectedCount = review.metadata.filter((change) => change.selected).length;

  return (
    <M3Dialog
      open={open}
      onClose={onCancel}
      headline={`Metadaten prüfen${gameName ? ` · ${gameName}` : ""}`}
      presentation="fullscreen"
      size="wide"
      leadingAction={
        <m3-icon-button aria-label="Metadaten-Prüfung schließen" onClick={onCancel}>
          <IconClose />
        </m3-icon-button>
      }
      actions={
        <>
          <m3-button className="desktop-dialog-cancel" slot="actions" variant="text" onClick={onCancel}>
            Abbrechen
          </m3-button>
          <m3-button slot="actions" disabled={selectedCount === 0} onClick={() => onConfirm(review)}>
            Auswahl übernehmen
          </m3-button>
        </>
      }
    >
      <div className={styles.content}>
        <p className={styles.description}>
          Vergleiche jeden Vorschlag. Erst „Auswahl übernehmen“ erzeugt den bestätigten Review-Auftrag.
        </p>

        <div className={styles.toolbar} role="group" aria-label="Auswahlaktionen">
          <m3-button
            variant="tonal"
            onClick={() => onReviewChange(selectAllSafeMetadataChanges(review))}
          >
            Alle sicheren auswählen
          </m3-button>
          <m3-button
            variant="text"
            onClick={() => onReviewChange(deselectAllMetadataChanges(review))}
          >
            Alle abwählen
          </m3-button>
          <span aria-live="polite">{selectedCount} ausgewählt</span>
        </div>

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
          <section className={styles.volatileSection} aria-labelledby={pricesId}>
            <h3 id={pricesId}>Volatile Preis-Snapshots</h3>
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
    </M3Dialog>
  );
}
