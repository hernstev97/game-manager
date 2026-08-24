"use client";

import { M3TextField } from "@/components/m3/host";

export function PositionField({
  label,
  value,
  onPosition,
}: {
  label: string;
  value: unknown;
  onPosition: (position: number | null) => void;
}) {
  const current = typeof value === "number" ? value : null;
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="priority-editor">
        <M3TextField
          label="Rang"
          type="number"
          helperText="Unabhängig von Bewertung und Spielwarteschlange"
          value={current == null ? "" : String(current)}
          onChange={(next) => {
            if (next.trim() === "") return onPosition(null);
            const parsed = Number(next);
            if (Number.isFinite(parsed) && parsed >= 1) onPosition(Math.round(parsed));
          }}
        />
        <m3-button variant="tonal" onClick={() => onPosition(1)}>
          Auf Rang 1
        </m3-button>
        {current != null ? (
          <m3-button variant="text" onClick={() => onPosition(null)}>
            Ranking entfernen
          </m3-button>
        ) : null}
      </div>
    </div>
  );
}
