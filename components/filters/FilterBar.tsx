"use client";

import { useMemo } from "react";
import type { GameRecord } from "@/lib/game-fields";
import {
  activeFilterChips,
  emptyFieldFilter,
  type FieldFilterValue,
  type LibraryFilters,
} from "@/lib/filter-games";
import { ActiveFilterChips } from "@/components/filters/ActiveFilterChips";
import {
  fieldForFilter,
  filterGroupsForGames,
  type FilterGroup,
} from "@/components/filters/filter-logic";
import { RecentFilterPresets } from "@/components/filters/RecentFilterPresets";
import { FilterSheet, filtersWithoutFields } from "@/components/filters/FilterSheet";
import { recordRecentFilterPreset } from "@/lib/recent-filters";

/** Number of active field filters (the free-text query is not counted). */
export function fieldFilterCount(filters: LibraryFilters): number {
  return activeFilterChips(filters).filter((chip) => chip.fieldId !== "query").length;
}

/**
 * Active filter chips plus the filter sheet. The trigger lives in the search
 * field so the full facet list only appears on demand.
 */
export function FilterBar({
  games,
  filters,
  sheetOpen,
  onSheetOpenChange,
  onChange,
}: {
  games: GameRecord[];
  filters: LibraryFilters;
  sheetOpen: boolean;
  onSheetOpenChange: (open: boolean) => void;
  onChange: (next: LibraryFilters) => void;
}) {
  const groups = useMemo<FilterGroup[]>(() => filterGroupsForGames(games), [games]);
  const fieldChips = activeFilterChips(filters).filter((chip) => chip.fieldId !== "query");

  const commitFilters = (next: LibraryFilters) => {
    onChange(next);
    recordRecentFilterPreset(next);
  };

  const setField = (fieldId: string, value: FieldFilterValue) => {
    commitFilters({
      ...filters,
      fields: { ...filters.fields, [fieldId]: value },
    });
  };

  const dismissChip = (fieldId: string, token: string) => {
    const field = fieldForFilter(fieldId);
    const current = filters.fields[fieldId] ?? (field ? emptyFieldFilter(field) : undefined);
    if (!current) return;
    if (current.kind === "toggle") {
      setField(fieldId, { ...current, on: false });
      return;
    }
    setField(fieldId, {
      ...current,
      selected: current.selected.filter((item) => item !== token),
    } as FieldFilterValue);
  };

  return (
    <>
      <ActiveFilterChips
        chips={fieldChips}
        onDismiss={dismissChip}
        onClear={() => onChange(filtersWithoutFields(filters.query))}
      />
      <FilterSheet
        open={sheetOpen}
        games={games}
        filters={filters}
        groups={groups}
        onClose={() => onSheetOpenChange(false)}
        onApply={(next) => {
          commitFilters(next);
          onSheetOpenChange(false);
        }}
        recentFilters={(
          <RecentFilterPresets
            query={filters.query}
            onApply={(next) => {
              commitFilters(next);
              onSheetOpenChange(false);
            }}
          />
        )}
      />
    </>
  );
}
