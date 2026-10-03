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
    <div className="rating-control">
      <M3Slider
        label="Bewertung"
        min={1}
        max={10}
        step={0.5}
        value={value ?? 1}
        onChange={(next) => onChange?.(next)}
      />
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
  const rating = typeof value === "number" ? value : null;
  return (
    <div className="rating-field" role="group" aria-label={field.label}>
      <div className="rating-field-header">
        <span className="rating-field-label">{field.label}</span>
        <span className="rating-field-value" aria-live="polite">
          {rating == null ? "Unbewertet" : rating.toFixed(1)}
        </span>
        {rating != null ? (
          <m3-button variant="text" onClick={() => onChange({ [field.id]: null })}>
            Zurücksetzen
          </m3-button>
        ) : null}
      </div>
      <RatingStars value={rating} onChange={(next) => onChange({ [field.id]: next })} />
    </div>
  );
}
