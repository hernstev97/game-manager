import { z } from "zod";
import {
  LIBRARY_JSON_VERSION,
  normalizeGame,
  type GameRecord,
} from "./game-fields";
import { defaultSortFor, type SortState } from "./filter-games";
import { SEED_GAMES } from "./seed-games";

export const LIBRARY_STORAGE_KEY = "game-library.v1";

export type LibrarySettings = {
  sortBy: string;
  sortDir: "asc" | "desc";
  steamId: string;
  steamApiKey: string;
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
};

const settingsSchema = z
  .object({
    sortBy: z.string().catch("name"),
    sortDir: z.enum(["asc", "desc"]).catch("asc"),
    steamId: z.string().catch(""),
    steamApiKey: z.string().catch(""),
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

export function settingsFromSort(sort: SortState, steam: Pick<LibrarySettings, "steamId" | "steamApiKey">): LibrarySettings {
  return {
    sortBy: sort.by,
    sortDir: sort.dir,
    steamId: steam.steamId,
    steamApiKey: steam.steamApiKey,
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
  try {
    const { document } = parseLibraryDocument(JSON.parse(raw));
    return document;
  } catch {
    return null;
  }
}

export function saveLibraryDocument(document: LibraryDocument) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(document));
}

export function seedLibraryDocument(): LibraryDocument {
  const games = SEED_GAMES.map((game) => ({ ...game }));
  const sort = defaultSortFor(games);
  return buildLibraryDocument(games, {
    ...DEFAULT_SETTINGS,
    sortBy: sort.by,
    sortDir: sort.dir,
  });
}
