"use client";

import { useState } from "react";
import type { FranchisePresentation } from "@/lib/model/shared";
import styles from "./franchises.module.css";

export type FranchisePresentationPopoverProps = {
  franchise: string;
  presentation?: FranchisePresentation;
  onChange: (presentation: FranchisePresentation) => void;
};

/** Local draft editor; URL checks and persistence deliberately remain outside. */
function PresentationDraft({
  franchise,
  presentation,
  onChange,
}: FranchisePresentationPopoverProps) {
  const [backgroundUrl, setBackgroundUrl] = useState(presentation?.backgroundUrl ?? "");
  const [focalX, setFocalX] = useState(presentation?.focalPointX ?? 0.5);
  const [focalY, setFocalY] = useState(presentation?.focalPointY ?? 0.5);
  const [overlay, setOverlay] = useState(presentation?.overlayStrength ?? 0.68);

  const removeBackground = () => {
    const next = { ...(presentation ?? { franchise }) };
    delete next.backgroundUrl;
    delete next.imageCheck;
    setBackgroundUrl("");
    onChange(next);
  };

  return (
    <details className={styles.editor}>
      <summary>Hintergrund bearbeiten</summary>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const url = backgroundUrl.trim();
          const next: FranchisePresentation = {
            ...(presentation ?? {}),
            franchise: presentation?.franchise ?? franchise,
            focalPointX: focalX,
            focalPointY: focalY,
            overlayStrength: overlay,
          };
          if (url) next.backgroundUrl = url;
          else delete next.backgroundUrl;
          if (url !== presentation?.backgroundUrl) delete next.imageCheck;
          onChange(next);
        }}
      >
        <label className={styles.urlField}>
          <span>Hintergrund-URL</span>
          <input
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={backgroundUrl}
            onChange={(event) => setBackgroundUrl(event.target.value)}
          />
        </label>
        <label>
          <span>Fokus horizontal: {Math.round(focalX * 100)} %</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={focalX}
            onChange={(event) => setFocalX(event.target.valueAsNumber)}
          />
        </label>
        <label>
          <span>Fokus vertikal: {Math.round(focalY * 100)} %</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={focalY}
            onChange={(event) => setFocalY(event.target.valueAsNumber)}
          />
        </label>
        <label>
          <span>Overlay: {Math.round(overlay * 100)} %</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={overlay}
            onChange={(event) => setOverlay(event.target.valueAsNumber)}
          />
        </label>
        <div className={styles.editorActions}>
          {presentation?.backgroundUrl ? (
            <button type="button" className={styles.removeButton} onClick={removeBackground}>
              Hintergrund entfernen
            </button>
          ) : null}
          <button type="submit" className={styles.saveButton}>
            Darstellung speichern
          </button>
        </div>
      </form>
    </details>
  );
}

export function FranchisePresentationPopover(props: FranchisePresentationPopoverProps) {
  const presentation = props.presentation;
  const draftKey = [
    props.franchise,
    presentation?.backgroundUrl,
    presentation?.focalPointX,
    presentation?.focalPointY,
    presentation?.overlayStrength,
  ].join("|");
  return <PresentationDraft key={draftKey} {...props} />;
}
