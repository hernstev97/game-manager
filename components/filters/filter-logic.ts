import {
  collectFilterOptions,
  fieldById,
  filterableFields,
  type AnyGameField,
  type GameRecord,
} from "@/lib/game-fields";
import { emptyFieldFilter, type FieldFilterValue, type LibraryFilters } from "@/lib/filter-games";

export type FilterGroup = {
  key: string;
  label: string;
  fields: AnyGameField[];
};

export function groupFilterFields(fields: AnyGameField[]): FilterGroup[] {
  const groups: FilterGroup[] = [];
  const seen = new Set<string>();
  for (const field of fields) {
    const key = field.filterGroup ?? field.id;
    if (seen.has(key)) continue;
    seen.add(key);
    const members = field.filterGroup
      ? fields.filter((item) => item.filterGroup === field.filterGroup)
      : [field];
    groups.push({
      key,
      label: field.filterGroupLabel ?? field.label,
      fields: members,
    });
  }
  return groups;
}

export function groupActiveCount(group: FilterGroup, filters: LibraryFilters): number {
  let count = 0;
  for (const field of group.fields) {
    const value = filters.fields[field.id];
    if (!value) continue;
    if (value.kind === "toggle" && value.on) count++;
    if (value.kind === "multi") count += value.selected.length;
    if (value.kind === "rating") count += value.selected.length;
    if (value.kind === "priority") count += value.selected.length;
  }
  return count;
}

export function menuChoices(
  field: AnyGameField,
  games: GameRecord[],
): Array<{ token: string; label: string }> {
  if (field.type === "text" || field.filterWidget === "toggle") {
    return [{ token: "on", label: field.filterTrueLabel ?? field.label }];
  }
  if (field.type === "rating") {
    return [
      { token: "rated", label: "Bewertet" },
      { token: "unrated", label: "Unbewertet" },
      { token: "gte", label: "Mindestbewertung" },
    ];
  }
  if (field.type === "priority") {
    return [
      { token: "has", label: "Hat Priorität" },
      { token: "top5", label: "Top 5" },
      { token: "none", label: "Ohne Rang" },
    ];
  }
  if (field.type === "boolean") {
    return [
      { token: "true", label: field.filterTrueLabel ?? field.label },
      { token: "false", label: field.filterFalseLabel ?? `Nicht ${field.label}` },
    ];
  }
  return collectFilterOptions(field, games).map((option) => ({ token: option, label: option }));
}

export function isTokenSelected(value: FieldFilterValue | undefined, token: string): boolean {
  if (!value) return false;
  if (value.kind === "toggle") return token === "on" && value.on;
  return value.selected.includes(token as never);
}

export function toggleToken(
  field: AnyGameField,
  value: FieldFilterValue | undefined,
  token: string,
): FieldFilterValue {
  const current = value ?? emptyFieldFilter(field);
  if (current.kind === "toggle") {
    return { ...current, on: !current.on };
  }
  const selected = current.selected.includes(token as never)
    ? current.selected.filter((item) => item !== token)
    : [...current.selected, token];
  return { ...current, selected } as FieldFilterValue;
}

export function filterGroupsForGames(games: GameRecord[]): FilterGroup[] {
  return groupFilterFields(filterableFields()).filter((group) =>
    group.fields.some((field) => menuChoices(field, games).length > 0),
  );
}

export function setFieldFilter(
  filters: LibraryFilters,
  fieldId: string,
  value: FieldFilterValue,
): LibraryFilters {
  return {
    ...filters,
    fields: { ...filters.fields, [fieldId]: value },
  };
}

export function fieldForFilter(fieldId: string): AnyGameField | undefined {
  return fieldById(fieldId);
}
