"use client";

import type { GameRecord } from "@/lib/game-fields";
import { M3Slider } from "@/components/m3/host";

export function RatingStars({
  value,
  onChange,
  compact,
}: {
  value: number | null;
  onChange?: (value: number | null) => void;
  compact?: boolean;
}) {
  if (compact) {
    return <span>{value == null ? "—" : value.toFixed(1)}</span>;
  }
  return (
    <div className="filter-stack">
      <M3Slider
        label="Bewertung"
        min={1}
        max={10}
        step={0.5}
        value={value ?? 1}
        onChange={(next) => onChange?.(next)}
      />
      <div className="confirm-row">
        <strong>{value == null ? "—" : value.toFixed(1)}</strong>
        {onChange && value != null ? (
          <m3-button variant="text" onClick={() => onChange(null)}>
            Zurücksetzen
          </m3-button>
        ) : null}
      </div>
    </div>
  );
}

export function RatingField({
  field,
  value,
  onChange,
}: {
  field: { label: string; id: string };
  value: unknown;
  onChange: (patch: Partial<GameRecord>) => void;
}) {
  return (
    <div className="field">
      <span className="field-label">{field.label}</span>
      <RatingStars
        value={typeof value === "number" ? value : null}
        onChange={(next) => onChange({ [field.id]: next })}
      />
    </div>
  );
}
