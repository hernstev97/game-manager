import {
  FIELD_BY_ID,
  fieldById,
  type AnyGameField,
  type GameRecord,
} from "./game-fields";
import { steamPriceSortValue } from "./steam";

export type MultiFilterValue = {
  kind: "multi";
  selected: string[];
};

export type ToggleFilterValue = {
  kind: "toggle";
  on: boolean;
};

export type RatingFilterValue = {
  kind: "rating";
  selected: Array<"rated" | "unrated" | "gte">;
  gte: number;
};

export type PriorityFilterValue = {
  kind: "priority";
  selected: Array<"has" | "top5" | "none">;
};

export type FieldFilterValue =
  | MultiFilterValue
  | ToggleFilterValue
  | RatingFilterValue
  | PriorityFilterValue;

export type LibraryFilters = {
  query: string;
  fields: Partial<Record<string, FieldFilterValue>>;
};

export type SortState = {
  by: string;
  dir: "asc" | "desc";
};

export const EMPTY_FILTERS: LibraryFilters = {
  query: "",
  fields: {},
};

export function defaultSortFor(games: readonly GameRecord[]): SortState {
  const hasPriority = games.some((game) => game.priority != null);
  return hasPriority ? { by: "priority", dir: "asc" } : { by: "name", dir: "asc" };
}

function normalizeSearch(value: string): string {
  return value.toLocaleLowerCase("de-DE").trim();
}

function matchesQuery(game: GameRecord, query: string): boolean {
  const needle = normalizeSearch(query);
  if (!needle) return true;
  const haystack = [game.name, game.notes, game.franchise].map((part) =>
    normalizeSearch(String(part ?? "")),
  );
  return haystack.some((part) => part.includes(needle));
}

function matchesMulti(game: GameRecord, field: AnyGameField, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const value = game[field.id];
  if (field.type === "boolean") {
    const asToken = value === true ? "true" : "false";
    return selected.includes(asToken);
  }
  if (Array.isArray(value)) {
    return selected.some((token) => value.includes(token));
  }
  return selected.includes(String(value ?? ""));
}

function matchesField(game: GameRecord, fieldId: string, filter: FieldFilterValue): boolean {
  const field = fieldById(fieldId);
  if (filter.kind === "toggle") {
    if (!filter.on) return true;
    const notes = typeof game.notes === "string" ? game.notes.trim() : "";
    return notes.length > 0;
  }
  if (filter.kind === "rating") {
    if (filter.selected.length === 0) return true;
    const rating = game.rating;
    return filter.selected.some((mode) => {
      if (mode === "rated") return rating != null;
      if (mode === "unrated") return rating == null;
      return rating != null && rating >= filter.gte;
    });
  }
  if (filter.kind === "priority") {
    if (filter.selected.length === 0) return true;
    const priority = game.priority;
    return filter.selected.some((mode) => {
      if (mode === "has") return priority != null;
      if (mode === "top5") return priority != null && priority <= 5;
      return priority == null;
    });
  }
  if (!field) return true;
  return matchesMulti(game, field, filter.selected);
}

export function gameMatchesFilters(game: GameRecord, filters: LibraryFilters): boolean {
  if (!matchesQuery(game, filters.query)) return false;
  for (const [fieldId, filter] of Object.entries(filters.fields)) {
    if (!filter) continue;
    if (!matchesField(game, fieldId, filter)) return false;
  }
  return true;
}

export function adjacentGameId(
  games: readonly { id: string }[],
  currentId: string,
  delta: -1 | 1,
): string | null {
  const index = games.findIndex((game) => game.id === currentId);
  if (index < 0) return null;
  return games[index + delta]?.id ?? null;
}

function compareNullable(
  a: number | null,
  b: number | null,
  dir: 1 | -1,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return (a - b) * dir;
}

function statusRank(game: GameRecord): number {
  if (game.finished) return 0;
  if (game.played) return 1;
  return 2;
}

function compareGames(a: GameRecord, b: GameRecord, sort: SortState): number {
  const dir: 1 | -1 = sort.dir === "desc" ? -1 : 1;
  const field = FIELD_BY_ID[sort.by];

  let result = 0;
  if (sort.by === "status") {
    result = (statusRank(a) - statusRank(b)) * dir;
  } else if (field?.type === "rating" || field?.type === "priority" || field?.type === "number") {
    const aValue = typeof a[sort.by] === "number" ? (a[sort.by] as number) : null;
    const bValue = typeof b[sort.by] === "number" ? (b[sort.by] as number) : null;
    result = compareNullable(aValue, bValue, dir);
  } else if (field?.type === "steamPrice") {
    result = compareNullable(steamPriceSortValue(a.steamPrice), steamPriceSortValue(b.steamPrice), dir);
  } else if (field?.type === "date") {
    const aValue = typeof a[sort.by] === "string" ? (a[sort.by] as string) : "";
    const bValue = typeof b[sort.by] === "string" ? (b[sort.by] as string) : "";
    result = aValue.localeCompare(bValue) * dir;
  } else {
    const aValue = String(a[sort.by] ?? "");
    const bValue = String(b[sort.by] ?? "");
    result = aValue.localeCompare(bValue, "de", { sensitivity: "base" }) * dir;
  }

  if (result !== 0) return result;
  return a.name.localeCompare(b.name, "de", { sensitivity: "base" });
}

export function applyFiltersAndSort(
  games: readonly GameRecord[],
  filters: LibraryFilters,
  sort: SortState,
): GameRecord[] {
  return games.filter((game) => gameMatchesFilters(game, filters)).sort((a, b) => compareGames(a, b, sort));
}

export function activeFilterChips(
  filters: LibraryFilters,
): Array<{ fieldId: string; token: string; label: string }> {
  const chips: Array<{ fieldId: string; token: string; label: string }> = [];
  if (filters.query.trim()) {
    chips.push({
      fieldId: "query",
      token: filters.query.trim(),
      label: `Suche: ${filters.query.trim()}`,
    });
  }

  for (const [fieldId, filter] of Object.entries(filters.fields)) {
    if (!filter) continue;
    const field = fieldById(fieldId);
    if (filter.kind === "toggle" && filter.on) {
      chips.push({
        fieldId,
        token: "on",
        label: field?.filterTrueLabel ?? field?.label ?? "Filter",
      });
      continue;
    }
    if (filter.kind === "rating") {
      for (const mode of filter.selected) {
        const label =
          mode === "rated"
            ? "Bewertet"
            : mode === "unrated"
              ? "Unbewertet"
              : `≥ ${filter.gte}`;
        chips.push({ fieldId, token: mode, label });
      }
      continue;
    }
    if (filter.kind === "priority") {
      const labels: Record<(typeof filter.selected)[number], string> = {
        has: "Hat Priorität",
        top5: "Top 5",
        none: "Ohne Rang",
      };
      for (const mode of filter.selected) {
        chips.push({ fieldId, token: mode, label: labels[mode] });
      }
      continue;
    }
    if (filter.kind !== "multi") continue;
    for (const token of filter.selected) {
      let label = token;
      if (field?.type === "boolean") {
        label = token === "true" ? (field.filterTrueLabel ?? field.label) : (field.filterFalseLabel ?? field.label);
      }
      chips.push({ fieldId, token, label });
    }
  }
  return chips;
}

export function isFilterActive(filters: LibraryFilters): boolean {
  return activeFilterChips(filters).length > 0;
}

export function emptyFieldFilter(field: AnyGameField): FieldFilterValue {
  if (field.type === "text") return { kind: "toggle", on: false };
  if (field.type === "rating") return { kind: "rating", selected: [], gte: 7 };
  if (field.type === "priority") return { kind: "priority", selected: [] };
  return { kind: "multi", selected: [] };
}
