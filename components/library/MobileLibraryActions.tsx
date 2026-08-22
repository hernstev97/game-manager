"use client";

import { useState, type RefObject } from "react";
import type { SortState } from "@/lib/filter-games";
import { IconDownload, IconMore, IconSettings, IconUpload } from "@/components/m3/icons";
import { M3Menu } from "@/components/m3/host";
import { SortControl } from "@/components/library/SortControl";

export function MobileLibraryActions({
  sort,
  onSort,
  fileRef,
  onExport,
  onSettings,
}: {
  sort: SortState;
  onSort: (sort: SortState) => void;
  fileRef: RefObject<HTMLInputElement | null>;
  onExport: () => void;
  onSettings: () => void;
}) {
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <div className="mobile-library-actions">
      <SortControl sort={sort} onSort={onSort} placement="bottom-start" />
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
            if (action === "import") fileRef.current?.click();
            if (action === "export") onExport();
            if (action === "settings") onSettings();
          }}
        >
          <m3-menu-item value="import">
            <IconUpload slot="leading-icon" />
            Sicherung importieren
          </m3-menu-item>
          <m3-menu-item value="export">
            <IconDownload slot="leading-icon" />
            Sicherung exportieren
          </m3-menu-item>
          <m3-menu-item value="settings">
            <IconSettings slot="leading-icon" />
            Einstellungen
          </m3-menu-item>
        </M3Menu>
      </div>
    </div>
  );
}
