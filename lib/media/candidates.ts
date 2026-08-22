import type { GameRecord } from "@/lib/game-fields";
import { steamCover } from "@/lib/steam";
import type { RemoteImageAsset } from "@/lib/model";
import { normalizeRemoteImageUrl } from "@/lib/media/remote-url";
import type { ArtworkOrientation, MediaCandidate } from "@/lib/media/types";

export type MediaCandidateSources = {
  customPortraitUrl?: string;
  customLandscapeUrl?: string;
  igdbPortraitUrl?: string;
};

function fromAsset(
  id: string,
  label: string,
  orientation: ArtworkOrientation,
  asset: RemoteImageAsset | null,
): MediaCandidate | null {
  const url = asset && normalizeRemoteImageUrl(asset.url);
  return url
    ? {
        id,
        label,
        orientation,
        kind: "existing",
        url,
        source: asset.source,
        sourceRef: asset.sourceRef,
        asset,
      }
    : null;
}

function remoteCandidate(
  id: string,
  label: string,
  orientation: ArtworkOrientation,
  kind: MediaCandidate["kind"],
  rawUrl: string | undefined,
  source: MediaCandidate["source"],
  sourceRef?: string,
): MediaCandidate | null {
  const url = rawUrl && normalizeRemoteImageUrl(rawUrl);
  return url ? { id, label, orientation, kind, url, source, sourceRef } : null;
}

function unique(candidates: Array<MediaCandidate | null>): MediaCandidate[] {
  const urls = new Set<string>();
  return candidates.filter((candidate): candidate is MediaCandidate => {
    if (!candidate) return false;
    if (candidate.url && urls.has(candidate.url)) return false;
    if (candidate.url) urls.add(candidate.url);
    return true;
  });
}

export function buildPortraitCandidates(
  game: GameRecord,
  sources: MediaCandidateSources = {},
): MediaCandidate[] {
  return unique([
    fromAsset("current-case", "Aktuelles Case-Artwork", "portrait", game.caseArtwork),
    remoteCandidate("custom-portrait", "Eigene URL", "portrait", "custom", sources.customPortraitUrl, "manual"),
    remoteCandidate(
      "igdb-portrait",
      "IGDB-Cover",
      "portrait",
      "igdb",
      sources.igdbPortraitUrl,
      "igdb",
      game.igdbId == null ? undefined : String(game.igdbId),
    ),
    fromAsset("landscape-as-portrait", "Landscape-Ausschnitt", "portrait", game.landscapeArtwork),
    remoteCandidate("existing-cover", "Bestehendes Cover", "portrait", "existing", game.coverUrl, "manual"),
    game.steamAppId == null
      ? null
      : remoteCandidate(
          "steam-library",
          "Steam-Bibliothekscover",
          "portrait",
          "steam",
          steamCover(game.steamAppId, "library"),
          "steam",
          String(game.steamAppId),
        ),
    {
      id: "portrait-placeholder",
      label: "Platzhalter",
      orientation: "portrait",
      kind: "placeholder",
      url: null,
      source: "manual",
    },
  ]);
}

export function buildLandscapeCandidates(
  game: GameRecord,
  sources: MediaCandidateSources = {},
): MediaCandidate[] {
  return unique([
    fromAsset("current-landscape", "Aktuelles Landscape-Artwork", "landscape", game.landscapeArtwork),
    remoteCandidate("custom-landscape", "Eigene URL", "landscape", "custom", sources.customLandscapeUrl, "manual"),
    remoteCandidate("existing-cover", "Bestehendes Cover", "landscape", "existing", game.coverUrl, "manual"),
    game.steamAppId == null
      ? null
      : remoteCandidate(
          "steam-header",
          "Steam-Header",
          "landscape",
          "steam",
          steamCover(game.steamAppId, "header"),
          "steam",
          String(game.steamAppId),
        ),
    {
      id: "landscape-placeholder",
      label: "Kein Landscape-Bild",
      orientation: "landscape",
      kind: "placeholder",
      url: null,
      source: "manual",
    },
  ]);
}

export function portraitFallbackUrls(game: GameRecord): string[] {
  return buildPortraitCandidates(game)
    .map((candidate) => candidate.url)
    .filter((url): url is string => url !== null);
}
