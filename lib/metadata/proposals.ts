import type { IgdbGameDetails } from "@/lib/igdb";
import type { ImageCheck, JsonValue, RemoteImageAsset } from "@/lib/model";
import type { SteamAppDetails } from "@/lib/steam";
import type { MetadataProposal, MetadataReviewFieldId } from "./types";

function remoteAsset(
  url: string,
  source: "steam" | "igdb",
  sourceRef: string,
  fetchedAt: string,
  imageCheck?: ImageCheck,
): RemoteImageAsset {
  return {
    url,
    source,
    sourceRef,
    updatedAt: fetchedAt,
    ...(imageCheck ? { imageCheck } : {}),
  };
}

function definedValues(
  entries: ReadonlyArray<readonly [MetadataReviewFieldId, JsonValue | undefined]>,
): Partial<Record<MetadataReviewFieldId, JsonValue>> {
  return Object.fromEntries(
    entries.filter((entry): entry is readonly [MetadataReviewFieldId, JsonValue] =>
      entry[1] !== undefined,
    ),
  );
}

export function createSteamMetadataProposal(
  gameId: string,
  details: SteamAppDetails,
  fetchedAt: string,
  coverImageCheck?: ImageCheck,
): MetadataProposal {
  const sourceRef = String(details.appId);
  const artwork = details.coverUrl
    ? remoteAsset(
        details.coverUrl,
        "steam",
        sourceRef,
        fetchedAt,
        coverImageCheck,
      )
    : undefined;

  return {
    gameId,
    source: "steam",
    sourceRef,
    fetchedAt,
    values: definedValues([
      ["steamAppId", details.appId],
      ["name", details.name],
      ["coverUrl", details.coverUrl || undefined],
      ["landscapeArtwork", artwork as JsonValue | undefined],
      ["released", details.released],
      ["steamPrice", (details.price ?? undefined) as JsonValue | undefined],
    ]),
    ...(coverImageCheck
      ? {
          imageChecks: {
            coverUrl: coverImageCheck,
            landscapeArtwork: coverImageCheck,
          },
        }
      : {}),
  };
}

export function createIgdbMetadataProposal(
  gameId: string,
  details: IgdbGameDetails,
  fetchedAt: string,
  coverImageCheck?: ImageCheck,
): MetadataProposal {
  const sourceRef = String(details.id);
  const caseArtwork = details.coverUrl
    ? remoteAsset(
        details.coverUrl,
        "igdb",
        sourceRef,
        fetchedAt,
        coverImageCheck,
      )
    : undefined;

  return {
    gameId,
    source: "igdb",
    sourceRef,
    fetchedAt,
    values: definedValues([
      ["igdbId", details.id],
      ["name", details.name],
      ["caseArtwork", caseArtwork as JsonValue | undefined],
      ["genres", details.genres.length ? details.genres : undefined],
      ["franchise", details.franchise || undefined],
      ["platforms", details.platforms.length ? details.platforms : undefined],
      ["released", details.released],
      ["steamAppId", details.steamAppId ?? undefined],
    ]),
    ...(coverImageCheck
      ? { imageChecks: { caseArtwork: coverImageCheck } }
      : {}),
  };
}
