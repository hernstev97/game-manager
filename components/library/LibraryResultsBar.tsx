"use client";

import { useRef, useState } from "react";
import type { SortState } from "@/lib/filter-games";
import type { DisplayMode, GroupByMode } from "@/lib/model/views";
import {
  IconChecklist,
  IconViewCompact,
  IconViewGrid,
  IconViewList,
} from "@/components/m3/icons";
import { SortControl } from "@/components/library/SortControl";
import { DisplaySheet } from "@/components/library/DisplaySheet";

const DISPLAY_LABELS: Record<DisplayMode, string> = {
  list: "Liste",
  compact: "Kompakt",
  grid: "Cover-Raster",
};

const DISPLAY_ICONS = {
  list: IconViewList,
  compact: IconViewCompact,
  grid: IconViewGrid,
} as const;

/** One quiet row: result count, sorting, display options, and selection mode. */
export function LibraryResultsBar({
  visibleCount,
  totalCount,
  sort,
  displayMode,
  groupBy,
  selectionMode,
  onSort,
  onDisplayMode,
  onGroupBy,
  onSelectionMode,
}: {
  visibleCount: number;
  totalCount: number;
  sort: SortState;
  displayMode: DisplayMode;
  groupBy: GroupByMode;
  selectionMode: boolean;
  onSort: (sort: SortState) => void;
  onDisplayMode: (mode: DisplayMode) => void;
  onGroupBy: (groupBy: GroupByMode) => void;
  onSelectionMode: (enabled: boolean) => void;
}) {
  const [displayOpen, setDisplayOpen] = useState(false);
  const displayTriggerRef = useRef<HTMLButtonElement>(null);
  const DisplayIcon = DISPLAY_ICONS[displayMode];
  const resultLabel = visibleCount === totalCount
    ? `${totalCount} ${totalCount === 1 ? "Spiel" : "Spiele"}`
    : `${visibleCount} von ${totalCount}`;
  const displayLabel = groupBy === "none"
    ? DISPLAY_LABELS[displayMode]
    : `${DISPLAY_LABELS[displayMode]} · Franchise`;

  return (
    <div className="library-results-bar">
      <span className="library-result-count" aria-live="polite">{resultLabel}</span>
      <div className="library-results-actions">
        <SortControl sort={sort} onSort={onSort} placement="bottom-end" />
        <button
          ref={displayTriggerRef}
          type="button"
          className="icon-toggle"
          aria-haspopup="dialog"
          aria-expanded={displayOpen}
          aria-label={`Darstellung: ${displayLabel}`}
          title={`Darstellung: ${displayLabel}`}
          disabled={selectionMode}
          onClick={() => setDisplayOpen(true)}
        >
          <DisplayIcon />
          {groupBy !== "none" ? <span className="icon-toggle-dot" aria-hidden="true" /> : null}
        </button>
        <button
          type="button"
          className="icon-toggle"
          aria-pressed={selectionMode}
          aria-label={selectionMode ? "Auswahl beenden" : "Mehrere auswählen"}
          title={selectionMode ? "Auswahl beenden (F6)" : "Mehrere auswählen (F6)"}
          onClick={() => onSelectionMode(!selectionMode)}
        >
          <IconChecklist />
        </button>
      </div>
      <DisplaySheet
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
