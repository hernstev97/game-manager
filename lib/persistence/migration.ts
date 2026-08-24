import type { GameRecord } from "../game-fields";
import {
  migrateLegacySort,
  type SortState,
} from "../filter-games";
import {
  LIBRARY_DOCUMENT_FORMAT,
  LIBRARY_DOCUMENT_VERSION,
  type LibraryCredentials,
  type LibraryDocumentV2,
  type SensitiveBackupEnvelope,
} from "../model/library-document";
import type { SavedView } from "../model/views";
import { DEFAULT_SYSTEM_SAVED_VIEW_ID } from "../model/views";
import {
  attachLegacyGameFacade,
  gamesFromRuntime,
  normalizeLegacyGames,
  normalizeV2Games,
  withoutLegacyPriority,
} from "./game-migration";
import {
  DEFAULT_CREDENTIALS,
  DEFAULT_SETTINGS,
  defaultDocumentPreferences,
  libraryDocumentV1Schema,
  libraryDocumentV2Schema,
  sensitiveBackupEnvelopeSchema,
  type LibraryDocument,
  type LibrarySettings,
} from "./schema";
import { savedViewSchema } from "./view-schema";
import { normalizeSavedViewFilters, normalizeSavedViews } from "./views";

export type LibraryInputSource = 1 | 2 | "bare-game-array";

export type SupportedLibraryInput = {
  kind: "supported";
  sourceVersion: LibraryInputSource;
  document: LibraryDocument;
  skipped: number;
  legacyCredentials?: LibraryCredentials;
  sensitive?: SensitiveBackupEnvelope;
};

export type UnsupportedLibraryInput = {
  kind: "unsupported-version";
  version: number;
  raw: unknown;
};

export type LibraryInputInspection =
  | SupportedLibraryInput
  | UnsupportedLibraryInput;

export class UnsupportedLibraryVersionError extends Error {
  constructor(
    readonly version: number,
    readonly raw: unknown,
  ) {
    super(`Library document version ${version} is newer than supported version 2`);
    this.name = "UnsupportedLibraryVersionError";
  }
}

function nowFrom(options?: { now?: string }): string {
  return options?.now ?? new Date().toISOString();
}

function settingsFor(
  document: LibraryDocumentV2,
  credentials: LibraryCredentials = DEFAULT_CREDENTIALS,
): LibrarySettings {
  const defaultView = document.savedViews.find(
    (view) => view.id === document.defaultView,
  );
  const activeSort = document.localUi.activeSort ?? defaultView?.sort ?? {
    by: "name",
    dir: "asc",
  };
  return {
    sortBy: activeSort.by,
    sortDir: activeSort.dir,
    steamId: document.integrations.steamId,
    steamApiKey: credentials.steamApiKey,
    igdbClientId: document.integrations.igdbClientId,
    igdbClientSecret: credentials.igdbClientSecret,
  };
}

export function attachLibraryCompatibility(
  document: LibraryDocumentV2,
  credentials: LibraryCredentials = DEFAULT_CREDENTIALS,
): LibraryDocument {
  const compatible = {
    ...document,
    games: document.games.map(attachLegacyGameFacade),
  } as LibraryDocument;
  Object.defineProperty(compatible, "settings", {
    configurable: true,
    enumerable: false,
    value: settingsFor(document, credentials),
  });
  return compatible;
}

function migrateRawSavedView(raw: unknown): SavedView {
  if (!raw || typeof raw !== "object") return savedViewSchema.parse(raw);
  const source = raw as Record<string, unknown>;
  const filters = source.filters as SavedView["filters"] | undefined;
  const sort = source.sort as SortState | undefined;
  return savedViewSchema.parse({
    displayMode: "list",
    groupBy: "none",
    isDefault: false,
    kind: String(source.id ?? "").startsWith("system:") ? "system" : "custom",
    ...source,
    filters: filters
      ? normalizeSavedViewFilters(filters)
      : { query: "", fields: {} },
    sort: sort ? migrateLegacySort(sort) : { by: "name", dir: "asc" },
  });
}

function migrateV1(
  raw: unknown,
  migratedAt: string,
): SupportedLibraryInput {
  const parsed = libraryDocumentV1Schema.parse(raw);
  const settings = parsed.settings ?? {};
  const normalized = normalizeLegacyGames(parsed.games, parsed.exportedAt ?? migratedAt);
  const rawViews = parsed.savedViews?.map(migrateRawSavedView) ?? [];
  const views = normalizeSavedViews(rawViews, parsed.defaultView);
  const extensions = { ...parsed } as Record<string, unknown>;
  for (const key of ["version", "format", "games", "settings", "savedViews", "defaultView"]) {
    delete extensions[key];
  }
  const preferences = defaultDocumentPreferences();
  const document = libraryDocumentV2Schema.parse({
    ...extensions,
    format: LIBRARY_DOCUMENT_FORMAT,
    version: LIBRARY_DOCUMENT_VERSION,
    exportedAt: parsed.exportedAt ?? migratedAt,
    games: normalized.games,
    ...views,
    franchises: [],
    ...preferences,
    localUi: {
      ...preferences.localUi,
      activeSort: migrateLegacySort({
        by: settings.sortBy ?? "name",
        dir: settings.sortDir ?? "asc",
      }),
    },
    integrations: {
      steamId: settings.steamId ?? "",
      igdbClientId: settings.igdbClientId ?? "",
    },
  }) as LibraryDocumentV2;
  const legacyCredentials = {
    steamApiKey: settings.steamApiKey ?? "",
    igdbClientSecret: settings.igdbClientSecret ?? "",
  };
  const hasLegacyCredentials = Object.values(legacyCredentials).some(Boolean);
  return {
    kind: "supported",
    sourceVersion: 1,
    document: attachLibraryCompatibility(document),
    skipped: normalized.skipped,
    ...(hasLegacyCredentials ? { legacyCredentials } : {}),
  };
}

function migrateBareArray(
  raw: readonly unknown[],
  migratedAt: string,
): SupportedLibraryInput {
  const normalized = normalizeLegacyGames(raw, migratedAt);
  const settings = DEFAULT_SETTINGS;
  const document = buildCanonicalLibraryDocument(
    normalized.games as unknown as readonly GameRecord[],
    settings,
    migratedAt,
  );
  return {
    kind: "supported",
    sourceVersion: "bare-game-array",
    document: attachLibraryCompatibility(document),
    skipped: normalized.skipped,
  };
}

function parseV2(raw: Record<string, unknown>): SupportedLibraryInput {
  const sensitive = raw.sensitive === undefined
    ? undefined
    : sensitiveBackupEnvelopeSchema.parse(raw.sensitive);
  const { games, savedViews, defaultView } = raw;
  const rest = { ...raw };
  for (const key of ["sensitive", "games", "savedViews", "defaultView"]) delete rest[key];
  if (!Array.isArray(games) || !Array.isArray(savedViews)) {
    return libraryDocumentV2Schema.parse(raw) as never;
  }
  const normalizedViews = normalizeSavedViews(
    savedViews.map(migrateRawSavedView),
    typeof defaultView === "string" ? defaultView : undefined,
  );
  const document = libraryDocumentV2Schema.parse({
    ...rest,
    games: normalizeV2Games(games),
    ...normalizedViews,
  }) as LibraryDocumentV2;
  return {
    kind: "supported",
    sourceVersion: 2,
    document: attachLibraryCompatibility(document),
    skipped: 0,
    ...(sensitive ? { sensitive } : {}),
  };
}

export function inspectLibraryInput(
  raw: unknown,
  options?: { now?: string },
): LibraryInputInspection {
  const migratedAt = nowFrom(options);
  if (Array.isArray(raw)) return migrateBareArray(raw, migratedAt);
  if (!raw || typeof raw !== "object") return migrateV1(raw, migratedAt);
  const source = raw as Record<string, unknown>;
  if (typeof source.version === "number" && source.version > LIBRARY_DOCUMENT_VERSION) {
    return { kind: "unsupported-version", version: source.version, raw };
  }
  if (source.version === 1) return migrateV1(raw, migratedAt);
  if (source.version === 2) return parseV2(source);
  return migrateV1(raw, migratedAt);
}

export function parseLibraryDocument(
  raw: unknown,
  options?: { now?: string },
): Omit<SupportedLibraryInput, "kind" | "sourceVersion"> & {
  sourceVersion: LibraryInputSource;
} {
  const inspected = inspectLibraryInput(raw, options);
  if (inspected.kind === "unsupported-version") {
    throw new UnsupportedLibraryVersionError(inspected.version, inspected.raw);
  }
  return {
    sourceVersion: inspected.sourceVersion,
    document: inspected.document,
    skipped: inspected.skipped,
    ...(inspected.legacyCredentials
      ? { legacyCredentials: inspected.legacyCredentials }
      : {}),
    ...(inspected.sensitive ? { sensitive: inspected.sensitive } : {}),
  };
}

export function buildCanonicalLibraryDocument(
  games: readonly GameRecord[],
  settings: LibrarySettings,
  exportedAt = new Date().toISOString(),
  base?: LibraryDocumentV2,
): LibraryDocumentV2 {
  const preferences = defaultDocumentPreferences();
  const views = normalizeSavedViews(base?.savedViews ?? [], base?.defaultView);
  return libraryDocumentV2Schema.parse({
    ...(base ?? {}),
    format: LIBRARY_DOCUMENT_FORMAT,
    version: LIBRARY_DOCUMENT_VERSION,
    exportedAt,
    games: gamesFromRuntime(games),
    ...views,
    franchises: base?.franchises ?? [],
    theme: base?.theme ?? preferences.theme,
    motion: base?.motion ?? preferences.motion,
    displayMode: base?.displayMode ?? preferences.displayMode,
    groupBy: base?.groupBy ?? preferences.groupBy,
    localUi: {
      ...(base?.localUi ?? preferences.localUi),
      activeSort: migrateLegacySort({ by: settings.sortBy, dir: settings.sortDir }),
    },
    integrations: {
      ...(base?.integrations ?? {}),
      steamId: settings.steamId,
      igdbClientId: settings.igdbClientId,
    },
  }) as LibraryDocumentV2;
}

export function buildLibraryDocument(
  games: readonly GameRecord[],
  settings: LibrarySettings,
  exportedAt?: string,
  base?: LibraryDocumentV2,
): LibraryDocument {
  const canonical = buildCanonicalLibraryDocument(games, settings, exportedAt, base);
  return attachLibraryCompatibility(canonical, {
    steamApiKey: settings.steamApiKey,
    igdbClientSecret: settings.igdbClientSecret,
  });
}

export function canonicalDocumentForWrite(
  document: LibraryDocumentV2,
): LibraryDocumentV2 {
  const root = {
    ...(document as LibraryDocumentV2 & {
    sensitive?: unknown;
    settings?: unknown;
    }),
  };
  delete root.sensitive;
  delete root.settings;
  const views = normalizeSavedViews(document.savedViews, document.defaultView);
  return libraryDocumentV2Schema.parse({
    ...root,
    games: normalizeV2Games(document.games).map((game) =>
      withoutLegacyPriority(game as Record<string, unknown>),
    ),
    ...views,
  }) as LibraryDocumentV2;
}

export function settingsFromSort(
  sort: SortState,
  extras: Omit<LibrarySettings, "sortBy" | "sortDir">,
): LibrarySettings {
  const migrated = migrateLegacySort(sort);
  return { ...extras, sortBy: migrated.by, sortDir: migrated.dir };
}

export function sortFromSettings(
  settings: LibrarySettings,
  games: readonly GameRecord[],
): SortState {
  if (!settings.sortBy) {
    return games.some((game) => game.queuePosition !== null)
      ? { by: "queuePosition", dir: "asc" }
      : { by: "name", dir: "asc" };
  }
  return migrateLegacySort({ by: settings.sortBy, dir: settings.sortDir });
}

export { DEFAULT_SYSTEM_SAVED_VIEW_ID };
