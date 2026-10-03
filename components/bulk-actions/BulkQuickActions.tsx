"use client";

import { useState } from "react";
import { IconMore } from "@/components/m3/icons";
import { M3Menu } from "@/components/m3/host";
import styles from "./bulk-actions.module.css";

/** The frequent bulk action stays visible; rarer ones live in an overflow menu. */
export function BulkQuickActions({
  disabled = false,
  onAddToQueue,
  onRemoveFromQueue,
  onPrepareMetadata,
  onPrepareExport,
  onRequestDelete,
}: {
  disabled?: boolean;
  onAddToQueue: () => void;
  onRemoveFromQueue: () => void;
  onPrepareMetadata: () => void;
  onPrepareExport: () => void;
  onRequestDelete: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className={styles.quickActions} role="toolbar" aria-label="Aktionen für ausgewählte Spiele">
      <button type="button" onClick={onAddToQueue} disabled={disabled}>Warteschlange +</button>
      <div className="anchor">
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Weitere Aktionen für die Auswahl"
          aria-haspopup="menu"
          aria-expanded={moreOpen}
          disabled={disabled}
          onClick={() => setMoreOpen((current) => !current)}
        >
          <IconMore width={20} height={20} />
        </button>
        <M3Menu
          open={moreOpen}
          placement="top-end"
          onOpenChange={setMoreOpen}
          onSelect={(action) => {
            setMoreOpen(false);
            if (action === "dequeue") onRemoveFromQueue();
            if (action === "metadata") onPrepareMetadata();
            if (action === "export") onPrepareExport();
            if (action === "delete") onRequestDelete();
          }}
        >
          <m3-menu-item value="dequeue">Aus Warteschlange entfernen</m3-menu-item>
          <m3-menu-item value="metadata">Metadaten vorbereiten</m3-menu-item>
          <m3-menu-item value="export">Auswahl exportieren</m3-menu-item>
          <m3-divider />
          <m3-menu-item value="delete">Löschen…</m3-menu-item>
        </M3Menu>
      </div>
    </div>
  );
}
