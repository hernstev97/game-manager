"use client";

import type { AnyGameField, GameRecord } from "@/lib/game-fields";
import {
  collectEditorOptions,
  collectFieldOptions,
} from "@/lib/game-fields";
import {
  BooleanField,
  DateField,
  NumberField,
  StringField,
  TextField,
} from "@/components/editor/fields/PrimitiveFields";
import {
  ComboEnumField,
  ComboMultiEnumField,
  EnumField,
  MultiEnumField,
} from "@/components/editor/fields/ChoiceFields";
import { RatingField } from "@/components/editor/fields/RatingField";
import { PriorityField } from "@/components/editor/fields/PriorityField";
import { PlanSlotField } from "@/components/editor/fields/PlanSlotField";
import { SteamAppIdField } from "@/components/editor/fields/SteamFields";
import { IgdbIdField } from "@/components/editor/fields/IgdbFields";
import { SteamPriceField } from "@/components/editor/fields/SteamPriceField";
import { CoverUrlField } from "@/components/editor/fields/CoverUrlField";

export function EditorField({
  field,
  game,
  games,
  onChange,
  onPriority,
  onPosition,
  showCoverPreview = true,
}: {
  field: AnyGameField;
  game: GameRecord;
  games: GameRecord[];
  onChange: (patch: Partial<GameRecord>) => void;
  onPriority: (priority: number | null) => void;
  onPosition: (fieldId: "queuePosition" | "favoriteRank", position: number | null) => void;
  showCoverPreview?: boolean;
}) {
  const value = game[field.id];
  const currentTokens = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : typeof value === "string"
      ? value
      : "";
  const options =
    field.allowCustom || !field.options?.length
      ? collectEditorOptions(field, games, currentTokens)
      : collectFieldOptions(field, games);

  if (field.type === "boolean") {
    return <BooleanField field={field} value={value} onChange={onChange} />;
  }

  if (field.type === "text") {
    return <TextField field={field} value={value} onChange={onChange} />;
  }

  if (field.type === "enum") {
    const current = typeof value === "string" ? value : String(field.defaultValue ?? "");
    if (field.allowCustom || !field.options?.length) {
      return (
        <ComboEnumField
          field={field}
          value={current}
          options={options}
          onChange={(next) => onChange({ [field.id]: next })}
        />
      );
    }
    return (
      <EnumField
        label={field.label}
        value={current}
        options={options}
        onChange={(next) => onChange({ [field.id]: next })}
      />
    );
  }

  if (field.type === "multiEnum") {
    const selected = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
    if (field.allowCustom || !field.options?.length) {
      return (
        <ComboMultiEnumField
          field={field}
          selected={selected}
          options={options}
          onChange={(next) => onChange({ [field.id]: next })}
        />
      );
    }
    return (
      <MultiEnumField
        field={field}
        selected={selected}
        options={options}
        onChange={(next) => onChange({ [field.id]: next })}
      />
    );
  }

  if (field.type === "rating") {
    return <RatingField field={field} value={value} onChange={onChange} />;
  }

  if (field.type === "priority") {
    return <PriorityField field={field} value={value} total={games.length} onPriority={onPriority} />;
  }

  if (field.type === "position") {
    const fieldId = field.id === "favoriteRank" ? "favoriteRank" : "queuePosition";
    return (
      <PlanSlotField
        label={fieldId === "favoriteRank" ? "Ranking" : "Als Nächstes"}
        value={value}
        total={games.length}
        emptyText={fieldId === "favoriteRank" ? "Nicht gerankt" : "Nicht eingereiht"}
        addLabel={fieldId === "favoriteRank" ? "Ranken" : "Einreihen"}
        onPosition={(position) => onPosition(fieldId, position)}
      />
    );
  }

  if (field.type === "cover") {
    return (
      <CoverUrlField
        field={field}
        game={game}
        value={value}
        onChange={onChange}
        showCoverPreview={showCoverPreview}
      />
    );
  }

  if (field.type === "steamAppId") {
    return <SteamAppIdField game={game} onChange={onChange} />;
  }

  if (field.type === "igdbId") {
    return <IgdbIdField game={game} onChange={onChange} />;
  }

  if (field.type === "steamPrice") {
    return <SteamPriceField game={game} onChange={onChange} />;
  }

  if (field.type === "number") {
    return <NumberField field={field} value={value} onChange={onChange} />;
  }

  if (field.type === "date") {
    return <DateField field={field} value={typeof value === "string" ? value : null} />;
  }

  if (field.type === "string") {
    return <StringField field={field} value={value} onChange={onChange} />;
  }

  return (
    <StringField
      field={field}
      value={typeof value === "string" ? value : ""}
      onChange={onChange}
    />
  );
}
