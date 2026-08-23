"use client";

import type { AnyGameField, GameRecord } from "@/lib/game-fields";
import { formatDate, formatPlaytime } from "@/lib/game-fields";
import { M3Chip, M3Switch, M3TextField } from "@/components/m3/host";

export function BooleanChip({
  field,
  value,
}: {
  field: AnyGameField;
  value: boolean;
}) {
  if (!value) return null;
  return <M3Chip>{field.label}</M3Chip>;
}

export function NotesPreview({ value }: { value: string }) {
  const line = value.split(/\r?\n/, 1)[0]?.trim() ?? "";
  if (!line) return null;
  return <span title={value}>{line}</span>;
}

export function BooleanField({
  field,
  value,
  onChange,
}: {
  field: AnyGameField;
  value: unknown;
  onChange: (patch: Partial<GameRecord>) => void;
}) {
  return (
    <M3Switch
      label={field.label}
      checked={Boolean(value)}
      onChange={(next) => onChange({ [field.id]: next })}
      disabled={field.readOnly}
    />
  );
}

export function TextField({
  field,
  value,
  onChange,
}: {
  field: AnyGameField;
  value: unknown;
  onChange: (patch: Partial<GameRecord>) => void;
}) {
  return (
    <label className="field">
      <span className="field-label">{field.label}</span>
      <textarea
        className="notes-input"
        value={typeof value === "string" ? value : ""}
        aria-label={field.label}
        rows={5}
        onChange={(event) => onChange({ [field.id]: event.target.value })}
      />
    </label>
  );
}

export function NumberField({
  field,
  value,
  onChange,
}: {
  field: AnyGameField;
  value: unknown;
  onChange: (patch: Partial<GameRecord>) => void;
}) {
  if (field.id === "playtimeMinutes") {
    const minutes = typeof value === "number" ? value : null;
    return (
      <M3TextField
        label={field.label}
        helperText={minutes != null ? formatPlaytime(minutes) : undefined}
        value={minutes == null ? "" : String(minutes)}
        onChange={(next) => {
          if (next.trim() === "") {
            onChange({ [field.id]: null });
            return;
          }
          const parsed = Number(next);
          if (Number.isFinite(parsed)) onChange({ [field.id]: Math.max(0, Math.round(parsed)) });
        }}
        placeholder="Minuten"
      />
    );
  }

  return (
    <M3TextField
      label={field.label}
      value={typeof value === "number" ? String(value) : ""}
      onChange={(next) => {
        if (next.trim() === "") {
          onChange({ [field.id]: null });
          return;
        }
        const parsed = Number(next);
        if (Number.isFinite(parsed)) onChange({ [field.id]: parsed });
      }}
    />
  );
}

export function DateField({ field, value }: { field: AnyGameField; value: unknown }) {
  return (
    <M3TextField
      label={field.label}
      value={formatDate(typeof value === "string" ? value : null)}
      onChange={() => undefined}
      disabled
    />
  );
}

export function StringField({
  field,
  value,
  onChange,
}: {
  field: AnyGameField;
  value: unknown;
  onChange: (patch: Partial<GameRecord>) => void;
}) {
  return (
    <M3TextField
      label={field.label}
      value={typeof value === "string" ? value : ""}
      onChange={(next) => onChange({ [field.id]: next })}
      disabled={field.readOnly}
    />
  );
}
