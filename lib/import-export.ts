import type { GameRecord } from "./game-fields";
import {
  buildLibraryDocument,
  parseLibraryDocument,
  type LibraryDocument,
  type LibrarySettings,
} from "./storage";

export type ImportResult = {
  document: LibraryDocument;
  added: number;
  updated: number;
  skipped: number;
};

export function findExistingGame(
  existing: readonly GameRecord[],
  incoming: GameRecord,
): GameRecord | undefined {
  const byId = existing.find((game) => game.id === incoming.id);
  if (byId) return byId;
  if (incoming.steamAppId != null) {
    const bySteam = existing.find((game) => game.steamAppId === incoming.steamAppId);
    if (bySteam) return bySteam;
  }
  if (incoming.igdbId != null) {
    const byIgdb = existing.find((game) => game.igdbId === incoming.igdbId);
    if (byIgdb) return byIgdb;
  }
  return existing.find((game) => game.name === incoming.name);
}

export function mergeImportedGames(
  current: readonly GameRecord[],
  incoming: readonly GameRecord[],
): { games: GameRecord[]; added: number; updated: number } {
  const games = current.map((game) => ({ ...game }));
  let added = 0;
  let updated = 0;

  for (const next of incoming) {
    const match = findExistingGame(games, next);
    if (match) {
      const index = games.findIndex((game) => game.id === match.id);
      games[index] = { ...next, id: match.id };
      updated += 1;
    } else {
      games.push({ ...next });
      added += 1;
    }
  }

  return { games, added, updated };
}

export function importLibraryPayload(
  raw: unknown,
  currentGames: readonly GameRecord[],
  currentSettings: LibrarySettings,
): ImportResult {
  const { document, skipped } = parseLibraryDocument(raw);
  const merged = mergeImportedGames(currentGames, document.games);
  const settings: LibrarySettings = {
    sortBy: document.settings.sortBy || currentSettings.sortBy,
    sortDir: document.settings.sortDir || currentSettings.sortDir,
    steamId: document.settings.steamId || currentSettings.steamId,
    steamApiKey: document.settings.steamApiKey || currentSettings.steamApiKey,
    igdbClientId: document.settings.igdbClientId || currentSettings.igdbClientId,
    igdbClientSecret: document.settings.igdbClientSecret || currentSettings.igdbClientSecret,
  };
  return {
    document: buildLibraryDocument(merged.games, settings, document.exportedAt),
    added: merged.added,
    updated: merged.updated,
    skipped,
  };
}

export function exportLibraryJson(
  games: readonly GameRecord[],
  settings: LibrarySettings,
): string {
  return `${JSON.stringify(buildLibraryDocument(games, settings), null, 2)}\n`;
}

export function downloadTextFile(filename: string, contents: string, mime = "application/json") {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
