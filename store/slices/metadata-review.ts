import type { MetadataReview } from "../../lib/metadata";
import type { LibrarySliceContext } from "./types";

export type MetadataReviewSlice = {
  metadataReviews: readonly MetadataReview[];
  metadataReviewIndex: number;
  queueMetadataReviews: (reviews: readonly MetadataReview[]) => void;
  updateMetadataReview: (review: MetadataReview) => void;
  advanceMetadataReview: (review: MetadataReview) => void;
  closeMetadataReviews: () => void;
};

export function createMetadataReviewSlice({
  set,
}: LibrarySliceContext): MetadataReviewSlice {
  return {
    metadataReviews: [],
    metadataReviewIndex: 0,

    queueMetadataReviews: (reviews) => {
      const reviewable = reviews.filter((review) => review.metadata.length > 0);
      if (reviewable.length === 0) return;
      set((state) => ({
        metadataReviews: [...state.metadataReviews, ...reviewable],
        metadataReviewIndex:
          state.metadataReviews.length === 0 ? 0 : state.metadataReviewIndex,
      }));
    },

    updateMetadataReview: (review) => {
      set((state) => ({
        metadataReviews: state.metadataReviews.map((item, index) =>
          index === state.metadataReviewIndex ? review : item,
        ),
      }));
    },

    advanceMetadataReview: (review) => {
      set((state) => {
        const reviews = state.metadataReviews.map((item, index) =>
          index === state.metadataReviewIndex ? review : item,
        );
        return {
          metadataReviews: reviews,
          metadataReviewIndex: Math.min(
            state.metadataReviewIndex + 1,
            reviews.length - 1,
          ),
        };
      });
    },

    closeMetadataReviews: () =>
      set({ metadataReviews: [], metadataReviewIndex: 0 }),
  };
}
