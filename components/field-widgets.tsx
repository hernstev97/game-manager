"use client";

import { useState } from "react";
import type { AnyGameField, GameRecord } from "@/lib/game-fields";
import { collectFieldOptions, formatDate, formatPlaytime } from "@/lib/game-fields";
import { CoverImage } from "@/components/cover-image";
import { IconCheck } from "@/components/m3/icons";
import { M3Chip, M3Menu, M3Slider, M3Switch, M3TextField } from "@/components/m3/host";

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

export function PriorityBadge({ value }: { value: number | null }) {
  if (value == null) return null;
  return <M3Chip>#{value}</M3Chip>;
}

export function NotesPreview({ value }: { value: string }) {
  const line = value.split(/\r?\n/, 1)[0]?.trim() ?? "";
  if (!line) return null;
  return <span title={value}>{line}</span>;
}

function EnumField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="anchor">
        <m3-button variant="outlined" onClick={() => setOpen((current) => !current)}>
          {value}
        </m3-button>
        <M3Menu
          open={open}
          onOpenChange={setOpen}
          onSelect={(next) => {
            onChange(next);
            setOpen(false);
          }}
        >
          {options.map((option) => (
            <m3-menu-item key={option} value={option}>
              {option}
              {option === value ? <IconCheck slot="trailing-icon" /> : null}
            </m3-menu-item>
          ))}
        </M3Menu>
      </div>
    </div>
  );
}

export function EditorField({
  field,
  game,
  games,
  onChange,
  onPriority,
}: {
  field: AnyGameField;
  game: GameRecord;
  games: GameRecord[];
  onChange: (patch: Partial<GameRecord>) => void;
  onPriority: (priority: number | null) => void;
}) {
  const value = game[field.id];
  const options = collectFieldOptions(field, games);

  if (field.type === "boolean") {
    return (
      <M3Switch
        label={field.label}
        checked={Boolean(value)}
        onChange={(next) => onChange({ [field.id]: next })}
        disabled={field.readOnly}
      />
    );
  }

  if (field.type === "text") {
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

  if (field.type === "enum") {
    return (
      <EnumField
        label={field.label}
        value={typeof value === "string" ? value : String(field.defaultValue ?? "")}
        options={options}
        onChange={(next) => onChange({ [field.id]: next })}
      />
    );
  }

  if (field.type === "multiEnum") {
    const selected = Array.isArray(value) ? value : [];
    const max = field.maxSelected ?? Infinity;
    return (
      <div className="field">
        <span className="field-label">{field.label}</span>
        <div className="chip-row">
          {options.map((option) => {
            const isOn = selected.includes(option);
            return (
              <M3Chip
                key={option}
                variant="filter"
                selected={isOn}
                onClick={() => {
                  if (isOn) {
                    onChange({ [field.id]: selected.filter((item) => item !== option) });
                    return;
                  }
                  if (selected.length >= max) {
                    onChange({ [field.id]: [...selected.slice(1 - max + selected.length), option].slice(-max) });
                    return;
                  }
                  onChange({ [field.id]: [...selected, option] });
                }}
              >
                {option}
              </M3Chip>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.type === "rating") {
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

  if (field.type === "priority") {
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

  if (field.type === "cover") {
    return (
      <div className="field">
        <M3TextField
          label={field.label}
          value={typeof value === "string" ? value : ""}
          onChange={(next) => onChange({ [field.id]: next })}
          placeholder="https://…"
        />
        <div className="cover-preview">
          <CoverImage
            name={game.name}
            franchise={game.franchise}
            coverUrl={game.coverUrl}
            steamAppId={game.steamAppId}
          />
        </div>
      </div>
    );
  }

  if (field.type === "steamAppId") {
    return (
      <M3TextField
        label={field.label}
        value={typeof value === "number" ? String(value) : ""}
        onChange={(next) => {
          const trimmed = next.trim();
          if (!trimmed) {
            onChange({ steamAppId: null });
            return;
          }
          const parsed = Number(trimmed);
          if (Number.isInteger(parsed) && parsed > 0) {
            onChange({ steamAppId: parsed });
          }
        }}
        placeholder="359870"
      />
    );
  }

  if (field.type === "number") {
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

  if (field.type === "date") {
    return (
      <M3TextField
        label={field.label}
        value={formatDate(typeof value === "string" ? value : null)}
        onChange={() => undefined}
        disabled
      />
    );
  }

  return (
    <M3TextField
      label={field.label}
      value={typeof value === "string" ? value : ""}
      onChange={(next) => onChange({ [field.id]: next })}
      disabled={field.readOnly}
    />
  );
}
