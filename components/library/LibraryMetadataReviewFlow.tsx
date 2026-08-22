"use client";

import { MetadataReviewDialog } from "@/components/metadata-review";
import { toast } from "@/components/m3/snackbar";
import { applyMetadataReviews, type MetadataReview } from "@/lib/metadata";
import { getLibrarySnapshotRepository, libraryUndoHistory } from "@/lib/runtime/library-runtime";
import { libraryRepository } from "@/lib/storage";
import { useLibrary } from "@/store/library";

const LARGE_METADATA_BATCH_SIZE = 5;

export function LibraryMetadataReviewFlow() {
  const games = useLibrary((state) => state.games);
  const reviews = useLibrary((state) => state.metadataReviews);
  const reviewIndex = useLibrary((state) => state.metadataReviewIndex);
  const updateReview = useLibrary((state) => state.updateMetadataReview);
  const advanceReview = useLibrary((state) => state.advanceMetadataReview);
  const closeReviews = useLibrary((state) => state.closeMetadataReviews);
  const replaceGames = useLibrary((state) => state.replaceGames);
  const review = reviews[reviewIndex];

  if (!review) return null;

  const confirm = async (confirmed: MetadataReview) => {
    if (reviewIndex < reviews.length - 1) {
      advanceReview(confirmed);
      return;
    }

    const confirmedReviews = reviews.map((item, index) =>
      index === reviewIndex ? confirmed : item,
    );
    const before = libraryRepository.load() ?? libraryRepository.empty();
    try {
      if (confirmedReviews.length >= LARGE_METADATA_BATCH_SIZE) {
        await getLibrarySnapshotRepository().create(
          "before-large-metadata-apply",
          before,
        );
      }
      const appliedAt = new Date().toISOString();
      let afterGames = games;
      const changes = [];
      for (const item of confirmedReviews) {
        const result = applyMetadataReviews(afterGames, [item], {
          transactionId:
            globalThis.crypto?.randomUUID?.() ?? `metadata-${Date.now()}`,
          appliedAt,
        });
        afterGames = result.afterGames.map((game) => ({
          ...game,
          priority: game.queuePosition,
        }));
        changes.push(...result.changes);
      }
      const label =
        confirmedReviews.length === 1
          ? "Metadaten übernehmen"
          : `Metadaten für ${confirmedReviews.length} Spiele übernehmen`;
      replaceGames(
        afterGames.map((game) => ({
          ...game,
          priority: game.queuePosition,
        })),
      );
      const after = libraryRepository.load() ?? libraryRepository.empty();
      libraryUndoHistory.record(
        label,
        before,
        after,
        changes,
      );
      closeReviews();
      toast.success(
        confirmedReviews.length === 1
          ? "Metadaten übernommen."
          : `Metadaten für ${confirmedReviews.length} Spiele übernommen.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Metadaten konnten nicht atomar übernommen werden.",
      );
    }
  };

  return (
    <MetadataReviewDialog
      open
      review={review}
      gameName={games.find((game) => game.id === review.gameId)?.name}
      onReviewChange={updateReview}
      onConfirm={(confirmed) => void confirm(confirmed)}
      onCancel={closeReviews}
    />
  );
}
