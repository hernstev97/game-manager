import { createMetadataReview } from "@/lib/metadata/review-contract";
import type {
  MetadataProposal,
  MetadataReviewFieldId,
} from "@/lib/metadata/types";
import type { JsonValue, LibraryGameRecordV2 } from "@/lib/model";
import { steamCover } from "@/lib/steam";
import { createSteamImportGame } from "./candidate";
import type { ResolvedSteamTarget } from "./internal";
import { normalizeSteamMatchName } from "./match";
import type { SteamMetadataReviewHandoff } from "./types";

function proposalForTarget(
  target: ResolvedSteamTarget,
  game: LibraryGameRecordV2,
  includeCovers: boolean,
  createdAt: string,
): MetadataProposal | null {
  const values: Partial<Record<MetadataReviewFieldId, JsonValue>> = {};
  if (
    target.existing &&
    normalizeSteamMatchName(target.existing.name) !==
      normalizeSteamMatchName(target.item.source.name)
  ) {
    values.name = target.item.source.name;
  }
  if (includeCovers) {
    const sourceRef = String(target.item.source.steamAppId);
    const coverUrl = steamCover(target.item.source.steamAppId, "header");
    values.coverUrl = coverUrl;
    values.landscapeArtwork = {
      url: coverUrl,
      source: "steam",
      updatedAt: createdAt,
      sourceRef,
    };
  }
  if (Object.keys(values).length === 0) return null;
  return {
    gameId: game.id,
    source: "steam",
    sourceRef: String(target.item.source.steamAppId),
    fetchedAt: createdAt,
    values,
  };
}

/** Builds F7 proposals and a model-level preview without applying metadata. */
export function createSteamReviewHandoff(
  planId: string,
  targets: readonly ResolvedSteamTarget[],
  includeCovers: boolean,
  createdAt: string,
): SteamMetadataReviewHandoff {
  const proposals: MetadataProposal[] = [];
  const metadata = [];
  const volatilePrices = [];
  for (const target of targets) {
    const game =
      target.existing ??
      createSteamImportGame(target.item.source, target.gameId, createdAt);
    const proposal = proposalForTarget(target, game, includeCovers, createdAt);
    if (!proposal) continue;
    const review = createMetadataReview({
      id: `${planId}:${target.gameId}`,
      game,
      proposal,
    });
    proposals.push(proposal);
    metadata.push(...review.metadata);
    volatilePrices.push(...review.volatilePrices);
  }
  return {
    kind: "steam-import-metadata-review",
    importPlanId: planId,
    createdAt,
    gameIds: proposals.map((proposal) => proposal.gameId),
    proposals,
    preview: { metadata, volatilePrices },
    requiresExplicitConfirmation: true,
  };
}
