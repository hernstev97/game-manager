import {
  LIBRARY_JSON_VERSION,
  normalizeGame,
  type GameRecord,
} from "../game-fields";
import { defaultSortFor, type SortState } from "../filter-games";
import {
  DEFAULT_SETTINGS,
  libraryDocumentSchema,
  type LibraryDocument,
  type LibrarySettings,
} from "./schema";

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

function normalizedGames(rawGames: readonly unknown[]): { games: GameRecord[]; skipped: number } {
  const games: GameRecord[] = [];
  let skipped = 0;
  for (const item of rawGames) {
    const game = normalizeGame(item);
    if (!game.name.trim()) {
      skipped += 1;
      continue;
    }
    games.push(game);
  }
  return { games, skipped };
}

export function parseLibraryDocument(raw: unknown): {
  document: LibraryDocument;
  skipped: number;
} {
  if (Array.isArray(raw)) {
    const normalized = normalizedGames(raw);
    return {
      document: buildLibraryDocument(normalized.games, DEFAULT_SETTINGS),
      skipped: normalized.skipped,
    };
  }

  const parsed = libraryDocumentSchema.parse(raw);
  const normalized = normalizedGames(parsed.games);
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
      games: normalized.games,
    },
    skipped: normalized.skipped,
  };
}
