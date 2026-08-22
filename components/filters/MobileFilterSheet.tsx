"use client";

import type { GameRecord } from "@/lib/game-fields";
import { EMPTY_FILTERS, applyFiltersAndSort, type FieldFilterValue, type LibraryFilters } from "@/lib/filter-games";
import { M3Chip, M3Dialog, M3Slider } from "@/components/m3/host";
import {
  isTokenSelected,
  menuChoices,
  toggleToken,
  type FilterGroup,
} from "@/components/filters/filter-logic";
import type { FilterChip } from "@/components/filters/ActiveFilterChips";
import { IconTune } from "@/components/m3/icons";

export function MobileFilterOverview({
  visibleCount,
  totalCount,
  fieldChipCount,
  onOpen,
}: {
  visibleCount: number;
  totalCount: number;
  fieldChipCount: number;
  onOpen: () => void;
}) {
  return (
    <div className="mobile-filter-overview">
      <span className="filter-count" aria-live="polite">
        {visibleCount === totalCount ? `${totalCount} Spiele` : `${visibleCount} von ${totalCount}`}
      </span>
      <m3-button variant={fieldChipCount > 0 ? "tonal" : "outlined"} onClick={onOpen}>
        <IconTune slot="icon" width={18} height={18} />
        Filter{fieldChipCount > 0 ? ` (${fieldChipCount})` : ""}
      </m3-button>
    </div>
  );
}

export function MobileActiveFilters({
  fieldChips,
  onDismiss,
  onClear,
}: {
  fieldChips: FilterChip[];
  onDismiss: (fieldId: string, token: string) => void;
  onClear: () => void;
}) {
  if (fieldChips.length === 0) return null;

  return (
    <div className="mobile-active-filters" aria-label="Aktive Filter">
      <div className="mobile-active-filter-scroll">
        {fieldChips.map((chip) => (
          <M3Chip
            key={`${chip.fieldId}-${chip.token}`}
            variant="input"
            removable
            onRemove={() => onDismiss(chip.fieldId, chip.token)}
          >
            {chip.label}
          </M3Chip>
        ))}
      </div>
      <m3-button variant="text" onClick={onClear}>
        Löschen
      </m3-button>
    </div>
  );
}

export function MobileFilterSheet({
  open,
  games,
  draftFilters,
  groups,
  onClose,
  onDraftField,
  onReset,
  onApply,
}: {
  open: boolean;
  games: GameRecord[];
  draftFilters: LibraryFilters;
  groups: FilterGroup[];
  onClose: () => void;
  onDraftField: (fieldId: string, value: FieldFilterValue) => void;
  onReset: () => void;
  onApply: () => void;
}) {
  if (!open) return null;

  const draftRating =
    draftFilters.fields.rating?.kind === "rating" ? draftFilters.fields.rating : null;
  const draftVisibleCount = applyFiltersAndSort(games, draftFilters, { by: "name", dir: "asc" }).length;

  return (
    <M3Dialog
      open={open}
      onClose={onClose}
      headline="Filter"
      presentation="sheet"
      actions={
        <>
          <m3-button slot="actions" variant="text" onClick={onReset}>
            Zurücksetzen
          </m3-button>
          <m3-button slot="actions" onClick={onApply}>
            {draftVisibleCount} {draftVisibleCount === 1 ? "Spiel" : "Spiele"} anzeigen
          </m3-button>
        </>
      }
    >
      <div className="mobile-filter-sheet">
        {groups.map((group) => (
          <fieldset key={group.key} className="mobile-filter-group">
            <legend>{group.label}</legend>
            <div className="chip-row">
              {group.fields.flatMap((field) =>
                menuChoices(field, games).map((choice) => {
                  const selected = isTokenSelected(draftFilters.fields[field.id], choice.token);
                  return (
                    <M3Chip
                      key={`${field.id}-${choice.token}`}
                      variant="filter"
                      selected={selected}
                      onClick={() =>
                        onDraftField(
                          field.id,
                          toggleToken(field, draftFilters.fields[field.id], choice.token),
                        )
                      }
                    >
                      {choice.label}
                    </M3Chip>
                  );
                }),
              )}
            </div>
            {group.fields.some((field) => field.id === "rating") &&
            draftRating?.selected.includes("gte") ? (
              <label className="range-row mobile-rating-range">
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

export function emptyMobileFilters(query: string): LibraryFilters {
  return { ...EMPTY_FILTERS, query };
}
