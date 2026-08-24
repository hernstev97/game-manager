import {
  libraryGameV2Schema,
  normalizeGame,
  type GameRecord,
} from "../game-fields";
import type {
  LibraryGameRecordV2,
  TransitionalLibraryGameRecordV2,
} from "../model/shared";
import { normalizeGamePositions } from "../priority";

function positionCandidate(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

export function withoutLegacyPriority(
  game: Record<string, unknown>,
): LibraryGameRecordV2 {
  const canonical = { ...game };
  delete canonical.priority;
  return canonical as LibraryGameRecordV2;
}

export function normalizeLegacyGames(
  rawGames: readonly unknown[],
  migratedAt: string,
): { games: LibraryGameRecordV2[]; skipped: number } {
  const games: LibraryGameRecordV2[] = [];
  let skipped = 0;
  for (const raw of rawGames) {
    const source =
      raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const normalized = normalizeGame(source);
    if (!normalized.name.trim()) {
      skipped += 1;
      continue;
    }
    const priority = positionCandidate(source.priority);
    const rating =
      typeof source.rating === "number" &&
      Number.isFinite(source.rating) &&
      source.rating >= 1 &&
      source.rating <= 10
        ? source.rating
        : normalized.rating;
    const provenance = { ...normalized.provenance };
    if (priority !== null && provenance.queuePosition === undefined) {
      provenance.queuePosition = {
        source: "migration",
        updatedAt: migratedAt,
        sourceRef: "library-v1",
      };
    }
    games.push(
      withoutLegacyPriority({
        ...normalized,
        rating,
        queuePosition: priority,
        favoriteRank: null,
        landscapeArtwork: null,
        caseArtwork: null,
        provenance,
      }),
    );
  }
  return { games: normalizeGamePositions(games), skipped };
}

export function normalizeV2Games(rawGames: readonly unknown[]): LibraryGameRecordV2[] {
  const parsed = rawGames.map((raw) => {
    if (!raw || typeof raw !== "object") {
      return libraryGameV2Schema.parse(raw) as unknown as LibraryGameRecordV2;
    }
    const source = raw as Record<string, unknown>;
    return libraryGameV2Schema.parse({
      ...source,
      queuePosition: positionCandidate(source.queuePosition),
      favoriteRank: positionCandidate(source.favoriteRank),
    }) as unknown as LibraryGameRecordV2;
  });
  return normalizeGamePositions(parsed);
}

export function attachLegacyGameFacade(
  game: LibraryGameRecordV2,
): TransitionalLibraryGameRecordV2 {
  const canonical = withoutLegacyPriority(game as Record<string, unknown>);
  Object.defineProperty(canonical, "priority", {
    configurable: true,
    enumerable: false,
    writable: true,
    value: canonical.queuePosition,
  });
  return canonical as TransitionalLibraryGameRecordV2;
}

export function gamesFromRuntime(
  games: readonly GameRecord[],
): LibraryGameRecordV2[] {
  const canonical = games.map((game) => {
    const normalized = normalizeGame(game);
    return withoutLegacyPriority({
      ...normalized,
      queuePosition: positionCandidate(normalized.queuePosition),
      favoriteRank: positionCandidate(normalized.favoriteRank),
    });
  });
  return normalizeGamePositions(canonical);
}
