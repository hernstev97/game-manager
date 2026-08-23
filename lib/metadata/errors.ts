export type MetadataReviewErrorCode =
  | "invalid-review"
  | "invalid-proposal"
  | "invalid-selection"
  | "no-selection"
  | "stale-review"
  | "artwork-invariant";

export class MetadataReviewError extends Error {
  constructor(
    readonly code: MetadataReviewErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "MetadataReviewError";
  }
}
