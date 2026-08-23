import type {
  ImageCheck,
  ProvenanceSource,
  RemoteImageAsset,
} from "@/lib/model";

export type ArtworkOrientation = "portrait" | "landscape";
export type MediaCandidateKind =
  | "custom"
  | "igdb"
  | "steam"
  | "existing"
  | "placeholder";

export type MediaCandidate = {
  id: string;
  label: string;
  orientation: ArtworkOrientation;
  kind: MediaCandidateKind;
  url: string | null;
  source: ProvenanceSource;
  sourceRef?: string;
  asset?: RemoteImageAsset;
};
export type ArtworkDraft = {
  candidate: MediaCandidate;
  focalPointX: number;
  focalPointY: number;
  zoom: number;
  imageCheck?: ImageCheck;
};
