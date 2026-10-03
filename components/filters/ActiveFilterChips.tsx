"use client";

import { M3Chip } from "@/components/m3/host";

export type FilterChip = {
  fieldId: string;
  token: string;
  label: string;
};

/** Removable chips for the field filters currently narrowing the library. */
export function ActiveFilterChips({
  chips,
  onDismiss,
  onClear,
}: {
  chips: FilterChip[];
  onDismiss: (fieldId: string, token: string) => void;
  onClear: () => void;
}) {
  if (chips.length === 0) return null;

  return (
    <div className="active-filters" aria-label="Aktive Filter">
      <div className="active-filter-scroll">
        {chips.map((chip) => (
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
        Alle löschen
      </m3-button>
    </div>
  );
}
