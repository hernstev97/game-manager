"use client";

import { useState } from "react";
import type { FranchisePresentation } from "@/lib/model/shared";
import { M3Slider, M3TextField } from "@/components/m3/host";
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
        {/* The field's input lives in a shadow root, so Enter is not an implicit submit. */}
        <div
          className={styles.urlField}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            event.currentTarget.closest("form")?.requestSubmit();
          }}
        >
          <M3TextField
            label="Hintergrund-URL"
            type="url"
            placeholder="https://…"
            value={backgroundUrl}
            onChange={setBackgroundUrl}
          />
        </div>
        <div className={styles.sliderField}>
          <span>Fokus horizontal: {Math.round(focalX * 100)} %</span>
          <M3Slider label="Fokus horizontal" min={0} max={1} step={0.01} value={focalX} onChange={setFocalX} />
        </div>
        <div className={styles.sliderField}>
          <span>Fokus vertikal: {Math.round(focalY * 100)} %</span>
          <M3Slider label="Fokus vertikal" min={0} max={1} step={0.01} value={focalY} onChange={setFocalY} />
        </div>
        <div className={styles.sliderField}>
          <span>Overlay: {Math.round(overlay * 100)} %</span>
          <M3Slider label="Overlay" min={0} max={1} step={0.01} value={overlay} onChange={setOverlay} />
        </div>
        <div className={styles.editorActions}>
          {presentation?.backgroundUrl ? (
            <m3-button variant="text" className={styles.removeButton} onClick={removeBackground}>
              Hintergrund entfernen
            </m3-button>
          ) : null}
          <m3-button type="submit">Darstellung speichern</m3-button>
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
