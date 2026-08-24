import type { CSSProperties } from "react";
import type { RemoteImageAsset } from "@/lib/model";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export type ArtworkTransformStyle = CSSProperties & {
  objectPosition: string;
  transform: string;
};

export function artworkTransformStyle(
  asset: Pick<RemoteImageAsset, "focalPointX" | "focalPointY" | "zoom"> | null | undefined,
): ArtworkTransformStyle {
  const x = clamp(asset?.focalPointX ?? 0.5, 0, 1);
  const y = clamp(asset?.focalPointY ?? 0.5, 0, 1);
  const zoom = clamp(asset?.zoom ?? 1, 1, 4);
  return {
    objectPosition: `${x * 100}% ${y * 100}%`,
    transform: `scale(${zoom})`,
  };
}
