import type {
  FieldProvenance,
  ImageCheck,
  JsonValue,
  Passthrough,
} from "./shared";

export const METADATA_CHANGE_CATEGORIES = [
  "metadata",
  "cover",
  "volatile-price",
] as const;

export type MetadataChangeCategory =
  (typeof METADATA_CHANGE_CATEGORIES)[number];

export const COVER_METADATA_FIELD_IDS = [
  "coverUrl",
  "landscapeArtwork",
  "caseArtwork",
] as const;
export const VOLATILE_METADATA_FIELD_IDS = ["steamPrice"] as const;

export const METADATA_DEFAULT_SELECTION_REASONS = [
  "empty-target",
  "empty-proposal",
  "manual-value-protected",
  "nonempty-value-review-required",
  "cover-review-required",
  "defective-cover",
  "volatile-price-separated",
] as const;

export type MetadataDefaultSelectionReason =
  (typeof METADATA_DEFAULT_SELECTION_REASONS)[number];

export type MetadataValueSnapshot = Passthrough<{
  value: JsonValue;
  provenance?: FieldProvenance;
}>;

export type MetadataDefaultSelection = {
  selected: boolean;
  reason: MetadataDefaultSelectionReason;
};

export type MetadataFieldChange = Passthrough<{
  gameId: string;
  fieldId: string;
  category: MetadataChangeCategory;
  current: MetadataValueSnapshot;
  proposed: MetadataValueSnapshot;
  proposedImageCheck?: ImageCheck;
  defaultSelection: MetadataDefaultSelection;
}>;

/** Prices are kept out of the normal metadata selection and apply path. */
export type MetadataChangePreview = Passthrough<{
  metadata: MetadataFieldChange[];
  volatilePrices: MetadataFieldChange[];
}>;

/** Evaluation order is normative and prevents broad rules bypassing safeguards. */
export const METADATA_DEFAULT_SELECTION_ORDER = [
  "empty-proposal",
  "defective-cover",
  "cover-review-required",
  "volatile-price-separated",
  "empty-target",
  "manual-value-protected",
  "nonempty-value-review-required",
] as const satisfies readonly MetadataDefaultSelectionReason[];
