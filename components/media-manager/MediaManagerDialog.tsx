"use client";

import { useMemo, useState } from "react";
import type { GameRecord } from "@/lib/game-fields";
import { buildLandscapeCandidates, buildPortraitCandidates, type MediaCandidateSources } from "@/lib/media/candidates";
import { ImageChecker } from "@/lib/media/image-checker";
import { createDirtyMediaPatch, type MediaSelectionPatch } from "@/lib/media/selection";
import type { ArtworkDraft, ArtworkOrientation, MediaCandidate } from "@/lib/media/types";
import type { ImageCheck } from "@/lib/model";
import { M3Dialog } from "@/components/m3/host";
import { IconClose } from "@/components/m3/icons";
import { ArtworkDraftEditor } from "@/components/media-manager/ArtworkDraftEditor";
import styles from "./media-manager.module.css";

const defaultChecker = new ImageChecker();
const EMPTY_SOURCES: MediaCandidateSources = {};

function draftFrom(candidate: MediaCandidate): ArtworkDraft {
  return {
    candidate,
    focalPointX: candidate.asset?.focalPointX ?? 0.5,
    focalPointY: candidate.asset?.focalPointY ?? 0.5,
    zoom: candidate.asset?.zoom ?? 1,
    imageCheck: candidate.asset?.imageCheck,
  };
}

type MediaManagerDialogProps = {
  open: boolean;
  game: GameRecord;
  sources?: MediaCandidateSources;
  checker?: ImageChecker;
  now?: () => string;
  onApply: (patch: MediaSelectionPatch) => void;
  onClose: () => void;
};

export function MediaManagerDialog(props: MediaManagerDialogProps) {
  return <MediaManagerDialogContent key={`${props.game.id}:${props.open}`} {...props} />;
}

function MediaManagerDialogContent({
  open,
  game,
  sources = EMPTY_SOURCES,
  checker = defaultChecker,
  now = () => new Date().toISOString(),
  onApply,
  onClose,
}: MediaManagerDialogProps) {
  const portraitCandidates = useMemo(() => buildPortraitCandidates(game, sources), [game, sources]);
  const landscapeCandidates = useMemo(() => buildLandscapeCandidates(game, sources), [game, sources]);
  const [drafts, setDrafts] = useState<Partial<Record<ArtworkOrientation, ArtworkDraft>>>({});
  const [dirty, setDirty] = useState<ReadonlySet<ArtworkOrientation>>(() => new Set());
  const [manual, setManual] = useState<Record<ArtworkOrientation, string>>({ portrait: "", landscape: "" });
  const [checks, setChecks] = useState<ReadonlyMap<string, ImageCheck>>(() => new Map());
  const [checking, setChecking] = useState<ArtworkOrientation | null>(null);

  const update = (orientation: ArtworkOrientation, draft: ArtworkDraft) => {
    setDrafts((current) => ({ ...current, [orientation]: draft }));
    setDirty((current) => new Set(current).add(orientation));
  };
  const check = async (orientation: ArtworkOrientation) => {
    const draft = drafts[orientation];
    if (!draft?.candidate.url) return;
    setChecking(orientation);
    try {
      const result = checks.has(draft.candidate.url)
        ? await checker.retry(draft.candidate.url)
        : await checker.check(draft.candidate.url);
      setChecks((current) => new Map(current).set(draft.candidate.url!, result));
      setDrafts((current) => ({
        ...current,
        [orientation]: current[orientation]
          ? { ...current[orientation]!, imageCheck: result }
          : current[orientation],
      }));
    } finally {
      setChecking(null);
    }
  };
  const apply = () => {
    const patch = createDirtyMediaPatch({
      drafts,
      dirty,
      currentProvenance: game.provenance,
      updatedAt: now(),
    });
    if (!patch) return;
    onApply(patch);
    onClose();
  };

  const editor = (orientation: ArtworkOrientation, candidates: MediaCandidate[]) => (
    <ArtworkDraftEditor
      orientation={orientation}
      candidates={candidates}
      draft={drafts[orientation]}
      manualUrl={manual[orientation]}
      checks={checks}
      checking={checking === orientation}
      onManualUrlChange={(value) => setManual((current) => ({ ...current, [orientation]: value }))}
      onSelect={(candidate) => update(orientation, draftFrom(candidate))}
      onChange={(draft) => update(orientation, draft)}
      onCheck={() => void check(orientation)}
    />
  );

  return (
    <M3Dialog
      open={open}
      onClose={onClose}
      headline={`Medien für ${game.name || "Unbenanntes Spiel"}`}
      presentation="fullscreen"
      size="wide"
      leadingAction={
        <m3-icon-button aria-label="Medienverwaltung schließen" onClick={onClose}>
          <IconClose />
        </m3-icon-button>
      }
      actions={
        <>
          <m3-button className="desktop-dialog-cancel" slot="actions" variant="text" onClick={onClose}>
            Abbrechen
          </m3-button>
          <m3-button slot="actions" disabled={dirty.size === 0} onClick={apply}>
            Speichern
          </m3-button>
        </>
      }
    >
      <div className={styles.content}>
        <p className={styles.description}>Eine Auswahl wird erst mit „Speichern“ übernommen.</p>
        <div className={styles.editors}>
          {editor("portrait", portraitCandidates)}
          {editor("landscape", landscapeCandidates)}
        </div>
      </div>
    </M3Dialog>
  );
}
