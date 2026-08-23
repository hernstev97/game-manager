import type { LibraryGameRecordV2 } from "@/lib/model";
import type {
  NormalizedSteamImportGame,
  SteamImportCategory,
  SteamImportComparison,
  SteamImportComparisonItem,
} from "./types";

export function normalizeSteamMatchName(name: string): string {
  return name
    .trim()
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("de-DE");
}

function positiveExternalId(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

function uniqueGames(games: readonly LibraryGameRecordV2[]): LibraryGameRecordV2[] {
  return [...new Map(games.map((game) => [game.id, game])).values()];
}

function isAlreadyCurrent(
  source: NormalizedSteamImportGame,
  existing: LibraryGameRecordV2,
): boolean {
  return (
    existing.steamAppId === source.steamAppId &&
    existing.owned === true &&
    (source.playtimeMinutes === null ||
      existing.playtimeMinutes === source.playtimeMinutes) &&
    normalizeSteamMatchName(existing.name) === normalizeSteamMatchName(source.name)
  );
}

function compareOne(
  source: NormalizedSteamImportGame,
  existing: readonly LibraryGameRecordV2[],
): SteamImportComparisonItem {
  const steamMatches = existing.filter(
    (game) => positiveExternalId(game.steamAppId) === source.steamAppId,
  );
  const externalMatches =
    source.igdbId === null
      ? []
      : existing.filter(
          (game) => positiveExternalId(game.igdbId) === source.igdbId,
        );
  const externalCandidates = uniqueGames([...steamMatches, ...externalMatches]);

  if (steamMatches.length > 1) {
    return {
      source,
      category: "conflict",
      reason: "ambiguous-steam-app-id",
      candidateGameIds: externalCandidates.map((game) => game.id),
    };
  }
  if (externalMatches.length > 1) {
    return {
      source,
      category: "conflict",
      reason: "ambiguous-external-id",
      candidateGameIds: externalCandidates.map((game) => game.id),
    };
  }
  if (
    steamMatches.length === 1 &&
    externalMatches.length === 1 &&
    steamMatches[0].id !== externalMatches[0].id
  ) {
    return {
      source,
      category: "conflict",
      reason: "conflicting-external-identities",
      candidateGameIds: externalCandidates.map((game) => game.id),
    };
  }

  const externalMatch = steamMatches[0] ?? externalMatches[0];
  if (externalMatch) {
    if (
      externalMatch.steamAppId !== null &&
      externalMatch.steamAppId !== source.steamAppId
    ) {
      return {
        source,
        category: "conflict",
        reason: "conflicting-external-identities",
        candidateGameIds: [externalMatch.id],
      };
    }
    return {
      source,
      category: isAlreadyCurrent(source, externalMatch)
        ? "already-current"
        : "safely-recognized",
      reason: steamMatches[0] ? "steam-app-id" : "external-id",
      candidateGameIds: [externalMatch.id],
      matchedGameId: externalMatch.id,
    };
  }

  const normalizedName = normalizeSteamMatchName(source.name);
  const nameMatches = existing.filter(
    (game) => normalizeSteamMatchName(game.name) === normalizedName,
  );
  if (nameMatches.length === 1) {
    return {
      source,
      category: "possible-match",
      reason: "normalized-name",
      candidateGameIds: [nameMatches[0].id],
    };
  }
  if (nameMatches.length > 1) {
    return {
      source,
      category: "conflict",
      reason: "ambiguous-name",
      candidateGameIds: nameMatches.map((game) => game.id),
    };
  }
  return {
    source,
    category: "new",
    reason: "no-match",
    candidateGameIds: [],
  };
}

export function compareSteamLibrary(
  source: readonly NormalizedSteamImportGame[],
  existing: readonly LibraryGameRecordV2[],
): SteamImportComparison {
  const items = source.map((game) => compareOne(game, existing));
  const counts = Object.fromEntries(
    ([
      "new",
      "safely-recognized",
      "possible-match",
      "conflict",
      "already-current",
    ] satisfies SteamImportCategory[]).map((category) => [
      category,
      items.filter((item) => item.category === category).length,
    ]),
  ) as Record<SteamImportCategory, number>;
  return { items, counts };
}

export function defaultSteamImportSelection(
  comparison: SteamImportComparison,
): number[] {
  return comparison.items
    .filter(
      (item) =>
        item.category === "new" || item.category === "safely-recognized",
    )
    .map((item) => item.source.steamAppId);
}
