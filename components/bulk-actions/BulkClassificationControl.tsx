"use client";

import { useState } from "react";
import type { BulkListField } from "../../lib/bulk/operations";
import styles from "./bulk-actions.module.css";

type ListOperation = "add" | "remove";

export function BulkClassificationControl({
  disabled = false,
  onListApply,
  onFranchiseApply,
}: {
  disabled?: boolean;
  onListApply: (field: BulkListField, operation: ListOperation, values: string[]) => void;
  onFranchiseApply: (franchise: string) => void;
}) {
  const [field, setField] = useState<BulkListField>("platforms");
  const [operation, setOperation] = useState<ListOperation>("add");
  const [values, setValues] = useState("");
  const [franchise, setFranchise] = useState("");

  const parsedValues = values.split(",").map((value) => value.trim()).filter(Boolean);

  return (
    <div className={styles.classificationControls}>
      <fieldset className={styles.fieldControl} disabled={disabled}>
        <legend>Plattformen oder Genres</legend>
        <label>
          <span>Feld</span>
          <select value={field} onChange={(event) => setField(event.target.value as BulkListField)}>
            <option value="platforms">Plattformen</option>
            <option value="genres">Genres</option>
          </select>
        </label>
        <label>
          <span>Aktion</span>
          <select value={operation} onChange={(event) => setOperation(event.target.value as ListOperation)}>
            <option value="add">Hinzufügen</option>
            <option value="remove">Entfernen</option>
          </select>
        </label>
        <label className={styles.growingField}>
          <span>Werte (kommagetrennt)</span>
          <input value={values} onChange={(event) => setValues(event.target.value)} />
        </label>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={parsedValues.length === 0}
          onClick={() => onListApply(field, operation, parsedValues)}
        >
          Anwenden
        </button>
      </fieldset>
      <fieldset className={styles.fieldControl} disabled={disabled}>
        <legend>Franchise setzen</legend>
        <label className={styles.growingField}>
          <span>Franchise (leer zum Entfernen)</span>
          <input value={franchise} onChange={(event) => setFranchise(event.target.value)} />
        </label>
        <button type="button" className={styles.primaryButton} onClick={() => onFranchiseApply(franchise)}>
          Anwenden
        </button>
      </fieldset>
    </div>
  );
}
