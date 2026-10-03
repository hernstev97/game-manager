"use client";

import { IconArrowDown, IconArrowUp } from "@/components/m3/icons";

/**
 * Compact editor control for an ordered list slot (queue or favorite rank):
 * add when empty, otherwise nudge, type an exact position, or remove.
 */
export function PlanSlotField({
  label,
  value,
  total,
  emptyText,
  addLabel,
  onPosition,
}: {
  label: string;
  value: unknown;
  /** Number of games in the library; used to append at the end. */
  total: number;
  emptyText: string;
  addLabel: string;
  onPosition: (position: number | null) => void;
}) {
  const current = typeof value === "number" ? value : null;

  return (
    <div className="plan-slot" role="group" aria-label={label}>
      <div className="plan-slot-copy">
        <span className="plan-slot-label">{label}</span>
        <span className="plan-slot-value">{current == null ? emptyText : `Platz ${current}`}</span>
      </div>
      <div className="plan-slot-actions">
        {current == null ? (
          <>
            <m3-button variant="text" onClick={() => onPosition(1)}>
              Auf Platz 1
            </m3-button>
            <m3-button variant="tonal" onClick={() => onPosition(total + 1)}>
              {addLabel}
            </m3-button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="icon-toggle"
              aria-label={`${label}: einen Platz nach oben`}
              disabled={current <= 1}
              onClick={() => onPosition(current - 1)}
            >
              <IconArrowUp />
            </button>
            <input
              className="plan-slot-input"
              type="number"
              min={1}
              inputMode="numeric"
              aria-label={`${label}: Position`}
              value={current}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                if (Number.isFinite(parsed) && parsed >= 1) onPosition(Math.round(parsed));
              }}
            />
            <button
              type="button"
              className="icon-toggle"
              aria-label={`${label}: einen Platz nach unten`}
              onClick={() => onPosition(current + 1)}
            >
              <IconArrowDown />
            </button>
            <m3-button variant="text" onClick={() => onPosition(null)}>
              Entfernen
            </m3-button>
          </>
        )}
      </div>
    </div>
  );
}
