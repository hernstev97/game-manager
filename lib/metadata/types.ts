import type {
  FieldProvenance,
  FieldProvenanceMap,
  ImageCheck,
  JsonValue,
  LibraryGameRecordV2,
  MetadataFieldChange,
  UndoChange,
  UndoTransaction,
} from "@/lib/model";

export const METADATA_REVIEW_SOURCES = ["steam", "igdb"] as const;
export type MetadataReviewSource = (typeof METADATA_REVIEW_SOURCES)[number];

export const STEAM_METADATA_FIELD_IDS = [
  "steamAppId",
  "name",
  "coverUrl",
  "landscapeArtwork",
  "released",
  "steamPrice",
] as const;

export const IGDB_METADATA_FIELD_IDS = [
  "igdbId",
  "name",
  "caseArtwork",
  "genres",
  "franchise",
  "platforms",
  "released",
  "steamAppId",
] as const;

export type MetadataReviewFieldId =
  | (typeof STEAM_METADATA_FIELD_IDS)[number]
  | (typeof IGDB_METADATA_FIELD_IDS)[number];

export type MetadataProposal = {
  gameId: string;
  source: MetadataReviewSource;
  sourceRef: string;
  fetchedAt: string;
  values: Readonly<Partial<Record<MetadataReviewFieldId, JsonValue>>>;
  imageChecks?: Readonly<Partial<Record<MetadataReviewFieldId, ImageCheck>>>;
};

export const METADATA_REVIEW_WARNING_CODES = [
  "empty-or-invalid-proposal",
  "manual-value-protected",
  "existing-value-review-required",
  "cover-review-required",
  "image-definitively-broken",
  "image-check-inconclusive",
  "image-not-checked",
  "volatile-price-separated",
  "paired-artwork-required",
] as const;

export type MetadataReviewWarningCode =
  (typeof METADATA_REVIEW_WARNING_CODES)[number];

export type MetadataReviewWarning = {
  code: MetadataReviewWarningCode;
  severity: "info" | "warning" | "error";
  message: string;
};

/**
 * UI-ready extension of the normative MetadataFieldChange contract. The
 * aliases are intentional: callers can render a review without reaching into
 * the persistence-oriented snapshots.
 */
export type MetadataReviewFieldChange = MetadataFieldChange & {
  fieldId: MetadataReviewFieldId;
  currentValue: JsonValue;
  incomingValue: JsonValue;
  source: MetadataReviewSource;
  selected: boolean;
  warning: MetadataReviewWarning | null;
};

export type MetadataReviewBaseline = {
  values: Readonly<Record<string, JsonValue>>;
  provenance: Readonly<FieldProvenanceMap>;
};

export type MetadataReviewSelectionKey = {
  fieldId: MetadataReviewFieldId;
  source: MetadataReviewSource;
};

export type MetadataAtomicPatch = {
  gameId: string;
  expectedValues: Readonly<Record<string, JsonValue>>;
  expectedProvenance: Readonly<Record<string, FieldProvenance | null>>;
  fields: Readonly<Record<string, JsonValue>>;
  provenance: Readonly<Record<string, FieldProvenance>>;
};

export type MetadataReviewApplyOptions = {
  transactionId: string;
  appliedAt: string;
  label?: string;
};

export type MetadataReviewApplyResult = {
  patches: readonly MetadataAtomicPatch[];
  beforeGames: readonly LibraryGameRecordV2[];
  afterGames: readonly LibraryGameRecordV2[];
  changes: readonly UndoChange[];
  transaction: UndoTransaction;
};
