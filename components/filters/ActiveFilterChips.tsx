"use client";

import { M3Chip } from "@/components/m3/host";

export type FilterChip = {
  fieldId: string;
  token: string;
  label: string;
};

export function ActiveFilterChips({
  active,
  chips,
  onDismiss,
  onClear,
}: {
  active: boolean;
  chips: FilterChip[];
  onDismiss: (fieldId: string, token: string) => void;
  onClear: () => void;
}) {
  if (!active) return null;

  return (
    <div className="active-filters desktop-active-filters">
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
      <m3-button variant="text" onClick={onClear}>
        Alle löschen
      </m3-button>
    </div>
  );
}
