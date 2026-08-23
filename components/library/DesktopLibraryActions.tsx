"use client";

import type { RefObject } from "react";
import type { SortState } from "@/lib/filter-games";
import { IconDownload, IconSettings, IconUpload } from "@/components/m3/icons";
import { SortControl } from "@/components/library/SortControl";

export function DesktopLibraryActions({
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
  return (
    <div className="desktop-library-actions">
      <SortControl sort={sort} onSort={onSort} placement="bottom-end" />
      <m3-tooltip text="Importieren">
        <m3-icon-button aria-label="Importieren" onClick={() => fileRef.current?.click()}>
          <IconUpload />
        </m3-icon-button>
      </m3-tooltip>
      <m3-tooltip text="Exportieren">
        <m3-icon-button aria-label="Exportieren" onClick={onExport}>
          <IconDownload />
        </m3-icon-button>
      </m3-tooltip>
      <m3-tooltip text="Einstellungen">
        <m3-icon-button aria-label="Einstellungen" onClick={onSettings}>
          <IconSettings />
        </m3-icon-button>
      </m3-tooltip>
    </div>
  );
}
