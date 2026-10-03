"use client";

import { useState } from "react";
import type { BulkListField } from "../../lib/bulk/operations";
import { M3Select, M3TextField } from "@/components/m3/host";
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
        <M3Select label="Feld" value={field} disabled={disabled} onChange={(next) => setField(next as BulkListField)}>
          <option value="platforms">Plattformen</option>
          <option value="genres">Genres</option>
        </M3Select>
        <M3Select label="Aktion" value={operation} disabled={disabled} onChange={(next) => setOperation(next as ListOperation)}>
          <option value="add">Hinzufügen</option>
          <option value="remove">Entfernen</option>
        </M3Select>
        <M3TextField
          label="Werte (kommagetrennt)"
          value={values}
          disabled={disabled}
          onChange={setValues}
        />
        <m3-button
          disabled={disabled || parsedValues.length === 0}
          onClick={() => onListApply(field, operation, parsedValues)}
        >
          Anwenden
        </m3-button>
      </fieldset>
      <fieldset className={styles.fieldControl} disabled={disabled}>
        <legend>Franchise setzen</legend>
        <M3TextField
          label="Franchise (leer zum Entfernen)"
          value={franchise}
          disabled={disabled}
          onChange={setFranchise}
        />
        <m3-button disabled={disabled} onClick={() => onFranchiseApply(franchise)}>
          Anwenden
        </m3-button>
      </fieldset>
    </div>
  );
}
