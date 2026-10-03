"use client";

import type { GameFieldDef, GameRecord } from "@/lib/game-fields";
import { M3Chip } from "@/components/m3/host";
import { IconCheck } from "@/components/m3/icons";

/** Boolean status flags as one row of M3 filter chips instead of stacked switches. */
export function StatusChipsField({
  fields,
  game,
  onChange,
}: {
  fields: readonly GameFieldDef[];
  game: GameRecord;
  onChange: (patch: Partial<GameRecord>) => void;
}) {
  return (
    <div className="chip-row status-chips" role="group" aria-label="Status">
      {fields.map((field) => {
        const selected = Boolean(game[field.id]);
        return (
          <M3Chip
            key={field.id}
            variant="filter"
            selected={selected}
            disabled={field.readOnly}
            onClick={() => onChange({ [field.id]: !selected })}
          >
            {selected ? <IconCheck slot="icon" width={18} height={18} /> : null}
            {field.filterTrueLabel ?? field.label}
          </M3Chip>
        );
      })}
    </div>
  );
}
