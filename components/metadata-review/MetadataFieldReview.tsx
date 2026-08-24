import { fieldById } from "@/lib/game-fields";
import type { FieldProvenance } from "@/lib/model";
import {
  canSelectMetadataChange,
  metadataChangeWarning,
  type MetadataReview,
  type MetadataReviewFieldChange,
} from "@/lib/metadata";
import { MetadataValue } from "./MetadataValue";
import styles from "./metadata-field-review.module.css";

const SOURCE_LABELS: Record<FieldProvenance["source"], string> = {
  manual: "Manuell",
  steam: "Steam",
  igdb: "IGDB",
  import: "Import",
  migration: "Migration",
};

function provenanceLabel(provenance: FieldProvenance | undefined): string {
  if (!provenance) return "Quelle unbekannt";
  const ref = provenance.sourceRef ? ` · ${provenance.sourceRef}` : "";
  return `${SOURCE_LABELS[provenance.source]}${ref}`;
}

export function MetadataFieldReview({
  review,
  change,
  onSelectedChange,
}: {
  review: MetadataReview;
  change: MetadataReviewFieldChange;
  onSelectedChange: (selected: boolean) => void;
}) {
  const fieldLabel = fieldById(change.fieldId)?.label ?? change.fieldId;
  const sourceLabel = SOURCE_LABELS[change.source];
  const warning = metadataChangeWarning(review, change);
  const selectable = canSelectMetadataChange(review, {
    fieldId: change.fieldId,
    source: change.source,
  });
  const radioName = `${review.id}-${change.source}-${change.fieldId}`;
  const isImage = change.category === "cover";

  return (
    <li className={styles.changeCard} data-selected={change.selected || undefined}>
      <div className={styles.changeHeader}>
        <div>
          <h3>{fieldLabel}</h3>
          <span className={styles.sourceBadge}>Quelle: {sourceLabel}</span>
        </div>
        {change.defaultSelection.selected ? (
          <span className={styles.safeBadge}>Sicher vorausgewählt</span>
        ) : null}
      </div>

      <div className={styles.comparison}>
        <section className={styles.valuePanel} aria-label={`Aktueller Wert für ${fieldLabel}`}>
          <span className={styles.valueHeading}>Aktuell</span>
          <MetadataValue fieldId={change.fieldId} value={change.currentValue} image={isImage} />
          <span className={styles.provenance}>
            {provenanceLabel(change.current.provenance)}
          </span>
        </section>
        <section className={styles.valuePanel} aria-label={`Neuer Wert für ${fieldLabel}`}>
          <span className={styles.valueHeading}>Neu</span>
          <MetadataValue fieldId={change.fieldId} value={change.incomingValue} image={isImage} />
          <span className={styles.provenance}>Quelle: {sourceLabel}</span>
        </section>
      </div>

      {warning ? (
        <p className={styles.warning} data-severity={warning.severity}>
          {warning.message}
        </p>
      ) : null}

      <fieldset className={styles.decision}>
        <legend>Entscheidung für {fieldLabel}</legend>
        <label>
          <input
            type="radio"
            name={radioName}
            checked={!change.selected}
            onChange={() => onSelectedChange(false)}
          />
          Bisherigen Wert behalten
        </label>
        <label data-disabled={!selectable || undefined}>
          <input
            type="radio"
            name={radioName}
            checked={change.selected}
            disabled={!selectable}
            onChange={() => onSelectedChange(true)}
          />
          Neuen Wert übernehmen
        </label>
      </fieldset>
    </li>
  );
}
