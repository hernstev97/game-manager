"use client";

import { IconGrip } from "@/components/m3/icons";
import styles from "./planning.module.css";

export function ReorderModeControl({
  active,
  disabled = false,
  subject,
  onChange,
}: {
  active: boolean;
  disabled?: boolean;
  subject: "Spielreihenfolge" | "persönliche Ränge";
  onChange: (active: boolean) => void;
}) {
  return (
    <div className={styles.reorderControl}>
      <span className={styles.reorderHint}>
        {active
          ? "Am Griff ziehen oder mit Leertaste und Pfeiltasten verschieben."
          : `${subject} direkt anordnen.`}
      </span>
      <button
        type="button"
        className={styles.reorderButton}
        aria-pressed={active}
        disabled={disabled}
        onClick={() => onChange(!active)}
      >
        <IconGrip width={18} height={18} />
        {active ? "Reorder beenden" : "Reorder-Modus"}
      </button>
    </div>
  );
}
