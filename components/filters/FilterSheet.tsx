"use client";

import { useMemo, useState, type ReactNode } from "react";

import type { GameRecord } from "@/lib/game-fields";
import { EMPTY_FILTERS, applyFiltersAndSort, emptyFieldFilter, type FieldFilterValue, type LibraryFilters } from "@/lib/filter-games";
import { M3Chip, M3Dialog, M3Slider } from "@/components/m3/host";
import {
  isTokenSelected,
  facetChoices,
  groupActiveCount,
  resetFilterGroup,
  toggleToken,
  type FilterGroup,
} from "@/components/filters/filter-logic";

type FilterSheetProps = {
  open: boolean;
  games: GameRecord[];
  filters: LibraryFilters;
  groups: FilterGroup[];
  onClose: () => void;
  onApply: (next: LibraryFilters) => void;
  recentFilters?: ReactNode;
};

/** Draft-based filter editor: changes apply together via the primary action. */
export function FilterSheet(props: FilterSheetProps) {
  if (!props.open) return null;
  return <OpenFilterSheet {...props} />;
}

function OpenFilterSheet({
  open,
  games,
  filters,
  groups,
  onClose,
  onApply,
  recentFilters,
}: FilterSheetProps) {
  const [draftFilters, setDraftFilters] = useState(filters);
  // Values no game in the library uses (e.g. unused platforms) stay hidden.
  const usedTokens = useMemo(() => {
    const used = new Set<string>();
    for (const group of groups) {
      for (const field of group.fields) {
        for (const choice of facetChoices(field, games, EMPTY_FILTERS)) {
          if (choice.count > 0) used.add(`${field.id}\u001f${choice.token}`);
        }
      }
    }
    return used;
  }, [games, groups]);
  const onDraftField = (fieldId: string, value: FieldFilterValue) => {
    setDraftFilters((current) => ({
      ...current,
      fields: { ...current.fields, [fieldId]: value },
    }));
  };
  const onReset = () => setDraftFilters(filtersWithoutFields(filters.query));

  const draftRating =
    draftFilters.fields.rating?.kind === "rating" ? draftFilters.fields.rating : null;
  const draftVisibleCount = applyFiltersAndSort(games, draftFilters, { by: "name", dir: "asc" }).length;

  return (
    <M3Dialog
      open={open}
      onClose={onClose}
      headline="Filter"
      presentation="side"
      className="filter-sheet"
      actions={
        <>
          <m3-button slot="actions" variant="text" onClick={onReset}>
            Zurücksetzen
          </m3-button>
          <m3-button slot="actions" onClick={() => onApply(draftFilters)}>
            {draftVisibleCount} {draftVisibleCount === 1 ? "Spiel" : "Spiele"} anzeigen
          </m3-button>
        </>
      }
    >
      <div className="filter-sheet-content">
        {recentFilters}
        {groups.map((group) => (
          <fieldset key={group.key} className="filter-group-section">
            <legend>
              {group.label}
              {groupActiveCount(group, draftFilters) > 0 ? (
                <button
                  type="button"
                  className="filter-group-reset"
                  onClick={() => {
                    const reset = resetFilterGroup(draftFilters, group);
                    group.fields.forEach((field) => {
                      const value = reset.fields[field.id] ?? emptyFieldFilter(field);
                      onDraftField(field.id, value);
                    });
                  }}
                >
                  Zurücksetzen
                </button>
              ) : null}
            </legend>
            <div className="chip-row">
              {group.fields.flatMap((field) =>
                facetChoices(field, games, draftFilters).flatMap((choice) => {
                  const selected = isTokenSelected(draftFilters.fields[field.id], choice.token);
                  if (!selected && !usedTokens.has(`${field.id}\u001f${choice.token}`)) return [];
                  return [
                    <M3Chip
                      key={`${field.id}-${choice.token}`}
                      variant="filter"
                      selected={selected}
                      disabled={choice.count === 0 && !selected}
                      onClick={() =>
                        onDraftField(
                          field.id,
                          toggleToken(field, draftFilters.fields[field.id], choice.token),
                        )
                      }
                    >
                      {choice.label} ({choice.count})
                    </M3Chip>,
                  ];
                }),
              )}
            </div>
            {group.fields.some((field) => field.id === "rating") &&
            draftRating?.selected.includes("gte") ? (
              <label className="range-row">
                <span>Mindestens</span>
                <M3Slider
                  label="Mindestbewertung"
                  min={1}
                  max={10}
                  step={0.5}
                  value={draftRating.gte}
                  onChange={(gte) => onDraftField("rating", { ...draftRating, gte })}
                />
                <strong>{draftRating.gte}</strong>
              </label>
            ) : null}
          </fieldset>
        ))}
      </div>
    </M3Dialog>
  );
}

/** Clears every field filter while keeping the free-text search. */
export function filtersWithoutFields(query: string): LibraryFilters {
  return { ...EMPTY_FILTERS, query };
}
