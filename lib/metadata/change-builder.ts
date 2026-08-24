import type {
  FieldProvenance,
  FieldProvenanceMap,
  ImageCheck,
  JsonValue,
  LibraryGameRecordV2,
  RemoteImageAsset,
} from "@/lib/model";
import { cloneJson, jsonEqual } from "./json";
import {
  categoryFor,
  evaluateMetadataDefaultSelection,
  warningForSelection,
} from "./selection-policy";
import type {
  MetadataProposal,
  MetadataReviewBaseline,
  MetadataReviewFieldChange,
  MetadataReviewFieldId,
} from "./types";

export const FIELD_ORDER = [
  "name",
  "steamAppId",
  "igdbId",
  "released",
  "genres",
  "franchise",
  "platforms",
  "coverUrl",
  "landscapeArtwork",
  "caseArtwork",
  "steamPrice",
] as const;

function imageCheckFrom(
  proposal: MetadataProposal,
  fieldId: MetadataReviewFieldId,
  incomingValue: JsonValue,
): ImageCheck | undefined {
  const explicit = proposal.imageChecks?.[fieldId];
  if (explicit) return explicit;
  if (
    (fieldId === "landscapeArtwork" || fieldId === "caseArtwork") &&
    incomingValue &&
    typeof incomingValue === "object" &&
    !Array.isArray(incomingValue)
  ) {
    return (incomingValue as RemoteImageAsset).imageCheck;
  }
  return undefined;
}

export function createMetadataChange(
  game: LibraryGameRecordV2,
  proposal: MetadataProposal,
  fieldId: MetadataReviewFieldId,
  incomingRaw: JsonValue,
): MetadataReviewFieldChange | null {
  const incomingValue = cloneJson(incomingRaw, `proposal.${fieldId}`);
  const currentValue = cloneJson(game[fieldId] ?? null, `game.${fieldId}`);
  if (jsonEqual(currentValue, incomingValue)) return null;

  const currentProvenance = game.provenance[fieldId];
  const proposedProvenance: FieldProvenance = {
    source: proposal.source,
    sourceRef: proposal.sourceRef,
    updatedAt: proposal.fetchedAt,
  };
  const proposedImageCheck = imageCheckFrom(
    proposal,
    fieldId,
    incomingValue,
  );
  const defaultSelection = evaluateMetadataDefaultSelection({
    fieldId,
    currentValue,
    incomingValue,
    currentProvenance,
    proposedImageCheck,
  });
  const current = {
    value: currentValue,
    ...(currentProvenance
      ? { provenance: cloneJson(currentProvenance) as FieldProvenance }
      : {}),
  };

  return {
    gameId: game.id,
    fieldId,
    category: categoryFor(fieldId),
    current,
    proposed: { value: incomingValue, provenance: proposedProvenance },
    ...(proposedImageCheck ? { proposedImageCheck } : {}),
    defaultSelection,
    currentValue,
    incomingValue,
    source: proposal.source,
    selected: defaultSelection.selected,
    warning: warningForSelection({
      fieldId,
      currentValue,
      incomingValue,
      currentProvenance,
      imageCheck: proposedImageCheck,
      selection: defaultSelection,
    }),
  };
}

export function createReviewBaseline(
  game: LibraryGameRecordV2,
  proposal: MetadataProposal,
): MetadataReviewBaseline {
  const relatedFields = new Set<string>([
    ...Object.keys(proposal.values),
    "coverUrl",
    "landscapeArtwork",
    "caseArtwork",
  ]);
  return {
    values: Object.fromEntries(
      [...relatedFields].map((fieldId) => [
        fieldId,
        cloneJson(game[fieldId] ?? null, `game.${fieldId}`),
      ]),
    ),
    provenance: cloneJson(
      game.provenance,
      "game.provenance",
    ) as FieldProvenanceMap,
  };
}
