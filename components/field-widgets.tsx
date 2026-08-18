"use client";

import type { AnyGameField, ChipTone, GameRecord } from "@/lib/game-fields";
import { collectFieldOptions, formatDate, formatPlaytime } from "@/lib/game-fields";
import { Chip, SelectField, Switch, TextArea, TextField } from "@/components/ui";
import { CoverImage } from "@/components/cover-image";

export function BooleanChip({
  field,
  value,
}: {
  field: AnyGameField;
  value: boolean;
}) {
  if (!value) return null;
  return (
    <Chip tone={(field.chipTone as ChipTone | undefined) ?? "neutral"}>{field.label}</Chip>
  );
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
    return <span className="rating-compact">{value == null ? "—" : value.toFixed(1)}</span>;
  }
  return (
    <div className="rating-editor">
      <input
        type="range"
        min={1}
        max={10}
        step={0.5}
        value={value ?? 1}
        aria-label="Bewertung"
        onChange={(event) => onChange?.(Number(event.target.value))}
      />
      <div className="rating-editor-meta">
        <strong>{value == null ? "—" : value.toFixed(1)}</strong>
        {onChange ? (
          <button type="button" className="btn btn-text" onClick={() => onChange(null)}>
            Zurücksetzen
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function PriorityBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="priority-empty" />;
  const tone = value === 1 ? "loud" : value <= 3 ? "mid" : "quiet";
  return <span className={`priority-badge priority-${tone}`}>#{value}</span>;
}

export function NotesPreview({ value }: { value: string }) {
  const line = value.split(/\r?\n/, 1)[0]?.trim() ?? "";
  if (!line) return <span className="notes-preview is-empty" />;
  return (
    <span className="notes-preview" title={value}>
      {line}
    </span>
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
      <Switch
        label={field.label}
        checked={Boolean(value)}
        onChange={(next) => onChange({ [field.id]: next })}
        disabled={field.readOnly}
      />
    );
  }

  if (field.type === "text") {
    return (
      <TextArea
        label={field.label}
        value={typeof value === "string" ? value : ""}
        onChange={(next) => onChange({ [field.id]: next })}
      />
    );
  }

  if (field.type === "enum") {
    return (
      <SelectField
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
              <Chip
                key={option}
                selected={isOn}
                tone={isOn ? "primary" : "neutral"}
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
              </Chip>
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
          <input
            className="field-input"
            type="number"
            min={1}
            placeholder="—"
            value={current ?? ""}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === "") {
                onPriority(null);
                return;
              }
              const parsed = Number(raw);
              if (Number.isFinite(parsed)) onPriority(parsed);
            }}
          />
          <button type="button" className="btn btn-tonal" onClick={() => onPriority(1)}>
            Auf Platz 1
          </button>
          {current != null ? (
            <button type="button" className="btn btn-text" onClick={() => onPriority(null)}>
              Rang entfernen
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (field.type === "cover") {
    return (
      <div className="field">
        <TextField
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
      <TextField
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
        <TextField
          label={`${field.label}${minutes != null ? ` (${formatPlaytime(minutes)})` : ""}`}
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
      <TextField
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
      <TextField
        label={field.label}
        value={formatDate(typeof value === "string" ? value : null)}
        onChange={() => undefined}
        disabled
      />
    );
  }

  return (
    <TextField
      label={field.label}
      value={typeof value === "string" ? value : ""}
      onChange={(next) => onChange({ [field.id]: next })}
      disabled={field.readOnly}
    />
  );
}
