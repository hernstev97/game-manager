import type {
  FieldProvenance,
  FieldProvenanceMap,
  LibraryGameRecordV2,
  RemoteImageAsset,
} from "@/lib/model";
import type { ArtworkDraft, ArtworkOrientation } from "@/lib/media/types";
import { normalizeRemoteImageUrl } from "@/lib/media/remote-url";

export type MediaSelectionPatch = Partial<
  Pick<LibraryGameRecordV2, "coverUrl" | "landscapeArtwork" | "caseArtwork" | "provenance">
>;

function assetFromDraft(draft: ArtworkDraft, updatedAt: string): RemoteImageAsset | null {
  if (!draft.candidate.url) return null;
  const url = normalizeRemoteImageUrl(draft.candidate.url);
  if (!url) throw new Error("Artwork selections require an absolute http(s) URL");
  const focalPointX = Number.isFinite(draft.focalPointX) ? draft.focalPointX : 0.5;
  const focalPointY = Number.isFinite(draft.focalPointY) ? draft.focalPointY : 0.5;
  const zoom = Number.isFinite(draft.zoom) ? draft.zoom : 1;
  return {
    url,
    source: draft.candidate.source,
    updatedAt,
    ...(draft.candidate.sourceRef ? { sourceRef: draft.candidate.sourceRef } : {}),
    focalPointX: Math.min(1, Math.max(0, focalPointX)),
    focalPointY: Math.min(1, Math.max(0, focalPointY)),
    zoom: Math.min(4, Math.max(1, zoom)),
    ...(draft.imageCheck ? { imageCheck: draft.imageCheck } : {}),
  };
}

export function createMediaSelectionPatch(
  orientation: ArtworkOrientation,
  draft: ArtworkDraft,
  currentProvenance: FieldProvenanceMap,
  updatedAt: string,
): MediaSelectionPatch {
  const asset = assetFromDraft(draft, updatedAt);
  const provenance: FieldProvenance = {
    source: draft.candidate.source,
    updatedAt,
    ...(draft.candidate.sourceRef ? { sourceRef: draft.candidate.sourceRef } : {}),
  };
  if (orientation === "landscape") {
    return {
      coverUrl: asset?.url ?? "",
      landscapeArtwork: asset,
      provenance: { ...currentProvenance, coverUrl: provenance, landscapeArtwork: provenance },
    };
  }
  return {
    caseArtwork: asset,
    provenance: { ...currentProvenance, caseArtwork: provenance },
  };
}

export function mergeMediaSelectionPatches(
  currentProvenance: FieldProvenanceMap,
  patches: readonly MediaSelectionPatch[],
): MediaSelectionPatch {
  return patches.reduce<MediaSelectionPatch>(
    (merged, patch) => ({
      ...merged,
      ...patch,
      provenance: { ...(merged.provenance ?? currentProvenance), ...patch.provenance },
    }),
    {},
  );
}

export function createDirtyMediaPatch({
  drafts,
  dirty,
  currentProvenance,
  updatedAt,
}: {
  drafts: Partial<Record<ArtworkOrientation, ArtworkDraft>>;
  dirty: ReadonlySet<ArtworkOrientation>;
  currentProvenance: FieldProvenanceMap;
  updatedAt: string;
}): MediaSelectionPatch | null {
  const patches = (["landscape", "portrait"] as const).flatMap((orientation) => {
    const draft = drafts[orientation];
    return dirty.has(orientation) && draft
      ? [createMediaSelectionPatch(orientation, draft, currentProvenance, updatedAt)]
      : [];
  });
  return patches.length ? mergeMediaSelectionPatches(currentProvenance, patches) : null;
}
