import { z } from "zod";
import {
  DEFINITIVE_BROKEN_IMAGE_CHECK_RESULTS,
  IMAGE_CHECK_RESULTS,
  PROVENANCE_SOURCES,
  TRANSIENT_IMAGE_CHECK_RESULTS,
  type FranchisePresentation,
  type JsonValue,
  type RemoteImageAsset,
} from "./shared";

const ISO_INSTANT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export const isoDateTimeSchema = z.string().refine(
  (value) => ISO_INSTANT.test(value) && !Number.isNaN(Date.parse(value)),
  "Expected an ISO-8601 instant with a timezone",
);

export const remoteHttpUrlSchema = z.string().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}, "Expected an absolute http(s) URL");

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

export const provenanceSourceSchema = z.enum(PROVENANCE_SOURCES);

export const fieldProvenanceSchema = z
  .object({
    source: provenanceSourceSchema,
    updatedAt: isoDateTimeSchema,
    sourceRef: z.string().optional(),
  })
  .passthrough();

export const fieldProvenanceMapSchema = z.record(
  z.string(),
  fieldProvenanceSchema,
);

export const imageCheckResultSchema = z.enum(IMAGE_CHECK_RESULTS);

export const imageCheckSchema = z
  .object({
    checkedAt: isoDateTimeSchema,
    result: imageCheckResultSchema,
  })
  .passthrough();

function validateFocalPointPair(
  value: { focalPointX?: number; focalPointY?: number },
  context: z.core.$RefinementCtx,
): void {
  if ((value.focalPointX === undefined) !== (value.focalPointY === undefined)) {
    context.addIssue({
      code: "custom",
      message: "focalPointX and focalPointY must be provided together",
    });
  }
}

export const remoteImageAssetSchema: z.ZodType<RemoteImageAsset> = z
  .object({
    url: remoteHttpUrlSchema,
    source: provenanceSourceSchema,
    updatedAt: isoDateTimeSchema,
    sourceRef: z.string().optional(),
    focalPointX: z.number().finite().min(0).max(1).optional(),
    focalPointY: z.number().finite().min(0).max(1).optional(),
    zoom: z.number().finite().min(1).optional(),
    imageCheck: imageCheckSchema.optional(),
  })
  .passthrough()
  .superRefine(validateFocalPointPair) as z.ZodType<RemoteImageAsset>;

export const franchisePresentationSchema: z.ZodType<FranchisePresentation> = z
  .object({
    franchise: z.string().trim().min(1),
    backgroundUrl: remoteHttpUrlSchema.optional(),
    focalPointX: z.number().finite().min(0).max(1).optional(),
    focalPointY: z.number().finite().min(0).max(1).optional(),
    overlayStrength: z.number().finite().min(0).max(1).optional(),
    source: provenanceSourceSchema.optional(),
    updatedAt: isoDateTimeSchema.optional(),
    sourceRef: z.string().optional(),
    imageCheck: imageCheckSchema.optional(),
  })
  .passthrough()
  .superRefine(validateFocalPointPair) as z.ZodType<FranchisePresentation>;

export function isDefinitivelyBrokenImageCheck(value: unknown): boolean {
  const parsed = imageCheckSchema.safeParse(value);
  return (
    parsed.success &&
    DEFINITIVE_BROKEN_IMAGE_CHECK_RESULTS.includes(
      parsed.data.result as (typeof DEFINITIVE_BROKEN_IMAGE_CHECK_RESULTS)[number],
    )
  );
}

export function isTransientImageCheck(value: unknown): boolean {
  const parsed = imageCheckSchema.safeParse(value);
  return (
    parsed.success &&
    TRANSIENT_IMAGE_CHECK_RESULTS.includes(
      parsed.data.result as (typeof TRANSIENT_IMAGE_CHECK_RESULTS)[number],
    )
  );
}
