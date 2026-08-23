import Image, { type ImageLoaderProps } from "next/image";
import { isSteamPriceSnapshot, steamPriceLabel } from "@/lib/steam";
import type { JsonValue } from "@/lib/model";
import { normalizeRemoteImageUrl } from "@/lib/media/remote-url";
import type { MetadataReviewFieldId } from "@/lib/metadata";
import styles from "./metadata-value.module.css";

const remoteLoader = ({ src }: ImageLoaderProps) => src;

function imageUrl(value: JsonValue): string | null {
  if (typeof value === "string") return normalizeRemoteImageUrl(value);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return typeof value.url === "string"
      ? normalizeRemoteImageUrl(value.url)
      : null;
  }
  return null;
}

function textValue(fieldId: MetadataReviewFieldId, value: JsonValue): string {
  if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
    return "Nicht gesetzt";
  }
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (fieldId === "steamPrice" && isSteamPriceSnapshot(value)) {
    return steamPriceLabel(value) || value.formatted;
  }
  if (Array.isArray(value)) return value.join(", ");
  if ("url" in value && typeof value.url === "string") return value.url;
  return JSON.stringify(value, null, 2);
}

export function MetadataValue({
  fieldId,
  value,
  image,
}: {
  fieldId: MetadataReviewFieldId;
  value: JsonValue;
  image: boolean;
}) {
  const url = image ? imageUrl(value) : null;
  return (
    <div className={styles.value}>
      {url ? (
        <span className={styles.imagePreview}>
          <Image
            loader={remoteLoader}
            unoptimized
            fill
            src={url}
            alt=""
            sizes="(max-width: 540px) 42vw, 240px"
            className={styles.image}
          />
        </span>
      ) : null}
      <span className={styles.valueText}>{textValue(fieldId, value)}</span>
    </div>
  );
}
