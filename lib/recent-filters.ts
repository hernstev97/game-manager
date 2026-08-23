import {
  activeFilterChips,
  migrateLegacyFilters,
  type FieldFilterValue,
  type LibraryFilters,
} from "./filter-games";

export const RECENT_FILTERS_STORAGE_KEY = "ggrid.recent-filters.v1";
export const RECENT_FILTERS_CHANGED_EVENT = "ggrid:recent-filters-changed";
export const RECENT_FILTERS_LIMIT = 5;

export type RecentFilterPreset = {
  id: string;
  label: string;
  filters: LibraryFilters;
  lastUsedAt: string;
};

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function parseSelected(value: unknown, allowed?: readonly string[]): string[] | null {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) return null;
  const selected = [...new Set(value)];
  return allowed ? selected.filter((item) => allowed.includes(item)) : selected;
}

function parseFieldFilter(value: unknown): FieldFilterValue | null {
  if (!value || typeof value !== "object" || !("kind" in value)) return null;
  const candidate = value as Record<string, unknown>;
  if (candidate.kind === "toggle") {
    return typeof candidate.on === "boolean" ? { kind: "toggle", on: candidate.on } : null;
  }
  if (candidate.kind === "rating") {
    const selected = parseSelected(candidate.selected, ["rated", "unrated", "gte"]);
    return selected && typeof candidate.gte === "number" && Number.isFinite(candidate.gte)
      ? { kind: "rating", selected: selected as Array<"rated" | "unrated" | "gte">, gte: candidate.gte }
      : null;
  }
  if (candidate.kind === "queue" || candidate.kind === "priority") {
    const selected = parseSelected(candidate.selected, ["has", "top5", "none"]);
    return selected
      ? { kind: candidate.kind, selected: selected as Array<"has" | "top5" | "none"> }
      : null;
  }
  if (candidate.kind === "favorite") {
    const selected = parseSelected(candidate.selected, ["has", "top5", "top10", "none"]);
    return selected
      ? { kind: "favorite", selected: selected as Array<"has" | "top5" | "top10" | "none"> }
      : null;
  }
  if (candidate.kind === "multi") {
    const selected = parseSelected(candidate.selected);
    return selected ? { kind: "multi", selected } : null;
  }
  return null;
}

function canonicalFilters(input: LibraryFilters): LibraryFilters {
  const fields: Record<string, FieldFilterValue> = {};
  for (const fieldId of Object.keys(input.fields).sort()) {
    const parsed = parseFieldFilter(input.fields[fieldId]);
    if (!parsed) continue;
    if (parsed.kind === "toggle") {
      if (parsed.on) fields[fieldId] = parsed;
      continue;
    }
    if (parsed.selected.length === 0) continue;
    fields[fieldId] = { ...parsed, selected: [...parsed.selected].sort() } as FieldFilterValue;
  }
  return migrateLegacyFilters({ query: "", fields });
}

function presetLabel(filters: LibraryFilters): string {
  const labels = activeFilterChips(filters).map((chip) => chip.label);
  return labels.length <= 2 ? labels.join(" · ") : `${labels.slice(0, 2).join(" · ")} +${labels.length - 2}`;
}

function fingerprint(filters: LibraryFilters): string {
  return JSON.stringify(filters.fields);
}

export function parseRecentFilterPresets(serialized: string | null): RecentFilterPreset[] {
  if (!serialized) return [];
  try {
    const input: unknown = JSON.parse(serialized);
    if (!Array.isArray(input)) return [];
    const parsed: RecentFilterPreset[] = [];
    for (const value of input) {
      if (!value || typeof value !== "object") continue;
      const candidate = value as Record<string, unknown>;
      if (typeof candidate.id !== "string" || typeof candidate.lastUsedAt !== "string") continue;
      const rawFilters = candidate.filters;
      if (!rawFilters || typeof rawFilters !== "object") continue;
      const rawFields = (rawFilters as Record<string, unknown>).fields;
      if (!rawFields || typeof rawFields !== "object" || Array.isArray(rawFields)) continue;
      const filters = canonicalFilters({
        query: "",
        fields: rawFields as Record<string, FieldFilterValue>,
      });
      const label = presetLabel(filters);
      if (!label) continue;
      parsed.push({ id: candidate.id, label, filters, lastUsedAt: candidate.lastUsedAt });
    }
    return parsed.slice(0, RECENT_FILTERS_LIMIT);
  } catch {
    return [];
  }
}

export function readRecentFilterPresets(storage?: StorageReader): RecentFilterPreset[] {
  const source = storage ?? (typeof window === "undefined" ? undefined : window.localStorage);
  if (!source) return [];
  try {
    return parseRecentFilterPresets(source.getItem(RECENT_FILTERS_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function recordRecentFilterPreset(
  input: LibraryFilters,
  storage?: StorageWriter,
  now = new Date(),
): RecentFilterPreset[] {
  const target = storage ?? (typeof window === "undefined" ? undefined : window.localStorage);
  if (!target) return [];
  const filters = canonicalFilters(input);
  const label = presetLabel(filters);
  if (!label) return readRecentFilterPresets(target);
  const key = fingerprint(filters);
  const existing = readRecentFilterPresets(target);
  const match = existing.find((preset) => fingerprint(preset.filters) === key);
  const next = [
    {
      id: match?.id ?? `${now.getTime()}-${key.length}`,
      label,
      filters,
      lastUsedAt: now.toISOString(),
    },
    ...existing.filter((preset) => fingerprint(preset.filters) !== key),
  ].slice(0, RECENT_FILTERS_LIMIT);
  target.setItem(RECENT_FILTERS_STORAGE_KEY, JSON.stringify(next));
  notifyRecentFiltersChanged(storage === undefined);
  return next;
}

export function clearRecentFilterPresets(storage?: StorageWriter): void {
  const target = storage ?? (typeof window === "undefined" ? undefined : window.localStorage);
  if (!target) return;
  target.removeItem(RECENT_FILTERS_STORAGE_KEY);
  notifyRecentFiltersChanged(storage === undefined);
}

function notifyRecentFiltersChanged(browserStorage: boolean): void {
  if (browserStorage && typeof window !== "undefined") {
    window.dispatchEvent(new Event(RECENT_FILTERS_CHANGED_EVENT));
  }
}
