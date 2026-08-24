"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import type { SortState } from "@/lib/filter-games";
import type { DisplayMode, GroupByMode } from "@/lib/model/views";
import { IconClose, IconSearch, IconTune } from "@/components/m3/icons";
import { M3SearchBar } from "@/components/m3/host";
import { SortControl } from "@/components/library/SortControl";
import { MobileLibraryActions } from "@/components/library/MobileLibraryActions";
import { MobileDisplaySheet } from "@/components/library/MobileDisplaySheet";
import styles from "./mobile-library-command-bar.module.css";

const DISPLAY_LABELS: Record<DisplayMode, string> = {
  list: "Liste",
  compact: "Kompakt",
  grid: "Cover-Raster",
};

export type MobileLibraryCommandBarProps = {
  query: string;
  sort: SortState;
  displayMode: DisplayMode;
  groupBy: GroupByMode;
  visibleCount: number;
  totalCount: number;
  fieldFilterCount: number;
  selectionMode: boolean;
  onQuery: (query: string) => void;
  onSort: (sort: SortState) => void;
  onOpenFilters: () => void;
  onDisplayMode: (mode: DisplayMode) => void;
  onGroupBy: (groupBy: GroupByMode) => void;
  onSelectionMode: (enabled: boolean) => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onSettings: () => void;
  onHelp: () => void;
};

export function MobileLibraryCommandBar({
  query,
  sort,
  displayMode,
  groupBy,
  visibleCount,
  totalCount,
  fieldFilterCount,
  selectionMode,
  onQuery,
  onSort,
  onOpenFilters,
  onDisplayMode,
  onGroupBy,
  onSelectionMode,
  onImport,
  onExport,
  onSettings,
  onHelp,
}: MobileLibraryCommandBarProps) {
  const [draft, setDraft] = useState(query);
  const [displayOpen, setDisplayOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const displayTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (draft === query) return;
    const handle = window.setTimeout(() => onQuery(draft), 150);
    return () => window.clearTimeout(handle);
  }, [draft, onQuery, query]);

  const resultLabel = visibleCount === totalCount
    ? `${totalCount} ${totalCount === 1 ? "Spiel" : "Spiele"}`
    : `${visibleCount} von ${totalCount}`;
  const displayLabel = groupBy === "none"
    ? DISPLAY_LABELS[displayMode]
    : `${DISPLAY_LABELS[displayMode]} · Franchise`;

  const importFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onImport(file);
    event.target.value = "";
  };

  return (
    <div className={styles.commandBar} aria-label="Bibliothekssteuerung">
      <M3SearchBar
        value={draft}
        onChange={setDraft}
        placeholder="Bibliothek durchsuchen…"
        label="Bibliothek durchsuchen"
      >
        <IconSearch slot="leading" />
        {draft ? (
          <m3-icon-button
            slot="trailing"
            size="small"
            aria-label="Suche löschen"
            onClick={() => {
              setDraft("");
              onQuery("");
            }}
          >
            <IconClose width={18} height={18} />
          </m3-icon-button>
        ) : null}
      </M3SearchBar>

      <div className={styles.actionRow}>
        <div className={styles.sort}>
          <SortControl sort={sort} onSort={onSort} placement="bottom-start" />
        </div>
        <m3-button
          className={styles.filterButton}
          variant={fieldFilterCount > 0 ? "tonal" : "outlined"}
          aria-label={fieldFilterCount > 0 ? `Filter, ${fieldFilterCount} aktiv` : "Filter"}
          onClick={onOpenFilters}
        >
          <IconTune slot="icon" width={18} height={18} />
          <span className={styles.filterLabel}>Filter</span>
          {fieldFilterCount > 0 ? (
            <span className={styles.filterBadge} aria-hidden="true">{fieldFilterCount}</span>
          ) : null}
        </m3-button>
        <MobileLibraryActions
          selectionMode={selectionMode}
          fileRef={fileRef}
          onSelectionMode={onSelectionMode}
          onExport={onExport}
          onSettings={onSettings}
          onHelp={onHelp}
        />
      </div>

      <div className={styles.resultRow}>
        <span className={styles.resultCount} aria-live="polite">{resultLabel}</span>
        <button
          ref={displayTriggerRef}
          type="button"
          className={styles.displayButton}
          aria-haspopup="dialog"
          aria-expanded={displayOpen}
          aria-label={`Darstellung: ${displayLabel}`}
          disabled={selectionMode}
          onClick={() => setDisplayOpen(true)}
        >
          <span>{displayLabel}</span>
          <span aria-hidden="true">⌄</span>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={importFile}
      />

      <MobileDisplaySheet
        open={displayOpen}
        displayMode={displayMode}
        groupBy={groupBy}
        onDisplayMode={onDisplayMode}
        onGroupBy={onGroupBy}
        onClose={() => setDisplayOpen(false)}
        triggerRef={displayTriggerRef}
      />
    </div>
  );
}
