"use client";

import type { DisplayMode, GroupByMode } from "@/lib/model/views";
import { DisplayModeControl } from "@/components/library-grid/DisplayModeControl";
import styles from "./saved-views.module.css";

export function LibraryViewControls({
  displayMode,
  groupBy,
  selectionMode,
  onDisplayMode,
  onGroupBy,
  onSelectionMode,
}: {
  displayMode: DisplayMode;
  groupBy: GroupByMode;
  selectionMode: boolean;
  onDisplayMode: (mode: DisplayMode) => void;
  onGroupBy: (groupBy: GroupByMode) => void;
  onSelectionMode: (enabled: boolean) => void;
}) {
  return (
    <div className={`${styles.viewControls} desktop-view-controls`}>
      <DisplayModeControl value={displayMode} onChange={onDisplayMode} />
      <label className={styles.groupControl}>
        <span>Gruppierung</span>
        <select value={groupBy} onChange={(event) => onGroupBy(event.target.value as GroupByMode)}>
          <option value="none">Keine</option>
          <option value="franchise">Franchise</option>
        </select>
      </label>
      <button
        type="button"
        className={styles.selectionButton}
        aria-pressed={selectionMode}
        onClick={() => onSelectionMode(!selectionMode)}
      >
        {selectionMode ? "Auswahl beenden" : "Mehrere auswählen"}
      </button>
    </div>
  );
}
