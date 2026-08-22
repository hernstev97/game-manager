import { fieldById } from "@/lib/game-fields";
import type { FranchisePresentation } from "@/lib/model/shared";

export const FRANCHISE_GROUPING_FALLBACK_MIN_COUNT = 2;

export type FranchiseGame = {
  franchise: unknown;
};

export type FranchiseSection<T> =
  | {
      kind: "franchise";
      key: string;
      name: string;
      games: T[];
      visibleCount: number;
      presentation?: FranchisePresentation;
    }
  | {
      kind: "remainder";
      key: "without-franchise";
      name: "Ohne Franchise";
      games: T[];
      visibleCount: number;
    }
  | {
      kind: "ungrouped";
      key: string;
      games: T[];
    };

/** Read grouping's threshold from the same registry field used by filtering. */
export function franchiseGroupingMinCount(): number {
  const configured = fieldById("franchise")?.filterMinCount;
  return typeof configured === "number" && Number.isFinite(configured) && configured > 0
    ? configured
    : FRANCHISE_GROUPING_FALLBACK_MIN_COUNT;
}

/** Canonical identity from the v2 contract; display casing remains untouched. */
export function canonicalFranchiseIdentity(name: string): string {
  return name.trim().normalize("NFKC").toLocaleLowerCase("de-DE");
}

function franchiseName(game: FranchiseGame): string {
  return typeof game.franchise === "string" ? game.franchise.trim().normalize("NFKC") : "";
}

/** Match presentation records with the same canonical identity as grouped games. */
export function findFranchisePresentation(
  presentations: readonly FranchisePresentation[],
  franchise: string,
): FranchisePresentation | undefined {
  const key = canonicalFranchiseIdentity(franchise);
  return presentations.find(
    (presentation) => canonicalFranchiseIdentity(presentation.franchise) === key,
  );
}

/**
 * Group already filtered/sorted games. Section order follows the first visible
 * occurrence and order inside every section remains identical to the input.
 */
export function groupVisibleGamesByFranchise<T extends FranchiseGame>(
  games: readonly T[],
  presentations: readonly FranchisePresentation[] = [],
  minimum = franchiseGroupingMinCount(),
): FranchiseSection<T>[] {
  const threshold = Math.max(1, Math.floor(minimum));
  const counts = new Map<string, number>();
  const displayNames = new Map<string, string>();
  const gamesByKey = new Map<string, T[]>();
  const remainder: T[] = [];

  for (const game of games) {
    const name = franchiseName(game);
    if (!name) {
      remainder.push(game);
      continue;
    }
    const key = canonicalFranchiseIdentity(name);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (!displayNames.has(key)) displayNames.set(key, name);
    const matching = gamesByKey.get(key);
    if (matching) matching.push(game);
    else gamesByKey.set(key, [game]);
  }

  const sections: FranchiseSection<T>[] = [];
  const emitted = new Set<string>();
  let ungrouped: T[] = [];
  let ungroupedIndex = 0;
  let emittedRemainder = false;
  const flushUngrouped = () => {
    if (ungrouped.length === 0) return;
    sections.push({ kind: "ungrouped", key: `ungrouped-${ungroupedIndex++}`, games: ungrouped });
    ungrouped = [];
  };

  for (const game of games) {
    const name = franchiseName(game);
    if (!name) {
      flushUngrouped();
      if (!emittedRemainder && remainder.length > 0) {
        sections.push({
          kind: "remainder",
          key: "without-franchise",
          name: "Ohne Franchise",
          games: remainder,
          visibleCount: remainder.length,
        });
        emittedRemainder = true;
      }
      continue;
    }

    const key = canonicalFranchiseIdentity(name);
    if ((counts.get(key) ?? 0) < threshold) {
      ungrouped.push(game);
      continue;
    }

    flushUngrouped();
    if (emitted.has(key)) continue;
    emitted.add(key);
    const groupedGames = gamesByKey.get(key) ?? [];
    if (groupedGames.length === 0) continue;
    const displayName = displayNames.get(key) ?? name;
    sections.push({
      kind: "franchise",
      key,
      name: displayName,
      games: groupedGames,
      visibleCount: groupedGames.length,
      presentation: findFranchisePresentation(presentations, displayName),
    });
  }
  flushUngrouped();
  return sections;
}
