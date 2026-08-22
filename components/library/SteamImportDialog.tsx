"use client";

import { useRef, useState } from "react";
import { M3Dialog } from "@/components/m3/host";
import { IconClose } from "@/components/m3/icons";
import { toast } from "@/components/m3/snackbar";
import { useOnlineStatus } from "@/components/pwa";
import { SteamImportWizard } from "@/components/steam-import";
import { createMetadataReview, type MetadataProposal } from "@/lib/metadata";
import { canonicalDocumentForWrite, libraryRepository } from "@/lib/storage";
import { fetchOwnedSteamGames } from "@/lib/steam";
import type { SteamMetadataReviewHandoff } from "@/lib/steam-import";
import type { PersistedJob } from "@/lib/model";
import { getLibraryJobScheduler } from "@/lib/runtime/library-runtime";
import { useLibrary } from "@/store/library";

export function SteamImportDialog({ onClose }: { onClose: () => void }) {
  const online = useOnlineStatus();
  const steamId = useLibrary((state) => state.steamId);
  const steamApiKey = useLibrary((state) => state.steamApiKey);
  const applyImportPlan = useLibrary((state) => state.applyImportPlan);
  const queueMetadataReviews = useLibrary((state) => state.queueMetadataReviews);
  const [document] = useState(() =>
    canonicalDocumentForWrite(
      libraryRepository.load() ?? libraryRepository.empty(),
    ),
  );
  const [pendingJobs, setPendingJobs] = useState<readonly PersistedJob[]>([]);
  const [pendingReview, setPendingReview] =
    useState<SteamMetadataReviewHandoff | null>(null);
  const closingRef = useRef(false);

  const queueReviewHandoff = (handoff: SteamMetadataReviewHandoff) => {
    const games = useLibrary.getState().games;
    const reviews = handoff.proposals.flatMap((proposal) => {
      const game = games.find((item) => item.id === proposal.gameId);
      const jobKinds = new Set(
        pendingJobs
          .filter((job) => job.payload.gameId === proposal.gameId)
          .map((job) => job.kind),
      );
      const deferredFields = new Set<string>();
      if (jobKinds.has("steam-import.details")) {
        ["steamAppId", "name", "released", "steamPrice"].forEach((field) =>
          deferredFields.add(field),
        );
      }
      if (jobKinds.has("steam-import.covers")) {
        ["coverUrl", "landscapeArtwork"].forEach((field) =>
          deferredFields.add(field),
        );
      }
      const filteredProposal: MetadataProposal = {
        ...proposal,
        values: Object.fromEntries(
          Object.entries(proposal.values).filter(
            ([fieldId]) => !deferredFields.has(fieldId),
          ),
        ),
        imageChecks: proposal.imageChecks
          ? Object.fromEntries(
              Object.entries(proposal.imageChecks).filter(
                ([fieldId]) => !deferredFields.has(fieldId),
              ),
            )
          : undefined,
      };
      return game && Object.keys(filteredProposal.values).length > 0
        ? [
            createMetadataReview({
              id: `${handoff.importPlanId}:${proposal.gameId}`,
              game,
              proposal: filteredProposal,
            }),
          ]
        : [];
    });
    queueMetadataReviews(reviews);
  };

  const closeDialog = async () => {
    if (closingRef.current) return;
    closingRef.current = true;
    try {
      if (pendingJobs.length > 0) {
        const scheduler = getLibraryJobScheduler();
        await Promise.all(pendingJobs.map((job) => scheduler.enqueue(job)));
      }
    } catch {
      toast.error("Vorbereitete Steam-Aufgaben konnten nicht gespeichert werden.");
    }
    if (pendingReview) queueReviewHandoff(pendingReview);
    onClose();
  };

  return (
    <M3Dialog
      open
      onClose={() => void closeDialog()}
      headline="Steam-Bibliothek importieren"
      presentation="fullscreen"
      leadingAction={
        <m3-icon-button aria-label="Steam-Import schließen" onClick={() => void closeDialog()}>
          <IconClose />
        </m3-icon-button>
      }
    >
      <SteamImportWizard
        currentDocument={document}
        online={online}
        loadLibrary={async ({ signal }) => {
          const result = await fetchOwnedSteamGames(steamId, steamApiKey);
          if (signal.aborted) throw new DOMException("Abgebrochen", "AbortError");
          return result.games;
        }}
        onApply={applyImportPlan}
        onJobsPrepared={setPendingJobs}
        onReviewHandoff={setPendingReview}
      />
    </M3Dialog>
  );
}
