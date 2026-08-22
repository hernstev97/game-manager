"use client";

import type { ImageCheck } from "@/lib/model";
import type { ArtworkDraft, ArtworkOrientation, MediaCandidate } from "@/lib/media/types";
import { normalizeRemoteImageUrl } from "@/lib/media/remote-url";
import { MediaCandidateCard } from "@/components/media-manager/MediaCandidateCard";
import styles from "./media-manager.module.css";

export function ArtworkDraftEditor({
  orientation,
  candidates,
  draft,
  manualUrl,
  checks,
  checking,
  onManualUrlChange,
  onSelect,
  onChange,
  onCheck,
}: {
  orientation: ArtworkOrientation;
  candidates: readonly MediaCandidate[];
  draft?: ArtworkDraft;
  manualUrl: string;
  checks: ReadonlyMap<string, ImageCheck>;
  checking: boolean;
  onManualUrlChange: (value: string) => void;
  onSelect: (candidate: MediaCandidate) => void;
  onChange: (draft: ArtworkDraft) => void;
  onCheck: () => void;
}) {
  const title = orientation === "portrait" ? "Portrait / Case" : "Landscape / Header";
  const normalizedManual = normalizeRemoteImageUrl(manualUrl);
  return (
    <section className={styles.editorSection} aria-labelledby={`${orientation}-heading`}>
      <h2 id={`${orientation}-heading`}>{title}</h2>
      <div className={styles.candidateList}>
        {candidates.map((candidate) => (
          <MediaCandidateCard
            key={candidate.id}
            candidate={candidate}
            selected={draft?.candidate.id === candidate.id && draft.candidate.url === candidate.url}
            check={candidate.url ? checks.get(candidate.url) : undefined}
            onSelect={() => onSelect(candidate)}
          />
        ))}
      </div>
      <div className={styles.manualRow}>
        <label>
          Eigene Bild-URL
          <input
            type="url"
            value={manualUrl}
            placeholder="https://…"
            aria-invalid={manualUrl.trim() !== "" && !normalizedManual}
            onChange={(event) => onManualUrlChange(event.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={!normalizedManual}
          onClick={() => normalizedManual && onSelect({
            id: `manual-${orientation}`,
            label: "Eigene URL",
            orientation,
            kind: "custom",
            url: normalizedManual,
            source: "manual",
          })}
        >
          Auswählen
        </button>
      </div>
      {draft?.candidate.url ? (
        <div className={styles.adjustments}>
          <label>
            Fokus horizontal: {Math.round(draft.focalPointX * 100)} %
            <input type="range" min="0" max="1" step="0.01" value={draft.focalPointX} onChange={(event) => onChange({ ...draft, focalPointX: Number(event.target.value) })} />
          </label>
          <label>
            Fokus vertikal: {Math.round(draft.focalPointY * 100)} %
            <input type="range" min="0" max="1" step="0.01" value={draft.focalPointY} onChange={(event) => onChange({ ...draft, focalPointY: Number(event.target.value) })} />
          </label>
          <label>
            Zoom: {draft.zoom.toFixed(2)}×
            <input type="range" min="1" max="4" step="0.05" value={draft.zoom} onChange={(event) => onChange({ ...draft, zoom: Number(event.target.value) })} />
          </label>
          <button type="button" disabled={checking} onClick={onCheck}>
            {checking ? "Prüfe…" : "Ausgewähltes Bild prüfen"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
