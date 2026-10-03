"use client";

import { useState } from "react";
import type { BulkBooleanField } from "../../lib/bulk/operations";
import { M3Select } from "@/components/m3/host";
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
      <M3Select label="Feld" value={field} disabled={disabled} onChange={(next) => setField(next as BulkBooleanField)}>
        {FIELD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </M3Select>
      <M3Select label="Wert" value={String(value)} disabled={disabled} onChange={(next) => setValue(next === "true")}>
        <option value="true">Ja</option>
        <option value="false">Nein</option>
      </M3Select>
      <m3-button disabled={disabled} onClick={() => onApply(field, value)}>
        Anwenden
      </m3-button>
    </fieldset>
  );
}
