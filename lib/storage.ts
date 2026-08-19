import { z } from "zod";
import {
  LIBRARY_JSON_VERSION,
  normalizeGame,
  type GameRecord,
} from "./game-fields";
import { defaultSortFor, type SortState } from "./filter-games";

export const LIBRARY_STORAGE_KEY = "game-library.v1";

export type LibrarySettings = {
  sortBy: string;
  sortDir: "asc" | "desc";
  steamId: string;
  steamApiKey: string;
  igdbClientId: string;
  igdbClientSecret: string;
};

export type LibraryDocument = {
  version: number;
  exportedAt: string;
  settings: LibrarySettings;
  games: GameRecord[];
};

export const DEFAULT_SETTINGS: LibrarySettings = {
  sortBy: "name",
  sortDir: "asc",
  steamId: "",
  steamApiKey: "",
  igdbClientId: "",
  igdbClientSecret: "",
};

const settingsSchema = z
  .object({
    sortBy: z.string().catch("name"),
    sortDir: z.enum(["asc", "desc"]).catch("asc"),
    steamId: z.string().catch(""),
    steamApiKey: z.string().catch(""),
    igdbClientId: z.string().catch(""),
    igdbClientSecret: z.string().catch(""),
  })
  .passthrough();

export const libraryDocumentSchema = z
  .object({
    version: z.number().int().positive().catch(LIBRARY_JSON_VERSION),
    exportedAt: z.string().optional(),
    settings: settingsSchema.catch(DEFAULT_SETTINGS),
    games: z.array(z.unknown()).catch([]),
  })
  .passthrough();

export function settingsFromSort(
  sort: SortState,
  extras: Omit<LibrarySettings, "sortBy" | "sortDir">,
): LibrarySettings {
  return {
    sortBy: sort.by,
    sortDir: sort.dir,
    steamId: extras.steamId,
    steamApiKey: extras.steamApiKey,
    igdbClientId: extras.igdbClientId,
    igdbClientSecret: extras.igdbClientSecret,
  };
}

export function sortFromSettings(settings: LibrarySettings, games: readonly GameRecord[]): SortState {
  if (!settings.sortBy) return defaultSortFor(games);
  return { by: settings.sortBy, dir: settings.sortDir };
}

export function buildLibraryDocument(
  games: readonly GameRecord[],
  settings: LibrarySettings,
  exportedAt = new Date().toISOString(),
): LibraryDocument {
  return {
    version: LIBRARY_JSON_VERSION,
    exportedAt,
    settings: {
      sortBy: settings.sortBy,
      sortDir: settings.sortDir,
      steamId: settings.steamId,
      steamApiKey: settings.steamApiKey,
      igdbClientId: settings.igdbClientId,
      igdbClientSecret: settings.igdbClientSecret,
    },
    games: games.map((game) => ({ ...game })),
  };
}

export function parseLibraryDocument(raw: unknown): {
  document: LibraryDocument;
  skipped: number;
} {
  if (Array.isArray(raw)) {
    const games: GameRecord[] = [];
    let skipped = 0;
    for (const item of raw) {
      const game = normalizeGame(item);
      if (!game.name.trim()) {
        skipped += 1;
        continue;
      }
      games.push(game);
    }
    return {
      document: buildLibraryDocument(games, DEFAULT_SETTINGS),
      skipped,
    };
  }

  const parsed = libraryDocumentSchema.parse(raw);
  const games: GameRecord[] = [];
  let skipped = 0;
  for (const item of parsed.games) {
    const game = normalizeGame(item);
    if (!game.name.trim()) {
      skipped += 1;
      continue;
    }
    games.push(game);
  }

  const settings: LibrarySettings = {
    sortBy: parsed.settings.sortBy || "name",
    sortDir: parsed.settings.sortDir,
    steamId: parsed.settings.steamId,
    steamApiKey: parsed.settings.steamApiKey,
    igdbClientId: parsed.settings.igdbClientId,
    igdbClientSecret: parsed.settings.igdbClientSecret,
  };

  return {
    document: {
      version: parsed.version,
      exportedAt: parsed.exportedAt ?? new Date().toISOString(),
      settings,
      games,
    },
    skipped,
  };
}

export function loadLibraryDocument(): LibraryDocument | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LIBRARY_STORAGE_KEY);
  if (!raw) return null;
  const { document } = parseLibraryDocument(JSON.parse(raw));
  return document;
}

export function saveLibraryDocument(document: LibraryDocument) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(document));
}

export function emptyLibraryDocument(): LibraryDocument {
  return buildLibraryDocument([], DEFAULT_SETTINGS);
}
