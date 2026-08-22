/**
 * Field registry — the only file you touch to add a game attribute.
 *
 * Example: owner wants `releaseYear`.
 *
 * 1. Append to GAME_FIELDS:
 *    {
 *      id: "releaseYear",
 *      label: "Erscheinungsjahr",
 *      type: "number",
 *      filterable: true,
 *      filterWidget: "range",
 *      sortable: true,
 *      showInRow: false,
 *      showInEditor: true,
 *      defaultValue: null,
 *      group: "identity",
 *    }
 *    Omit `options` and set `allowCustom` for values that come from the
 *    library (franchise, genre, difficulty). `filterMinCount` hides rare
 *    values from filter menus (franchise needs 2 games).
 * 2. Bump JSON `version` only if you need a migrator. Prefer default-fill
 *    on load so old JSON still works.
 *
 * That is the entire process. Filters, editor, row slots, import defaults,
 * sort options, and the Game type all derive from this list.
 *
 * `showInHero` is reserved for a future detail view. Do not build the hero page.
 */
import { z } from "zod";
import {
  GAME_FIELDS,
  PLATFORMS,
} from "./model/game-field-definitions";
import {
  collectEditorOptions,
  collectFieldOptions,
  collectFilterOptions,
  firstLine,
  formatDate,
  formatPlaytime,
  matchExistingOption,
} from "./model/game-field-utils";
import type { FieldProvenanceMap, RemoteImageAsset } from "./model/shared";
import {
  fieldProvenanceMapSchema,
  remoteImageAssetSchema,
} from "./model/value-schemas";
import type { SteamPriceSnapshot } from "./steam";

export const FIELD_TYPES = [
  "string",
  "text",
  "boolean",
  "number",
  "rating",
  "enum",
  "multiEnum",
  "priority",
  "position",
  "cover",
  "artwork",
  "provenance",
  "steamAppId",
  "steamPrice",
  "igdbId",
  "date",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_GROUPS = [
  "identity",
  "status",
  "classification",
  "progress",
  "personal",
] as const;

export type FieldGroup = (typeof FIELD_GROUPS)[number];

export const FILTER_WIDGETS = ["chips", "select", "toggle", "range"] as const;
export type FilterWidget = (typeof FILTER_WIDGETS)[number];

export const ROW_SLOTS = [
  "title",
  "meta",
  "chips",
  "rating",
  "priority",
  "notes",
  "cover",
] as const;
export type RowSlot = (typeof ROW_SLOTS)[number];

export type ChipTone = "primary" | "secondary" | "tertiary" | "neutral";

export interface GameFieldDef {
  id: string;
  label: string;
  type: FieldType;
  options?: readonly string[];
  maxSelected?: number;
  filterable: boolean;
  filterWidget?: FilterWidget;
  filterGroup?: string;
  filterGroupLabel?: string;
  filterTrueLabel?: string;
  filterFalseLabel?: string;
  sortable: boolean;
  showInRow: boolean;
  showInEditor: boolean;
  showInHero?: boolean;
  rowSlot?: RowSlot;
  defaultValue: unknown;
  group?: FieldGroup;
  chipTone?: ChipTone;
  readOnly?: boolean;
  /** Collect extra values from the library and allow creating new ones in the editor. */
  allowCustom?: boolean;
  /** Filter menus hide values that appear on fewer games than this. */
  filterMinCount?: number;
  newOptionLabel?: string;
  emptyLabel?: string;
}

export { GAME_FIELDS, PLATFORMS };
export {
  collectEditorOptions,
  collectFieldOptions,
  collectFilterOptions,
  firstLine,
  formatDate,
  formatPlaytime,
  matchExistingOption,
};

export const FIELD_GROUP_LABELS: Record<FieldGroup, string> = {
  identity: "Identität",
  status: "Status",
  classification: "Einordnung",
  progress: "Fortschritt",
  personal: "Persönlich",
};

type FieldUnion = (typeof GAME_FIELDS)[number];
export type GameFieldId = FieldUnion["id"];
export type AnyGameField = GameFieldDef;

type FieldTs<T extends FieldType> = T extends "string" | "text" | "cover" | "enum"
  ? string
  : T extends "boolean"
    ? boolean
    : T extends "multiEnum"
      ? string[]
      : T extends "number" | "rating" | "priority" | "steamAppId" | "igdbId"
        ? number | null
        : T extends "position"
          ? number | null
          : T extends "artwork"
            ? RemoteImageAsset | null
            : T extends "provenance"
              ? FieldProvenanceMap
        : T extends "steamPrice"
          ? SteamPriceSnapshot | null
          : T extends "date"
            ? string | null
            : unknown;

/** Derived from GAME_FIELDS. Adding a field updates this automatically. */
export type Game = {
  [F in FieldUnion as F["id"]]: FieldTs<F["type"]>;
};

/** Runtime objects may carry unknown future keys from JSON import. */
export type GameRecord = Game & Record<string, unknown>;

export const FIELD_BY_ID: Record<string, GameFieldDef> = Object.fromEntries(
  GAME_FIELDS.map((field) => [field.id, field as GameFieldDef]),
);

export function fieldById(id: string): AnyGameField | undefined {
  return FIELD_BY_ID[id];
}

export function fieldsForRowSlot(slot: RowSlot): GameFieldDef[] {
  return GAME_FIELDS.filter((field) => field.showInRow && field.rowSlot === slot).map(
    (field) => field as GameFieldDef,
  );
}

export function editorFields(): GameFieldDef[] {
  return GAME_FIELDS.filter((field) => field.showInEditor).map((field) => field as GameFieldDef);
}

export function editorFieldsByGroup(): Array<{ group: FieldGroup; fields: GameFieldDef[] }> {
  return FIELD_GROUPS.map((group) => ({
    group,
    fields: editorFields().filter((field) => field.group === group),
  })).filter((entry) => entry.fields.length > 0);
}

export function filterableFields(): GameFieldDef[] {
  return GAME_FIELDS.filter((field) => field.filterable).map((field) => field as GameFieldDef);
}

export function sortableFieldOptions(): Array<{ id: string; label: string }> {
  const fromRegistry = GAME_FIELDS.filter((field) => field.sortable).map((field) => ({
    id: field.id,
    label: field.label,
  }));
  return [...fromRegistry, { id: "status", label: "Status" }];
}

function baseZodForField(field: GameFieldDef): z.ZodType {
  switch (field.type) {
    case "string":
    case "text":
    case "cover":
    case "enum":
      return z.string();
    case "boolean":
      return z.boolean();
    case "number":
    case "rating":
    case "priority":
    case "position":
    case "steamAppId":
      return z.number().finite().nullable();
    case "artwork":
      return remoteImageAssetSchema.nullable();
    case "provenance":
      return fieldProvenanceMapSchema;
    case "igdbId":
      return z.number().int().positive().nullable();
    case "multiEnum":
      return z.array(z.string());
    case "date":
      return z.union([z.string(), z.null()]);
    case "steamPrice":
      return z
        .object({
          source: z.literal("steam"),
          currency: z.string(),
          initialCents: z.number().int().nonnegative().nullable(),
          finalCents: z.number().int().nonnegative().nullable(),
          discountPercent: z.number().int().nonnegative(),
          isFree: z.boolean(),
          formatted: z.string(),
          updatedAt: z.string(),
        })
        .passthrough()
        .nullable();
  }
}

function zodForField(field: GameFieldDef): z.ZodType {
  const fallback = field.defaultValue;
  return z.preprocess(
      (value) => (value === undefined ? fallback : value),
      baseZodForField(field).catch(() => fallback),
    );
}

const gameShape = Object.fromEntries(
  GAME_FIELDS.map((field) => [field.id, zodForField(field as GameFieldDef)]),
);

export const gameSchema = z.object(gameShape).passthrough();

const libraryGameV2Shape = Object.fromEntries(
  GAME_FIELDS.filter((field) => field.id !== "priority").map((field) => [
    field.id,
    baseZodForField(field as GameFieldDef),
  ]),
);

export const libraryGameV2Schema = z
  .object(libraryGameV2Shape)
  .passthrough()
  .superRefine((game, context) => {
    const artwork = game.landscapeArtwork as RemoteImageAsset | null;
    if (artwork && artwork.url !== game.coverUrl) {
      context.addIssue({
        code: "custom",
        path: ["landscapeArtwork", "url"],
        message: "landscapeArtwork.url must equal coverUrl",
      });
    }
  });

export function newGameId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `game-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultGameValues(): Game {
  const values = {} as Game;
  for (const field of GAME_FIELDS) {
    (values as Record<string, unknown>)[field.id] = structuredClone(field.defaultValue);
  }
  return values;
}

export function normalizeGame(raw: unknown): GameRecord {
  const source =
    raw && typeof raw === "object" ? { ...(raw as Record<string, unknown>) } : {};
  if (source.queuePosition === undefined && source.priority !== undefined) {
    source.queuePosition = source.priority;
  }
  if (typeof source.id !== "string" || source.id.trim() === "") {
    source.id = newGameId();
  }
  if (typeof source.dateAdded !== "string" || source.dateAdded.trim() === "") {
    source.dateAdded = new Date().toISOString();
  }

  const parsed = gameSchema.parse(source) as GameRecord;

  if (Array.isArray(parsed.genres) && parsed.genres.length > 2) {
    parsed.genres = parsed.genres.slice(0, 2);
  }

  if (typeof parsed.rating === "number") {
    const clamped = Math.min(10, Math.max(1, Math.round(parsed.rating * 2) / 2));
    parsed.rating = clamped;
  }

  if (typeof parsed.priority === "number" && parsed.priority < 1) {
    parsed.priority = null;
  }

  for (const field of ["queuePosition", "favoriteRank"] as const) {
    const value = parsed[field];
    if (typeof value === "number" && (!Number.isFinite(value) || value <= 0)) {
      parsed[field] = null;
    }
  }

  return parsed;
}

export const LIBRARY_JSON_VERSION = 2;
