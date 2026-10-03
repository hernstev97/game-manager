"use client";

import { useState } from "react";
import { IconMore } from "@/components/m3/icons";
import { M3Menu } from "@/components/m3/host";
import styles from "./planning.module.css";

export type PlanningRowAction = {
  value: string;
  label: string;
  disabled?: boolean;
};

/** Overflow menu that keeps secondary row actions out of the resting layout. */
export function PlanningRowMenu({
  gameName,
  actions,
  onAction,
  disabled = false,
}: {
  gameName: string;
  actions: readonly PlanningRowAction[];
  onAction: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="anchor">
      <button
        type="button"
        className={styles.iconButton}
        aria-label={`Aktionen für ${gameName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <IconMore width={20} height={20} />
      </button>
      <M3Menu
        open={open}
        placement="bottom-end"
        onOpenChange={setOpen}
        onSelect={(value) => {
          setOpen(false);
          onAction(value);
        }}
      >
        {actions.map((action) => (
          <m3-menu-item key={action.value} value={action.value} disabled={action.disabled}>
            {action.label}
          </m3-menu-item>
        ))}
      </M3Menu>
    </div>
  );
}
