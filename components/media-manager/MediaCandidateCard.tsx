"use client";

import Image, { type ImageLoaderProps } from "next/image";
import type { ImageCheck, ImageCheckResult } from "@/lib/model";
import type { MediaCandidate } from "@/lib/media/types";
import styles from "./media-manager.module.css";

const passthroughLoader = ({ src }: ImageLoaderProps) => src;
const TRANSIENT = new Set<ImageCheckResult>([
  "offline",
  "timeout",
  "network-error",
  "rate-limited",
  "blocked",
]);

const CHECK_LABELS: Record<ImageCheckResult, string> = {
  ok: "Bild erreichbar",
  "not-found": "Defekt: nicht gefunden",
  "invalid-content": "Defekt: kein gültiges Bild",
  offline: "Temporär: offline",
  timeout: "Temporär: Zeitüberschreitung",
  "network-error": "Temporär: Netzwerkfehler",
  "rate-limited": "Temporär: Rate-Limit",
  blocked: "Temporär: Zugriff blockiert",
};

export function MediaCandidateCard({
  candidate,
  selected,
  check,
  onSelect,
}: {
  candidate: MediaCandidate;
  selected: boolean;
  check?: ImageCheck;
  onSelect: () => void;
}) {
  const checkTone = check?.result === "ok"
    ? "ok"
    : check && TRANSIENT.has(check.result)
      ? "transient"
      : check
        ? "broken"
        : undefined;
  return (
    <button
      type="button"
      className={styles.candidate}
      data-selected={selected || undefined}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span
        className={`${styles.candidatePreview} ${candidate.orientation === "portrait" ? styles.portrait : styles.landscape}`}
      >
        {candidate.url ? (
          <Image
            loader={passthroughLoader}
            unoptimized
            fill
            src={candidate.url}
            alt=""
            sizes="(max-width: 700px) 45vw, 180px"
            className={styles.candidateImage}
          />
        ) : (
          <span className={styles.emptyPreview}>Ohne Bild</span>
        )}
      </span>
      <span className={styles.candidateLabel}>{candidate.label}</span>
      {check ? (
        <span className={styles.checkBadge} data-tone={checkTone}>{CHECK_LABELS[check.result]}</span>
      ) : null}
    </button>
  );
}
