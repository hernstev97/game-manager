"use client";

import type { ImageCheck } from "@/lib/model";
import type { ArtworkDraft, ArtworkOrientation, MediaCandidate } from "@/lib/media/types";
import { normalizeRemoteImageUrl } from "@/lib/media/remote-url";
import { M3Slider, M3TextField } from "@/components/m3/host";
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
  const manualInvalid = manualUrl.trim() !== "" && !normalizedManual;
  return (
    <section className={styles.editorSection} aria-labelledby={`${orientation}-heading`}>
      <h3 id={`${orientation}-heading`}>{title}</h3>
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
        <M3TextField
          label="Eigene Bild-URL"
          type="url"
          value={manualUrl}
          placeholder="https://…"
          helperText={manualInvalid ? "Keine gültige http(s)-Bild-URL" : undefined}
          onChange={onManualUrlChange}
        />
        <m3-button
          variant="tonal"
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
        </m3-button>
      </div>
      {draft?.candidate.url ? (
        <div className={styles.adjustments}>
          <div className={styles.adjustment}>
            <span>Fokus horizontal: {Math.round(draft.focalPointX * 100)} %</span>
            <M3Slider
              label="Fokus horizontal"
              min={0}
              max={1}
              step={0.01}
              value={draft.focalPointX}
              onChange={(focalPointX) => onChange({ ...draft, focalPointX })}
            />
          </div>
          <div className={styles.adjustment}>
            <span>Fokus vertikal: {Math.round(draft.focalPointY * 100)} %</span>
            <M3Slider
              label="Fokus vertikal"
              min={0}
              max={1}
              step={0.01}
              value={draft.focalPointY}
              onChange={(focalPointY) => onChange({ ...draft, focalPointY })}
            />
          </div>
          <div className={styles.adjustment}>
            <span>Zoom: {draft.zoom.toFixed(2)}×</span>
            <M3Slider
              label="Zoom"
              min={1}
              max={4}
              step={0.05}
              value={draft.zoom}
              onChange={(zoom) => onChange({ ...draft, zoom })}
            />
          </div>
          <m3-button variant="outlined" loading={checking} disabled={checking} onClick={onCheck}>
            {checking ? "Prüfe…" : "Ausgewähltes Bild prüfen"}
          </m3-button>
        </div>
      ) : null}
    </section>
  );
}
