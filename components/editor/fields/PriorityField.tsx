"use client";

import { M3TextField, M3Chip } from "@/components/m3/host";

export function PriorityBadge({ value }: { value: number | null }) {
  if (value == null) return null;
  return <M3Chip>#{value}</M3Chip>;
}

export function PriorityField({
  field,
  value,
  onPriority,
}: {
  field: { label: string };
  value: unknown;
  onPriority: (priority: number | null) => void;
}) {
  const current = typeof value === "number" ? value : null;
  return (
    <div className="field">
      <span className="field-label">{field.label}</span>
      <div className="priority-editor">
        <M3TextField
          label="Rang"
          type="number"
          value={current == null ? "" : String(current)}
          onChange={(next) => {
            if (next === "") {
              onPriority(null);
              return;
            }
            const parsed = Number(next);
            if (Number.isFinite(parsed)) onPriority(parsed);
          }}
        />
        <m3-button variant="tonal" onClick={() => onPriority(1)}>
          Auf Platz 1
        </m3-button>
        {current != null ? (
          <m3-button variant="text" onClick={() => onPriority(null)}>
            Rang entfernen
          </m3-button>
        ) : null}
      </div>
    </div>
  );
}
