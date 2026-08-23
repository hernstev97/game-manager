import {
  imageCheckSchema,
  isoDateTimeSchema,
  type JsonValue,
  type LibraryGameRecordV2,
  type MetadataFieldChange,
} from "@/lib/model";
import { createMetadataChange, createReviewBaseline, FIELD_ORDER } from "./change-builder";
import { MetadataReviewError } from "./errors";
import { cloneJson, deepFreeze } from "./json";
import { isUsableIncomingValue } from "./selection-policy";
import {
  IGDB_METADATA_FIELD_IDS,
  STEAM_METADATA_FIELD_IDS,
  type MetadataProposal,
  type MetadataReviewBaseline,
  type MetadataReviewFieldChange,
  type MetadataReviewSelectionKey,
  type MetadataReviewSource,
  type MetadataReviewWarning,
} from "./types";

const REVIEW_BRAND = Symbol("ggrid.metadata-review");
const SOURCE_FIELDS: Record<MetadataReviewSource, ReadonlySet<string>> = {
  steam: new Set(STEAM_METADATA_FIELD_IDS),
  igdb: new Set(IGDB_METADATA_FIELD_IDS),
};

export type MetadataReview = {
  readonly id: string;
  readonly gameId: string;
  readonly source: MetadataReviewSource;
  readonly createdAt: string;
  readonly baseline: MetadataReviewBaseline;
  readonly metadata: readonly MetadataReviewFieldChange[];
  readonly volatilePrices: readonly MetadataReviewFieldChange[];
  readonly [REVIEW_BRAND]: true;
};

function brandReview(
  value: Omit<MetadataReview, typeof REVIEW_BRAND>,
): MetadataReview {
  Object.defineProperty(value, REVIEW_BRAND, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return deepFreeze(value as MetadataReview);
}

export function assertMetadataReview(review: MetadataReview): void {
  if (!review || review[REVIEW_BRAND] !== true || !Object.isFrozen(review)) {
    throw new MetadataReviewError(
      "invalid-review",
      "Metadata may only be applied through an intact review contract",
    );
  }
}

export function createMetadataReview(input: {
  id: string;
  game: LibraryGameRecordV2;
  proposal: MetadataProposal;
}): MetadataReview {
  const proposalValues = input.proposal.values;
  if (
    !input.id.trim() ||
    input.proposal.gameId !== input.game.id ||
    !input.proposal.sourceRef.trim() ||
    !proposalValues ||
    typeof proposalValues !== "object" ||
    Array.isArray(proposalValues)
  ) {
    throw new MetadataReviewError(
      "invalid-proposal",
      "Review id and matching proposal game id are required",
    );
  }
  if (!isoDateTimeSchema.safeParse(input.proposal.fetchedAt).success) {
    throw new MetadataReviewError(
      "invalid-proposal",
      "Proposal fetchedAt must be a valid ISO-8601 instant",
    );
  }

  const allowedFields = SOURCE_FIELDS[input.proposal.source];
  if (!allowedFields) {
    throw new MetadataReviewError(
      "invalid-proposal",
      `Unknown metadata source ${String(input.proposal.source)}`,
    );
  }
  for (const [fieldId, check] of Object.entries(input.proposal.imageChecks ?? {})) {
    if (!(fieldId in proposalValues) || !imageCheckSchema.safeParse(check).success) {
      throw new MetadataReviewError(
        "invalid-proposal",
        `Image check for ${fieldId} is invalid or has no proposed value`,
      );
    }
  }
  const changes: MetadataReviewFieldChange[] = [];
  for (const fieldId of FIELD_ORDER) {
    const value = input.proposal.values[fieldId];
    if (value === undefined) continue;
    if (!allowedFields.has(fieldId)) {
      throw new MetadataReviewError(
        "invalid-proposal",
        `${input.proposal.source} is not allowed to propose ${fieldId}`,
      );
    }
    const change = createMetadataChange(
      input.game,
      input.proposal,
      fieldId,
      value,
    );
    if (change) changes.push(change);
  }
  for (const fieldId of Object.keys(input.proposal.values)) {
    if (!FIELD_ORDER.includes(fieldId as (typeof FIELD_ORDER)[number])) {
      throw new MetadataReviewError(
        "invalid-proposal",
        `Unknown metadata field ${fieldId}`,
      );
    }
  }

  return brandReview({
    id: input.id,
    gameId: input.game.id,
    source: input.proposal.source,
    createdAt: input.proposal.fetchedAt,
    baseline: createReviewBaseline(input.game, input.proposal),
    metadata: changes.filter((change) => change.category !== "volatile-price"),
    volatilePrices: changes.filter(
      (change) => change.category === "volatile-price",
    ),
  });
}

function findMetadataChange(
  review: MetadataReview,
  key: MetadataReviewSelectionKey,
): MetadataReviewFieldChange | undefined {
  return review.metadata.find(
    (change) => change.fieldId === key.fieldId && change.source === key.source,
  );
}

function artworkUrl(value: JsonValue): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return typeof value.url === "string" ? value.url : null;
}

function pairedLandscapeChange(
  review: MetadataReview,
  change: MetadataReviewFieldChange,
): MetadataReviewFieldChange | undefined {
  if (change.fieldId !== "coverUrl" && change.fieldId !== "landscapeArtwork") {
    return undefined;
  }
  const pairId = change.fieldId === "coverUrl" ? "landscapeArtwork" : "coverUrl";
  const pair = review.metadata.find(
    (candidate) => candidate.source === change.source && candidate.fieldId === pairId,
  );
  if (!pair) return undefined;
  const coverUrl =
    change.fieldId === "coverUrl" ? change.incomingValue : pair.incomingValue;
  const landscape =
    change.fieldId === "landscapeArtwork" ? change.incomingValue : pair.incomingValue;
  return typeof coverUrl === "string" && artworkUrl(landscape) === coverUrl
    ? pair
    : undefined;
}

/** A field that already has the proposed URL does not need a duplicate change. */
function landscapePairIsCompatible(
  review: MetadataReview,
  change: MetadataReviewFieldChange,
): boolean {
  if (change.fieldId !== "coverUrl" && change.fieldId !== "landscapeArtwork") {
    return true;
  }
  const pair = pairedLandscapeChange(review, change);
  if (pair) return true;
  if (change.fieldId === "coverUrl") {
    return artworkUrl(review.baseline.values.landscapeArtwork) === change.incomingValue;
  }
  return (
    typeof review.baseline.values.coverUrl === "string" &&
    artworkUrl(change.incomingValue) === review.baseline.values.coverUrl
  );
}

export function canSelectMetadataChange(
  review: MetadataReview,
  key: MetadataReviewSelectionKey,
): boolean {
  assertMetadataReview(review);
  const change = findMetadataChange(review, key);
  if (!change || !isUsableIncomingValue(change.fieldId, change.incomingValue)) {
    return false;
  }
  if (change.fieldId === "coverUrl") {
    const currentLandscape = review.baseline.values.landscapeArtwork;
    if (currentLandscape !== null && !landscapePairIsCompatible(review, change)) {
      return false;
    }
  }
  if (
    change.fieldId === "landscapeArtwork" &&
    change.incomingValue !== null &&
    !landscapePairIsCompatible(review, change)
  ) {
    return false;
  }
  return true;
}

function copyWithSelection(
  review: MetadataReview,
  selectedIds: ReadonlySet<string>,
): MetadataReview {
  return brandReview({
    id: review.id,
    gameId: review.gameId,
    source: review.source,
    createdAt: review.createdAt,
    baseline: cloneJson(review.baseline) as MetadataReviewBaseline,
    metadata: review.metadata.map((change) => ({
      ...change,
      selected: selectedIds.has(change.fieldId),
    })),
    volatilePrices: review.volatilePrices.map((change) => ({
      ...change,
      selected: false,
    })),
  });
}

export function setMetadataChangeSelected(
  review: MetadataReview,
  key: MetadataReviewSelectionKey,
  selected: boolean,
): MetadataReview {
  assertMetadataReview(review);
  const change = findMetadataChange(review, key);
  if (!change) {
    throw new MetadataReviewError(
      "invalid-selection",
      `No reviewable ${key.source} change for ${key.fieldId}`,
    );
  }
  if (selected && !canSelectMetadataChange(review, key)) {
    throw new MetadataReviewError(
      "invalid-selection",
      `${key.fieldId} cannot be selected safely in this review`,
    );
  }
  const ids = new Set(
    review.metadata.filter((item) => item.selected).map((item) => item.fieldId),
  );
  const pair = pairedLandscapeChange(review, change);
  for (const item of pair ? [change, pair] : [change]) {
    if (selected) ids.add(item.fieldId);
    else ids.delete(item.fieldId);
  }
  return copyWithSelection(review, ids);
}

export function selectAllSafeMetadataChanges(review: MetadataReview): MetadataReview {
  assertMetadataReview(review);
  const ids = new Set(
    review.metadata
      .filter(
        (change) =>
          change.defaultSelection.selected &&
          canSelectMetadataChange(review, {
            fieldId: change.fieldId,
            source: change.source,
          }),
      )
      .map((change) => change.fieldId),
  );
  return copyWithSelection(review, ids);
}

export function deselectAllMetadataChanges(review: MetadataReview): MetadataReview {
  assertMetadataReview(review);
  return copyWithSelection(review, new Set());
}

export function metadataChangeWarning(
  review: MetadataReview,
  change: MetadataReviewFieldChange,
): MetadataReviewWarning | null {
  assertMetadataReview(review);
  if (
    (change.fieldId === "coverUrl" || change.fieldId === "landscapeArtwork") &&
    !canSelectMetadataChange(review, {
      fieldId: change.fieldId,
      source: change.source,
    })
  ) {
    return {
      code: "paired-artwork-required",
      severity: "error",
      message: "Landscape-Artwork und Cover-URL müssen gemeinsam mit derselben URL geprüft werden.",
    };
  }
  return change.warning;
}

export function toMetadataFieldChange(
  change: MetadataReviewFieldChange,
): MetadataFieldChange {
  return {
    gameId: change.gameId,
    fieldId: change.fieldId,
    category: change.category,
    current: change.current,
    proposed: change.proposed,
    ...(change.proposedImageCheck
      ? { proposedImageCheck: change.proposedImageCheck }
      : {}),
    defaultSelection: change.defaultSelection,
  };
}
