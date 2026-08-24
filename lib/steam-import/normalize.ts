import type {
  NormalizedSteamImportGame,
  SteamImportInputGame,
  SteamLibraryNormalizationResult,
  SteamNormalizationIssue,
} from "./types";

function positiveInteger(value: unknown): number | null {
  const parsed =
    typeof value === "string" && /^\d+$/.test(value.trim())
      ? Number(value.trim())
      : value;
  return typeof parsed === "number" &&
    Number.isSafeInteger(parsed) &&
    parsed > 0
    ? parsed
    : null;
}

function playtime(value: unknown): number | null | "invalid" {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "string" ? Number(value.trim()) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) && parsed >= 0
    ? Math.floor(parsed)
    : "invalid";
}

function sourceGames(payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return null;
  const games = (payload as { games?: unknown }).games;
  return Array.isArray(games) ? games : null;
}

function sameIdentity(
  left: NormalizedSteamImportGame,
  right: NormalizedSteamImportGame,
): boolean {
  return (
    (left.igdbId === null || right.igdbId === null || left.igdbId === right.igdbId) &&
    left.name.normalize("NFKC").toLocaleLowerCase("de-DE") ===
      right.name.normalize("NFKC").toLocaleLowerCase("de-DE")
  );
}

/**
 * Accepts only the public owned-games shape. Unknown properties are ignored so
 * credentials or response diagnostics can never enter plans, jobs or reports.
 */
export function normalizeSteamLibrary(
  payload: unknown,
): SteamLibraryNormalizationResult {
  const rawGames = sourceGames(payload);
  if (!rawGames) {
    return {
      games: [],
      issues: [
        {
          code: "invalid-payload",
          severity: "error",
          message: "Die geladene Steam-Bibliothek hat kein gültiges Spiele-Array.",
        },
      ],
      received: 0,
      rejected: 0,
    };
  }

  const issues: SteamNormalizationIssue[] = [];
  const byAppId = new Map<number, NormalizedSteamImportGame>();
  const blockedAppIds = new Set<number>();
  let rejected = 0;

  rawGames.forEach((raw, index) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      issues.push({
        code: "invalid-entry",
        index,
        severity: "error",
        message: "Ein Steam-Eintrag ist kein gültiges Objekt.",
      });
      rejected += 1;
      return;
    }

    const input = raw as SteamImportInputGame;
    const steamAppId = positiveInteger(
      input.appId ?? input.appid ?? input.steamAppId,
    );
    if (steamAppId === null) {
      issues.push({
        code: "invalid-app-id",
        index,
        severity: "error",
        message: "Ein Steam-Eintrag hat keine gültige positive App-ID.",
      });
      rejected += 1;
      return;
    }

    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name) {
      issues.push({
        code: "missing-name",
        index,
        steamAppId,
        severity: "error",
        message: `Steam App ${steamAppId} hat keinen Namen und wurde ausgelassen.`,
      });
      rejected += 1;
      return;
    }

    const normalizedPlaytime = playtime(
      input.playtimeMinutes ?? input.playtime_forever,
    );
    if (normalizedPlaytime === "invalid") {
      issues.push({
        code: "invalid-playtime",
        index,
        steamAppId,
        severity: "warning",
        message: `Die Spielzeit von Steam App ${steamAppId} ist ungültig und wird nicht übernommen.`,
      });
    }

    const normalized: NormalizedSteamImportGame = {
      steamAppId,
      name,
      playtimeMinutes:
        normalizedPlaytime === "invalid" ? null : normalizedPlaytime,
      igdbId: positiveInteger(input.igdbId),
    };
    const previous = byAppId.get(steamAppId);
    if (!previous) {
      byAppId.set(steamAppId, normalized);
      return;
    }

    if (!sameIdentity(previous, normalized)) {
      byAppId.delete(steamAppId);
      blockedAppIds.add(steamAppId);
      issues.push({
        code: "conflicting-duplicate",
        index,
        steamAppId,
        severity: "error",
        message: `Mehrere widersprüchliche Einträge verwenden Steam App-ID ${steamAppId}; sie wurden ausgelassen.`,
      });
      rejected += 2;
      return;
    }

    const playtimes = [previous.playtimeMinutes, normalized.playtimeMinutes].filter(
      (value): value is number => value !== null,
    );
    byAppId.set(steamAppId, {
      ...previous,
      playtimeMinutes: playtimes.length ? Math.max(...playtimes) : null,
      igdbId: previous.igdbId ?? normalized.igdbId,
    });
    issues.push({
      code: "duplicate-app-id",
      index,
      steamAppId,
      severity: "warning",
      message: `Doppelter Eintrag für Steam App-ID ${steamAppId} wurde zusammengeführt.`,
    });
    rejected += 1;
  });

  for (const appId of blockedAppIds) byAppId.delete(appId);
  return {
    games: [...byAppId.values()].sort(
      (left, right) => left.steamAppId - right.steamAppId,
    ),
    issues,
    received: rawGames.length,
    rejected: Math.min(rawGames.length, rejected),
  };
}
