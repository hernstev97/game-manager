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
  "cover",
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

export const PLATFORMS = [
  "PC",
  "Switch 2",
  "Switch",
  "Wii U",
  "Wii",
  "GameCube",
  "N64",
  "PS5",
  "PS4",
  "PS3",
  "PS2",
  "PS1",
  "PSP",
  "Xbox",
] as const;

export const FIELD_GROUP_LABELS: Record<FieldGroup, string> = {
  identity: "Identität",
  status: "Status",
  classification: "Einordnung",
  progress: "Fortschritt",
  personal: "Persönlich",
};

export const GAME_FIELDS = [
  {
    id: "id",
    label: "ID",
    type: "string",
    filterable: false,
    sortable: false,
    showInRow: false,
    showInEditor: false,
    defaultValue: "",
  },
  {
    id: "steamAppId",
    label: "Steam App-ID",
    type: "steamAppId",
    filterable: false,
    sortable: false,
    showInRow: false,
    showInEditor: true,
    defaultValue: null,
    group: "identity",
  },
  {
    id: "steamPrice",
    label: "Steam-Preis",
    type: "steamPrice",
    filterable: false,
    sortable: true,
    showInRow: true,
    showInEditor: true,
    rowSlot: "meta",
    defaultValue: null,
    group: "identity",
    readOnly: true,
  },
  {
    id: "igdbId",
    label: "IGDB-ID",
    type: "igdbId",
    filterable: false,
    sortable: false,
    showInRow: false,
    showInEditor: true,
    defaultValue: null,
    group: "identity",
  },
  {
    id: "name",
    label: "Spiel",
    type: "string",
    filterable: false,
    sortable: true,
    showInRow: true,
    showInEditor: true,
    showInHero: true,
    rowSlot: "title",
    defaultValue: "",
    group: "identity",
  },
  {
    id: "coverUrl",
    label: "Cover",
    type: "cover",
    filterable: false,
    sortable: false,
    showInRow: true,
    showInEditor: true,
    showInHero: true,
    rowSlot: "cover",
    defaultValue: "",
    group: "identity",
  },
  {
    id: "franchise",
    label: "Franchise",
    type: "enum",
    allowCustom: true,
    filterMinCount: 2,
    newOptionLabel: "Neue Franchise",
    emptyLabel: "Kein Franchise",
    filterable: true,
    filterWidget: "chips",
    sortable: true,
    showInRow: true,
    showInEditor: true,
    rowSlot: "meta",
    defaultValue: "",
    group: "classification",
  },
  {
    id: "genres",
    label: "Genre",
    type: "multiEnum",
    allowCustom: true,
    newOptionLabel: "Neues Genre",
    maxSelected: 2,
    filterable: true,
    filterWidget: "chips",
    sortable: false,
    showInRow: true,
    showInEditor: true,
    rowSlot: "chips",
    defaultValue: [],
    group: "classification",
  },
  {
    id: "platforms",
    label: "Plattform",
    type: "multiEnum",
    options: PLATFORMS,
    filterable: true,
    filterWidget: "chips",
    sortable: false,
    showInRow: true,
    showInEditor: true,
    rowSlot: "meta",
    defaultValue: [],
    group: "classification",
  },
  {
    id: "owned",
    label: "Besitz",
    type: "boolean",
    filterable: true,
    filterWidget: "chips",
    filterGroup: "ownership",
    filterGroupLabel: "Besitz",
    filterTrueLabel: "Im Besitz",
    filterFalseLabel: "Nicht im Besitz",
    sortable: false,
    showInRow: true,
    showInEditor: true,
    rowSlot: "chips",
    defaultValue: false,
    group: "status",
    chipTone: "neutral",
  },
  {
    id: "wishlisted",
    label: "Wunschliste",
    type: "boolean",
    filterable: true,
    filterWidget: "chips",
    filterGroup: "ownership",
    filterGroupLabel: "Besitz",
    filterTrueLabel: "Wunschliste",
    filterFalseLabel: "Nicht auf Wunschliste",
    sortable: false,
    showInRow: true,
    showInEditor: true,
    rowSlot: "chips",
    defaultValue: false,
    group: "status",
    chipTone: "secondary",
  },
  {
    id: "played",
    label: "Gespielt",
    type: "boolean",
    filterable: true,
    filterWidget: "chips",
    filterGroup: "status",
    filterGroupLabel: "Status",
    filterTrueLabel: "Gespielt",
    filterFalseLabel: "Nicht gespielt",
    sortable: false,
    showInRow: true,
    showInEditor: true,
    rowSlot: "chips",
    defaultValue: false,
    group: "status",
    chipTone: "primary",
  },
  {
    id: "finished",
    label: "Durchgespielt",
    type: "boolean",
    filterable: true,
    filterWidget: "chips",
    filterGroup: "status",
    filterGroupLabel: "Status",
    filterTrueLabel: "Durchgespielt",
    filterFalseLabel: "Nicht durchgespielt",
    sortable: false,
    showInRow: true,
    showInEditor: true,
    rowSlot: "chips",
    defaultValue: false,
    group: "status",
    chipTone: "tertiary",
  },
  {
    id: "released",
    label: "Erschienen",
    type: "boolean",
    filterable: true,
    filterWidget: "chips",
    filterTrueLabel: "Erschienen",
    filterFalseLabel: "Noch nicht erschienen",
    sortable: false,
    showInRow: false,
    showInEditor: true,
    defaultValue: true,
    group: "status",
  },
  {
    id: "completed100",
    label: "100%",
    type: "boolean",
    filterable: true,
    filterWidget: "chips",
    filterGroup: "status",
    filterGroupLabel: "Status",
    filterTrueLabel: "100%",
    filterFalseLabel: "Nicht 100%",
    sortable: false,
    showInRow: true,
    showInEditor: true,
    rowSlot: "chips",
    defaultValue: false,
    group: "status",
    chipTone: "tertiary",
  },
  {
    id: "difficultyTo100",
    label: "Schwierigkeit 100%",
    type: "enum",
    allowCustom: true,
    newOptionLabel: "Neue Schwierigkeit",
    emptyLabel: "Keine Angabe",
    filterable: true,
    filterWidget: "chips",
    sortable: true,
    showInRow: true,
    showInEditor: true,
    rowSlot: "meta",
    defaultValue: "",
    group: "progress",
  },
  {
    id: "rating",
    label: "Bewertung",
    type: "rating",
    filterable: true,
    filterWidget: "range",
    sortable: true,
    showInRow: true,
    showInEditor: true,
    rowSlot: "rating",
    defaultValue: null,
    group: "personal",
  },
  {
    id: "priority",
    label: "Als nächstes",
    type: "priority",
    filterable: true,
    filterWidget: "chips",
    sortable: true,
    showInRow: true,
    showInEditor: true,
    rowSlot: "priority",
    defaultValue: null,
    group: "personal",
  },
  {
    id: "notes",
    label: "Notizen",
    type: "text",
    filterable: true,
    filterWidget: "toggle",
    filterTrueLabel: "Hat Notizen",
    sortable: false,
    showInRow: true,
    showInEditor: true,
    rowSlot: "notes",
    defaultValue: "",
    group: "personal",
  },
  {
    id: "playtimeMinutes",
    label: "Spielzeit",
    type: "number",
    filterable: false,
    sortable: true,
    showInRow: true,
    showInEditor: true,
    rowSlot: "meta",
    defaultValue: null,
    group: "progress",
  },
  {
    id: "dateAdded",
    label: "Hinzugefügt",
    type: "date",
    filterable: false,
    sortable: true,
    showInRow: false,
    showInEditor: true,
    defaultValue: null,
    group: "identity",
    readOnly: true,
  },
  {
    id: "lastSynced",
    label: "Zuletzt synchronisiert",
    type: "date",
    filterable: false,
    sortable: false,
    showInRow: false,
    showInEditor: true,
    defaultValue: null,
    group: "progress",
    readOnly: true,
  },
] as const satisfies readonly GameFieldDef[];

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

function zodForField(field: GameFieldDef): z.ZodType {
  const fallback = field.defaultValue;
  const orDefault = (schema: z.ZodType) =>
    z.preprocess(
      (value) => (value === undefined ? fallback : value),
      schema.catch(() => fallback),
    );

  switch (field.type) {
    case "string":
    case "text":
    case "cover":
    case "enum":
      return orDefault(z.string());
    case "boolean":
      return orDefault(z.boolean());
    case "number":
    case "rating":
    case "priority":
    case "steamAppId":
      return orDefault(z.number().nullable());
    case "igdbId":
      return orDefault(z.number().int().positive().nullable());
    case "multiEnum":
      return orDefault(z.array(z.string()));
    case "date":
      return orDefault(z.union([z.string(), z.null()]));
    case "steamPrice":
      return orDefault(
        z
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
          .nullable(),
      );
  }
}

const gameShape = Object.fromEntries(
  GAME_FIELDS.map((field) => [field.id, zodForField(field as GameFieldDef)]),
);

export const gameSchema = z.object(gameShape).passthrough();

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

  return parsed;
}

function tokensFromValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    const seen = new Set<string>();
    const tokens: string[] = [];
    for (const item of value) {
      if (typeof item !== "string") continue;
      const token = item.trim();
      if (!token || seen.has(token)) continue;
      seen.add(token);
      tokens.push(token);
    }
    return tokens;
  }
  if (typeof value === "string") {
    const token = value.trim();
    return token ? [token] : [];
  }
  return [];
}

export function collectFieldOptions(
  field: GameFieldDef,
  games: readonly GameRecord[],
  opts: { minCount?: number; extra?: readonly string[] } = {},
): string[] {
  const counts = new Map<string, number>();
  for (const option of field.options ?? []) {
    counts.set(option, 0);
  }
  for (const extra of opts.extra ?? []) {
    const token = extra.trim();
    if (token && !counts.has(token)) counts.set(token, 0);
  }
  for (const game of games) {
    for (const token of tokensFromValue(game[field.id])) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }

  const minCount = opts.minCount ?? 0;
  const staticOptions = [...(field.options ?? [])];
  const staticSet = new Set(staticOptions);
  const dynamic = [...counts.keys()]
    .filter((token) => !staticSet.has(token) && (counts.get(token) ?? 0) >= minCount)
    .sort((a, b) => a.localeCompare(b, "de", { sensitivity: "base" }));
  return [...staticOptions, ...dynamic];
}

export function collectFilterOptions(field: GameFieldDef, games: readonly GameRecord[]): string[] {
  return collectFieldOptions(field, games, { minCount: field.filterMinCount ?? 0 });
}

export function collectEditorOptions(
  field: GameFieldDef,
  games: readonly GameRecord[],
  current?: string | readonly string[] | null,
): string[] {
  const extra = Array.isArray(current)
    ? current
    : typeof current === "string" && current.trim()
      ? [current]
      : [];
  return collectFieldOptions(field, games, { extra });
}

export function matchExistingOption(options: readonly string[], raw: string): string {
  const token = raw.trim();
  if (!token) return "";
  const needle = token.toLocaleLowerCase("de-DE");
  return options.find((option) => option.toLocaleLowerCase("de-DE") === needle) ?? token;
}

export function firstLine(text: string): string {
  return text.split(/\r?\n/, 1)[0]?.trim() ?? "";
}

export function formatPlaytime(minutes: number | null): string {
  if (minutes == null || !Number.isFinite(minutes)) return "";
  const safe = Math.max(0, Math.round(minutes));
  if (safe < 60) return `${safe} Min.`;
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  return rest ? `${hours} Std. ${rest} Min.` : `${hours} Std.`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export const LIBRARY_JSON_VERSION = 1;
