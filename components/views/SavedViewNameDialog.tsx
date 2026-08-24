"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./saved-views.module.css";

export type SavedViewNameDialogMode = "save" | "rename" | "duplicate";

/** Reusable controlled name dialog for save, rename, and duplicate flows. */
export type SavedViewNameDialogProps = {
  open: boolean;
  mode: SavedViewNameDialogMode;
  initialName?: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
};

const TITLES: Record<SavedViewNameDialogMode, string> = {
  save: "Neue Ansicht speichern",
  rename: "Ansicht umbenennen",
  duplicate: "Ansicht duplizieren",
};

function SavedViewNameDialogBody({
  open,
  mode,
  initialName = "",
  onConfirm,
  onCancel,
}: SavedViewNameDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [name, setName] = useState(initialName);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const trimmed = name.trim();
  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClose={() => {
        if (open) onCancel();
      }}
    >
      <form
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmed) onConfirm(trimmed);
        }}
      >
        <h2 id={titleId}>{TITLES[mode]}</h2>
        <label>
          <span>Name</span>
          <input
            autoFocus
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.secondaryButton} onClick={onCancel}>
            Abbrechen
          </button>
          <button type="submit" className={styles.primaryButton} disabled={!trimmed}>
            {mode === "rename" ? "Umbenennen" : "Speichern"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function SavedViewNameDialog(props: SavedViewNameDialogProps) {
  return (
    <SavedViewNameDialogBody
      key={`${props.open}:${props.mode}:${props.initialName ?? ""}`}
      {...props}
    />
  );
}
