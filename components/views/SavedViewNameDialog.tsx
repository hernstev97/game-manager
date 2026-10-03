"use client";

import { useState } from "react";
import { M3Dialog, M3TextField } from "@/components/m3/host";
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
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  const submit = () => {
    if (trimmed) onConfirm(trimmed.slice(0, 80));
  };

  return (
    <M3Dialog
      open={open}
      onClose={onCancel}
      headline={TITLES[mode]}
      actions={
        <>
          <m3-button slot="actions" variant="text" onClick={onCancel}>
            Abbrechen
          </m3-button>
          <m3-button slot="actions" disabled={!trimmed} onClick={submit}>
            {mode === "rename" ? "Umbenennen" : "Speichern"}
          </m3-button>
        </>
      }
    >
      <div
        className={styles.nameField}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
        }}
      >
        <M3TextField label="Name" value={name} onChange={setName} autoFocus />
      </div>
    </M3Dialog>
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
