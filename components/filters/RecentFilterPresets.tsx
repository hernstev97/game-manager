"use client";

import { useMemo, useSyncExternalStore } from "react";
import { M3Chip } from "@/components/m3/host";
import type { LibraryFilters } from "@/lib/filter-games";
import {
  RECENT_FILTERS_CHANGED_EVENT,
  RECENT_FILTERS_STORAGE_KEY,
  clearRecentFilterPresets,
  parseRecentFilterPresets,
} from "@/lib/recent-filters";

const EMPTY_SNAPSHOT = "[]";

function subscribe(onStoreChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === RECENT_FILTERS_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(RECENT_FILTERS_CHANGED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(RECENT_FILTERS_CHANGED_EVENT, onStoreChange);
  };
}

function browserSnapshot(): string {
  try {
    return window.localStorage.getItem(RECENT_FILTERS_STORAGE_KEY) ?? EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

export function RecentFilterPresets({
  query,
  onApply,
}: {
  query: string;
  onApply: (filters: LibraryFilters) => void;
}) {
  const snapshot = useSyncExternalStore(subscribe, browserSnapshot, () => EMPTY_SNAPSHOT);
  const presets = useMemo(() => parseRecentFilterPresets(snapshot), [snapshot]);
  if (presets.length === 0) return null;

  return (
    <div className="recent-filters" aria-label="Zuletzt verwendete Filter">
      <span className="recent-filters-label">Zuletzt</span>
      <div className="recent-filter-scroll">
        {presets.map((preset) => (
          <M3Chip
            key={preset.id}
            variant="assist"
            onClick={() => onApply({ ...preset.filters, query })}
          >
            {preset.label}
          </M3Chip>
        ))}
      </div>
      <m3-button variant="text" onClick={() => clearRecentFilterPresets()}>
        Verlauf löschen
      </m3-button>
    </div>
  );
}
