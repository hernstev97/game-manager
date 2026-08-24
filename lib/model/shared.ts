import type { Game, GameRecord } from "../game-fields";

export type IsoDateTime = string;
export type RemoteHttpUrl = string;

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;
export type JsonObject = { [key: string]: JsonValue };

/** Known v2 properties plus opaque keys owned by a later document version. */
export type Passthrough<T extends object> = T & Record<string, unknown>;

export const PROVENANCE_SOURCES = [
  "manual",
  "steam",
  "igdb",
  "import",
  "migration",
] as const;

export type ProvenanceSource = (typeof PROVENANCE_SOURCES)[number];

export type FieldProvenance = Passthrough<{
  source: ProvenanceSource;
  updatedAt: IsoDateTime;
  sourceRef?: string;
}>;

/** Missing keys mean that the value predates field-level provenance. */
export type FieldProvenanceMap = {
  [fieldId: string]: FieldProvenance;
};

export const IMAGE_CHECK_RESULTS = [
  "ok",
  "not-found",
  "invalid-content",
  "offline",
  "timeout",
  "network-error",
  "rate-limited",
  "blocked",
] as const;

export type ImageCheckResult = (typeof IMAGE_CHECK_RESULTS)[number];

export const DEFINITIVE_BROKEN_IMAGE_CHECK_RESULTS = [
  "not-found",
  "invalid-content",
] as const satisfies readonly ImageCheckResult[];

export const TRANSIENT_IMAGE_CHECK_RESULTS = [
  "offline",
  "timeout",
  "network-error",
  "rate-limited",
  "blocked",
] as const satisfies readonly ImageCheckResult[];

export type ImageCheck = Passthrough<{
  checkedAt: IsoDateTime;
  result: ImageCheckResult;
}>;

/**
 * Exportable remote artwork. v2 accepts only http(s) URLs; blob:, data: and
 * device-local paths are invalid at the persistence boundary.
 */
export type RemoteImageAsset = Passthrough<{
  url: RemoteHttpUrl;
  source: ProvenanceSource;
  updatedAt: IsoDateTime;
  sourceRef?: string;
  focalPointX?: number;
  focalPointY?: number;
  zoom?: number;
  imageCheck?: ImageCheck;
}>;

export type LibraryGameV2Fields = {
  /** Independent, contiguous 1-based queue order; null means not queued. */
  queuePosition: number | null;
  /** Independent, contiguous 1-based favorites order; null means not favored. */
  favoriteRank: number | null;
  /** Metadata/selection bridge for coverUrl; its URL mirrors coverUrl when set. */
  landscapeArtwork: RemoteImageAsset | null;
  /** Portrait/case artwork. The existing coverUrl remains the landscape header. */
  caseArtwork: RemoteImageAsset | null;
  provenance: FieldProvenanceMap;
};

/** Canonical v2 game shape. Legacy priority may survive only as an opaque key. */
export type LibraryGameRecordV2 = Passthrough<
  Omit<Game, "priority"> & LibraryGameV2Fields
>;

/** Temporary F1 bridge while the field registry still exposes v1 GameRecord. */
export type TransitionalLibraryGameRecordV2 = GameRecord & LibraryGameV2Fields;

export type FranchisePresentation = Passthrough<{
  franchise: string;
  backgroundUrl?: RemoteHttpUrl;
  focalPointX?: number;
  focalPointY?: number;
  overlayStrength?: number;
  source?: ProvenanceSource;
  updatedAt?: IsoDateTime;
  sourceRef?: string;
  imageCheck?: ImageCheck;
}>;

export const POSITION_FIELDS = ["queuePosition", "favoriteRank"] as const;
export type PositionField = (typeof POSITION_FIELDS)[number];

export const POSITION_NORMALIZATION_ORDER = [
  "positiveFiniteValue",
  "documentOrder",
  "gameId",
] as const;
