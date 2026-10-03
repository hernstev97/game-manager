"use client";

import { useSyncExternalStore } from "react";
import { librarySaveStatus } from "@/lib/save-status";
import styles from "./save-status.module.css";

const SERVER_STATE = { kind: "idle", lastSavedAt: null, message: null } as const;

/**
 * `quiet` only surfaces saving problems; the healthy local-save state stays
 * implicit in the app chrome and remains visible inside the editor.
 */
export function SaveStatusIndicator({ quiet = false }: { quiet?: boolean }) {
  const status = useSyncExternalStore(
    librarySaveStatus.subscribe,
    librarySaveStatus.getSnapshot,
    () => SERVER_STATE,
  );
  const label = status.kind === "saving"
    ? "Speichert …"
    : status.kind === "saved"
      ? "Lokal gespeichert"
      : status.kind === "quota"
        ? "Speicherplatzproblem"
        : status.kind === "error"
          ? "Fehler beim Speichern"
          : "Lokal bereit";
  const savedTitle = status.lastSavedAt
    ? `Zuletzt erfolgreich gespeichert: ${new Intl.DateTimeFormat("de-DE", {
        dateStyle: "short",
        timeStyle: "medium",
      }).format(new Date(status.lastSavedAt))}`
    : undefined;

  if (quiet && status.kind !== "error" && status.kind !== "quota") return null;

  return (
    <span
      className={styles.status}
      data-kind={status.kind}
      aria-live="polite"
      aria-atomic="true"
      title={status.message ?? savedTitle}
    >
      <span className={styles.dot} aria-hidden="true" />
      {label}
    </span>
  );
}
