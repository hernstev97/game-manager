"use client";

import { useEffect, useRef } from "react";
import styles from "./bulk-actions.module.css";

export function BulkConfirmDialog({
  open,
  selectedCount,
  title = "Ausgewählte Spiele löschen?",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  selectedCount: number;
  title?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="bulk-confirm-title" onCancel={onCancel}>
      <h2 id="bulk-confirm-title">{title}</h2>
      <p>
        {selectedCount === 1
          ? "Ein Spiel wird aus der Bibliothek entfernt."
          : `${selectedCount} Spiele werden aus der Bibliothek entfernt.`}
      </p>
      <p>Die Aktion wird erst nach dieser Bestätigung ausgeführt und kann über den Verlauf rückgängig gemacht werden.</p>
      <div className={styles.dialogActions}>
        <button type="button" className={styles.textButton} onClick={onCancel}>Abbrechen</button>
        <button type="button" className={styles.dangerButton} onClick={onConfirm} autoFocus>
          {selectedCount === 1 ? "Spiel löschen" : `${selectedCount} Spiele löschen`}
        </button>
      </div>
    </dialog>
  );
}
