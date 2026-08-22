import {
  COVER_METADATA_FIELD_IDS,
  DEFINITIVE_BROKEN_IMAGE_CHECK_RESULTS,
  TRANSIENT_IMAGE_CHECK_RESULTS,
  VOLATILE_METADATA_FIELD_IDS,
  remoteImageAssetSchema,
  type FieldProvenance,
  type ImageCheck,
  type JsonValue,
  type MetadataChangeCategory,
  type MetadataDefaultSelection,
} from "@/lib/model";
import { isSteamPriceSnapshot } from "@/lib/steam";
import type {
  MetadataReviewFieldId,
  MetadataReviewWarning,
} from "./types";

export const COVER_FIELDS = new Set<string>(COVER_METADATA_FIELD_IDS);
export const VOLATILE_FIELDS = new Set<string>(VOLATILE_METADATA_FIELD_IDS);
const DEFINITIVE_IMAGE_RESULTS = new Set<string>(
  DEFINITIVE_BROKEN_IMAGE_CHECK_RESULTS,
);
const TRANSIENT_IMAGE_RESULTS = new Set<string>(TRANSIENT_IMAGE_CHECK_RESULTS);

export function isEmptyMetadataValue(value: JsonValue): boolean {
  return (
    value === null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  );
}

function isRemoteHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      Boolean(parsed.hostname)
    );
  } catch {
    return false;
  }
}

export function isUsableIncomingValue(
  fieldId: MetadataReviewFieldId,
  value: JsonValue,
): boolean {
  if (isEmptyMetadataValue(value)) return false;
  switch (fieldId) {
    case "steamAppId":
    case "igdbId":
      return typeof value === "number" && Number.isInteger(value) && value > 0;
    case "name":
    case "franchise":
      return typeof value === "string" && value.trim().length > 0;
    case "coverUrl":
      return typeof value === "string" && isRemoteHttpUrl(value);
    case "landscapeArtwork":
    case "caseArtwork":
      return remoteImageAssetSchema.safeParse(value).success;
    case "released":
      return typeof value === "boolean";
    case "genres":
    case "platforms":
      return (
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((item) => typeof item === "string" && item.trim().length > 0)
      );
    case "steamPrice":
      return isSteamPriceSnapshot(value);
  }
}

export function categoryFor(
  fieldId: MetadataReviewFieldId,
): MetadataChangeCategory {
  if (VOLATILE_FIELDS.has(fieldId)) return "volatile-price";
  if (COVER_FIELDS.has(fieldId)) return "cover";
  return "metadata";
}

function isDefinitivelyBroken(check: ImageCheck | undefined): boolean {
  return Boolean(check && DEFINITIVE_IMAGE_RESULTS.has(check.result));
}

export function evaluateMetadataDefaultSelection(input: {
  fieldId: MetadataReviewFieldId;
  currentValue: JsonValue;
  incomingValue: JsonValue;
  currentProvenance?: FieldProvenance;
  proposedImageCheck?: ImageCheck;
}): MetadataDefaultSelection {
  if (!isUsableIncomingValue(input.fieldId, input.incomingValue)) {
    return { selected: false, reason: "empty-proposal" };
  }
  if (
    COVER_FIELDS.has(input.fieldId) &&
    isDefinitivelyBroken(input.proposedImageCheck)
  ) {
    return { selected: false, reason: "defective-cover" };
  }
  if (COVER_FIELDS.has(input.fieldId)) {
    return { selected: false, reason: "cover-review-required" };
  }
  if (VOLATILE_FIELDS.has(input.fieldId)) {
    return { selected: false, reason: "volatile-price-separated" };
  }
  if (isEmptyMetadataValue(input.currentValue)) {
    return { selected: true, reason: "empty-target" };
  }
  if (input.currentProvenance?.source === "manual") {
    return { selected: false, reason: "manual-value-protected" };
  }
  return { selected: false, reason: "nonempty-value-review-required" };
}

export function warningForSelection(input: {
  fieldId: MetadataReviewFieldId;
  currentValue: JsonValue;
  incomingValue: JsonValue;
  currentProvenance?: FieldProvenance;
  imageCheck?: ImageCheck;
  selection: MetadataDefaultSelection;
}): MetadataReviewWarning | null {
  if (!isUsableIncomingValue(input.fieldId, input.incomingValue)) {
    return {
      code: "empty-or-invalid-proposal",
      severity: "error",
      message: "Der vorgeschlagene Wert ist leer oder ungültig und kann nicht übernommen werden.",
    };
  }
  if (VOLATILE_FIELDS.has(input.fieldId)) {
    return {
      code: "volatile-price-separated",
      severity: "info",
      message: "Preis-Snapshot: volatil und bewusst nicht Teil der Metadaten-Übernahme.",
    };
  }
  if (COVER_FIELDS.has(input.fieldId)) {
    if (isDefinitivelyBroken(input.imageCheck)) {
      return {
        code: "image-definitively-broken",
        severity: "error",
        message: "Die Bildprüfung hat dieses Cover als definitiv nicht ladbar eingestuft.",
      };
    }
    if (input.imageCheck && TRANSIENT_IMAGE_RESULTS.has(input.imageCheck.result)) {
      return {
        code: "image-check-inconclusive",
        severity: "warning",
        message: "Die Bildprüfung war vorübergehend nicht eindeutig. Das Cover bleibt abgewählt.",
      };
    }
    if (!input.imageCheck) {
      return {
        code: "image-not-checked",
        severity: "warning",
        message: "Das Cover wurde noch nicht auf Erreichbarkeit geprüft und bleibt abgewählt.",
      };
    }
    return {
      code: "cover-review-required",
      severity: "warning",
      message: "Cover werden nie automatisch überschrieben. Bitte die Vorschau bewusst prüfen.",
    };
  }
  if (input.selection.reason === "manual-value-protected") {
    return {
      code: "manual-value-protected",
      severity: "warning",
      message: "Der vorhandene Wert wurde manuell gepflegt und bleibt geschützt.",
    };
  }
  if (input.selection.reason === "nonempty-value-review-required") {
    const source = input.currentProvenance?.source;
    return {
      code: "existing-value-review-required",
      severity: "warning",
      message: source
        ? `Der vorhandene Wert stammt aus „${source}“ und erfordert eine bewusste Auswahl.`
        : "Der vorhandene Wert hat keine belegte Herkunft und erfordert eine bewusste Auswahl.",
    };
  }
  return null;
}
