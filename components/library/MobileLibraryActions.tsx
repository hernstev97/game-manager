"use client";

import { useState, type RefObject } from "react";
import {
  IconCheck,
  IconDownload,
  IconMore,
  IconSettings,
  IconUpload,
} from "@/components/m3/icons";
import { M3Menu } from "@/components/m3/host";

export function MobileLibraryActions({
  selectionMode,
  fileRef,
  onSelectionMode,
  onExport,
  onSettings,
  onHelp,
}: {
  selectionMode: boolean;
  fileRef: RefObject<HTMLInputElement | null>;
  onSelectionMode: (enabled: boolean) => void;
  onExport: () => void;
  onSettings: () => void;
  onHelp: () => void;
}) {
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <div className="mobile-library-actions">
      <div className="anchor mobile-overflow-anchor">
        <m3-icon-button
          aria-label="Weitere Aktionen"
          onClick={() => setActionsOpen((current) => !current)}
        >
          <IconMore />
        </m3-icon-button>
        <M3Menu
          open={actionsOpen}
          placement="bottom-end"
          onOpenChange={setActionsOpen}
          onSelect={(action) => {
            setActionsOpen(false);
            if (action === "selection") onSelectionMode(!selectionMode);
            if (action === "import") fileRef.current?.click();
            if (action === "export") onExport();
            if (action === "settings") onSettings();
            if (action === "help") onHelp();
          }}
        >
          <span className="mobile-menu-group-label">Bibliothek</span>
          <m3-menu-item value="selection">
            <IconCheck slot="leading-icon" />
            {selectionMode ? "Auswahl beenden" : "Mehrere auswählen"}
          </m3-menu-item>
          <m3-divider />
          <span className="mobile-menu-group-label">Daten</span>
          <m3-menu-item value="import">
            <IconUpload slot="leading-icon" />
            Sicherung importieren
          </m3-menu-item>
          <m3-menu-item value="export">
            <IconDownload slot="leading-icon" />
            Sicherung exportieren
          </m3-menu-item>
          <m3-divider />
          <span className="mobile-menu-group-label">App</span>
          <m3-menu-item value="settings">
            <IconSettings slot="leading-icon" />
            Einstellungen
          </m3-menu-item>
          <m3-menu-item value="help">
            <span slot="leading-icon" aria-hidden="true">?</span>
            Tastenkürzel und Hilfe
          </m3-menu-item>
        </M3Menu>
      </div>
    </div>
  );
}
