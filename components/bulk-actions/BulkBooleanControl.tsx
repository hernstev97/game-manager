"use client";

import { useState } from "react";
import type { BulkBooleanField } from "../../lib/bulk/operations";
import styles from "./bulk-actions.module.css";

const FIELD_OPTIONS: Array<{ value: BulkBooleanField; label: string }> = [
  { value: "owned", label: "Im Besitz" },
  { value: "wishlisted", label: "Wunschliste" },
  { value: "played", label: "Gespielt" },
  { value: "finished", label: "Durchgespielt" },
  { value: "released", label: "Erschienen" },
  { value: "completed100", label: "100 %" },
];

export function BulkBooleanControl({
  disabled = false,
  onApply,
}: {
  disabled?: boolean;
  onApply: (field: BulkBooleanField, value: boolean) => void;
}) {
  const [field, setField] = useState<BulkBooleanField>("owned");
  const [value, setValue] = useState(true);

  return (
    <fieldset className={styles.fieldControl} disabled={disabled}>
      <legend>Status setzen</legend>
      <label>
        <span>Feld</span>
        <select value={field} onChange={(event) => setField(event.target.value as BulkBooleanField)}>
          {FIELD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Wert</span>
        <select value={String(value)} onChange={(event) => setValue(event.target.value === "true")}>
          <option value="true">Ja</option>
          <option value="false">Nein</option>
        </select>
      </label>
      <button type="button" className={styles.primaryButton} onClick={() => onApply(field, value)}>
        Anwenden
      </button>
    </fieldset>
  );
}
