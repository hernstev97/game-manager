import type {
  SavedView,
  SavedViewComparableState,
  SavedViewFilters,
  SystemSavedViewId,
} from "../model/views";
import {
  DEFAULT_SYSTEM_SAVED_VIEW_ID,
  SAVED_VIEW_DIRTY_FIELDS,
  SYSTEM_SAVED_VIEW_IDS,
  SYSTEM_SAVED_VIEW_NAMES,
} from "../model/views";
import { savedViewSchema } from "./view-schema";

const emptyFilters = (): SavedViewFilters => ({ query: "", fields: {} });

function systemView(
  id: SystemSavedViewId,
  overrides: Partial<SavedView>,
): SavedView {
  return {
    id,
    name: SYSTEM_SAVED_VIEW_NAMES[id],
    filters: emptyFilters(),
    sort: { by: "name", dir: "asc" },
    displayMode: "list",
    groupBy: "none",
    isDefault: false,
    kind: "system",
    ...overrides,
  };
}

export function createSystemSavedViews(): SavedView[] {
  return [
    systemView(SYSTEM_SAVED_VIEW_IDS.allGames, {}),
    systemView(SYSTEM_SAVED_VIEW_IDS.queue, {
      filters: {
        query: "",
        fields: {
          queuePosition: { kind: "queue", selected: ["has"] },
        },
      },
      sort: { by: "queuePosition", dir: "asc" },
    }),
    systemView(SYSTEM_SAVED_VIEW_IDS.currentlyPlaying, {
      filters: {
        query: "",
        fields: {
          played: { kind: "multi", selected: ["true"] },
          finished: { kind: "multi", selected: ["false"] },
        },
      },
    }),
    systemView(SYSTEM_SAVED_VIEW_IDS.wishlist, {
      filters: {
        query: "",
        fields: { wishlisted: { kind: "multi", selected: ["true"] } },
      },
      displayMode: "grid",
    }),
    systemView(SYSTEM_SAVED_VIEW_IDS.unrated, {
      filters: {
        query: "",
        fields: {
          rating: { kind: "rating", selected: ["unrated"], gte: 7 },
        },
      },
    }),
    systemView(SYSTEM_SAVED_VIEW_IDS.recentlyAdded, {
      sort: { by: "dateAdded", dir: "desc" },
      displayMode: "grid",
    }),
    systemView(SYSTEM_SAVED_VIEW_IDS.favorites, {
      filters: {
        query: "",
        fields: {
          favoriteRank: { kind: "favorite", selected: ["has"] },
        },
      },
      sort: { by: "favoriteRank", dir: "asc" },
      displayMode: "grid",
    }),
  ];
}

export function isSystemSavedViewId(id: string): id is SystemSavedViewId {
  return id.startsWith("system:") && createSystemSavedViews().some((view) => view.id === id);
}

export function isCustomSavedViewId(id: string): boolean {
  return !id.startsWith("system:") && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function normalizeSavedViewFilters(filters: SavedViewFilters): SavedViewFilters {
  const fields = { ...filters.fields };
  const priority = fields.priority as unknown as Record<string, unknown> | undefined;
  if (priority?.kind === "priority" && fields.queuePosition === undefined) {
    fields.queuePosition = {
      ...priority,
      kind: "queue",
    } as unknown as SavedViewFilters["fields"][string];
  }
  delete fields.priority;
  for (const [fieldId, value] of Object.entries(fields)) {
    if (!value || typeof value !== "object" || !("selected" in value)) continue;
    const selected = (value as { selected?: unknown }).selected;
    if (!Array.isArray(selected) || !selected.every((item) => typeof item === "string")) continue;
    fields[fieldId] = {
      ...value,
      selected: [...new Set(selected)].sort((a, b) => a.localeCompare(b)),
    } as typeof value;
  }
  return { ...filters, fields };
}

export function normalizeSavedViews(
  input: readonly SavedView[],
  requestedDefault?: string,
): { savedViews: SavedView[]; defaultView: string } {
  const installed = createSystemSavedViews();
  const systemInput = new Map(
    input.filter((view) => isSystemSavedViewId(view.id)).map((view) => [view.id, view]),
  );
  const systems = installed.map((definition) => ({
    ...(systemInput.get(definition.id) ?? {}),
    ...definition,
  }));
  const custom = input
    .filter((view) => view.kind === "custom" && !view.id.startsWith("system:"))
    .map((view) => ({
      ...view,
      filters: normalizeSavedViewFilters(view.filters),
      sort: {
        ...view.sort,
        by: view.sort.by === "priority" ? "queuePosition" : view.sort.by,
      },
    }));
  const savedViews = [...systems, ...custom];
  const ids = new Set(savedViews.map((view) => view.id));
  const marked = input.filter((view) => view.isDefault && ids.has(view.id));
  const defaultView =
    (requestedDefault && ids.has(requestedDefault) ? requestedDefault : undefined) ??
    (marked.length === 1 ? marked[0]?.id : undefined) ??
    DEFAULT_SYSTEM_SAVED_VIEW_ID;
  return {
    defaultView,
    savedViews: savedViews.map((view) => ({
      ...view,
      isDefault: view.id === defaultView,
    })),
  };
}

export function newCustomSavedViewId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (token) => {
    const value = Math.floor(Math.random() * 16);
    return (token === "x" ? value : (value & 0x3) | 0x8).toString(16);
  });
}

export function createCustomSavedView(
  state: SavedViewComparableState,
  id = newCustomSavedViewId(),
): SavedView {
  if (!isCustomSavedViewId(id)) throw new Error("Custom saved-view IDs must be UUIDs");
  return savedViewSchema.parse({
    ...state,
    id,
    kind: "custom",
    isDefault: false,
    filters: normalizeSavedViewFilters(state.filters),
  });
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, canonical(item)]),
  );
}

export function comparableSavedViewState(view: SavedView): SavedViewComparableState {
  return Object.fromEntries(
    SAVED_VIEW_DIRTY_FIELDS.map((field) => [
      field,
      field === "filters" ? normalizeSavedViewFilters(view.filters) : view[field],
    ]),
  ) as SavedViewComparableState;
}

export function isSavedViewDirty(
  baseline: SavedViewComparableState,
  current: SavedViewComparableState,
): boolean {
  const normalizedBaseline = {
    ...baseline,
    filters: normalizeSavedViewFilters(baseline.filters),
  };
  const normalizedCurrent = {
    ...current,
    filters: normalizeSavedViewFilters(current.filters),
  };
  return JSON.stringify(canonical(normalizedBaseline)) !== JSON.stringify(canonical(normalizedCurrent));
}
