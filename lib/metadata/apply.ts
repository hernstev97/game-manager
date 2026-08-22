import {
  isoDateTimeSchema,
  type FieldProvenance,
  type JsonValue,
  type LibraryGameRecordV2,
  type UndoChange,
} from "@/lib/model";
import { MetadataReviewError } from "./errors";
import { cloneGame, cloneJson, deepFreeze, jsonEqual } from "./json";
import {
  assertMetadataReview,
  canSelectMetadataChange,
  type MetadataReview,
} from "./review-contract";
import type {
  MetadataAtomicPatch,
  MetadataReviewApplyOptions,
  MetadataReviewApplyResult,
  MetadataReviewFieldId,
} from "./types";

function currentFieldValue(
  game: LibraryGameRecordV2,
  fieldId: MetadataReviewFieldId,
): JsonValue {
  return cloneJson(game[fieldId] ?? null, `game.${fieldId}`);
}

function provenanceEqual(
  left: FieldProvenance | undefined,
  right: FieldProvenance | undefined,
): boolean {
  if (!left || !right) return left === right;
  return jsonEqual(cloneJson(left), cloneJson(right));
}

function preparePatch(
  current: LibraryGameRecordV2,
  review: MetadataReview,
): {
  patch: MetadataAtomicPatch;
  before: LibraryGameRecordV2;
  after: LibraryGameRecordV2;
  change: UndoChange;
} {
  assertMetadataReview(review);
  if (current.id !== review.gameId) {
    throw new MetadataReviewError("stale-review", "Review belongs to a different game");
  }
  const selected = review.metadata.filter((change) => change.selected);
  if (selected.length === 0) {
    throw new MetadataReviewError(
      "no-selection",
      "At least one metadata field must be selected",
    );
  }

  const fields: Record<string, JsonValue> = {};
  const expectedValues: Record<string, JsonValue> = {};
  const expectedProvenance: Record<string, FieldProvenance | null> = {};
  const provenance: Record<string, FieldProvenance> = {};
  for (const change of selected) {
    const key = { fieldId: change.fieldId, source: change.source };
    if (!canSelectMetadataChange(review, key)) {
      throw new MetadataReviewError(
        "invalid-selection",
        `${change.fieldId} is not safely selectable`,
      );
    }
    const actual = currentFieldValue(current, change.fieldId);
    if (
      !jsonEqual(actual, change.currentValue) ||
      !provenanceEqual(
        current.provenance[change.fieldId],
        change.current.provenance,
      )
    ) {
      throw new MetadataReviewError(
        "stale-review",
        `${change.fieldId} changed after the review was created`,
      );
    }
    fields[change.fieldId] = cloneJson(change.incomingValue);
    expectedValues[change.fieldId] = cloneJson(change.currentValue);
    expectedProvenance[change.fieldId] = change.current.provenance
      ? (cloneJson(change.current.provenance) as FieldProvenance)
      : null;
    provenance[change.fieldId] = cloneJson(
      change.proposed.provenance,
    ) as FieldProvenance;
  }

  const before = cloneGame(current);
  const after = cloneGame({
    ...current,
    ...fields,
    provenance: { ...current.provenance, ...provenance },
  });
  if (after.landscapeArtwork?.url !== undefined && after.landscapeArtwork.url !== after.coverUrl) {
    throw new MetadataReviewError(
      "artwork-invariant",
      "landscapeArtwork.url must equal coverUrl after metadata apply",
    );
  }
  const change: UndoChange = {
    entity: "game",
    entityId: current.id,
    before: cloneJson(before),
    after: cloneJson(after),
  };
  return {
    patch: {
      gameId: current.id,
      expectedValues,
      expectedProvenance,
      fields,
      provenance,
    },
    before,
    after,
    change,
  };
}

/**
 * Validates every review before returning any result, so a caller can commit
 * all returned `afterGames` in one repository write.
 */
export function applyMetadataReviews(
  currentGames: readonly LibraryGameRecordV2[],
  reviews: readonly MetadataReview[],
  options: MetadataReviewApplyOptions,
): MetadataReviewApplyResult {
  if (
    !options.transactionId.trim() ||
    !isoDateTimeSchema.safeParse(options.appliedAt).success
  ) {
    throw new MetadataReviewError(
      "invalid-review",
      "Transaction id and valid appliedAt are required",
    );
  }
  if (reviews.length === 0) {
    throw new MetadataReviewError("no-selection", "At least one metadata review is required");
  }
  const reviewByGame = new Map<string, MetadataReview>();
  for (const review of reviews) {
    assertMetadataReview(review);
    if (reviewByGame.has(review.gameId)) {
      throw new MetadataReviewError(
        "invalid-review",
        `Multiple reviews target game ${review.gameId}`,
      );
    }
    reviewByGame.set(review.gameId, review);
  }

  const prepared = reviews.map((review) => {
    const current = currentGames.find((game) => game.id === review.gameId);
    if (!current) {
      throw new MetadataReviewError(
        "stale-review",
        `Game ${review.gameId} no longer exists`,
      );
    }
    return preparePatch(current, review);
  });
  const replacement = new Map(prepared.map((item) => [item.after.id, item.after]));
  const beforeGames = currentGames.map(cloneGame);
  const afterGames = currentGames.map((game) =>
    replacement.has(game.id) ? cloneGame(replacement.get(game.id)!) : cloneGame(game),
  );
  const changes = prepared.map((item) => item.change);
  const transaction = {
    id: options.transactionId,
    label:
      options.label ??
      (reviews.length === 1
        ? "Metadaten übernehmen"
        : `Metadaten für ${reviews.length} Spiele übernehmen`),
    createdAt: options.appliedAt,
    changes,
  };
  return deepFreeze({
    patches: prepared.map((item) => item.patch),
    beforeGames,
    afterGames,
    changes,
    transaction,
  });
}

export function applyMetadataReview(
  current: LibraryGameRecordV2,
  review: MetadataReview,
  options: MetadataReviewApplyOptions,
): MetadataReviewApplyResult {
  return applyMetadataReviews([current], [review], options);
}
