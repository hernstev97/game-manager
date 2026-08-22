"use client";

import { useEffect, useState } from "react";
import type { GameRecord } from "@/lib/game-fields";
import {
  addBulkListValues,
  appendBulkQueue,
  deleteSelectedGames,
  removeBulkListValues,
  removeBulkQueue,
  setBulkBooleanField,
  setBulkFranchise,
  type BulkListField,
} from "@/lib/bulk/operations";
import type { BulkMutationResult } from "@/lib/bulk/result";
import { prepareSelectionDocument } from "@/lib/bulk/preparation";
import { downloadTextFile, serializeLibraryBackup } from "@/lib/import-export";
import {
  getLibraryJobScheduler,
  getLibrarySnapshotRepository,
  libraryUndoHistory,
} from "@/lib/runtime/library-runtime";
import { createMetadataRefreshJobs } from "@/lib/runtime/library-job-factories";
import { libraryRepository } from "@/lib/storage";
import { toast } from "@/components/m3/snackbar";
import { toastWithUndo } from "@/components/undo";
import { useLibrary } from "@/store/library";
import { BulkActionBar } from "./BulkActionBar";
import { BulkBooleanControl } from "./BulkBooleanControl";
import { BulkClassificationControl } from "./BulkClassificationControl";
import { BulkConfirmDialog } from "./BulkConfirmDialog";
import { BulkQuickActions } from "./BulkQuickActions";
import styles from "./bulk-actions.module.css";

export function LibraryBulkActions({ visibleGames }: { visibleGames: readonly GameRecord[] }) {
  const games = useLibrary((state) => state.games);
  const selectionMode = useLibrary((state) => state.selectionMode);
  const selectedIds = useLibrary((state) => state.selectedIds);
  const selectedCount = useLibrary((state) => state.selectedCount);
  const replaceGames = useLibrary((state) => state.replaceGames);
  const selectAllVisible = useLibrary((state) => state.selectAllVisible);
  const clearSelection = useLibrary((state) => state.clearSelection);
  const cleanupSelection = useLibrary((state) => state.cleanupSelection);
  const endSelection = useLibrary((state) => state.endSelection);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const visibleIds = visibleGames.map((game) => game.id);

  useEffect(() => cleanupSelection(games.map((game) => game.id)), [cleanupSelection, games]);

  const apply = (result: BulkMutationResult) => {
    if (result.affectedIds.length === 0) {
      toast.success("Keine Änderungen erforderlich.");
      return false;
    }
    const before = libraryRepository.load();
    replaceGames(result.after);
    const after = libraryRepository.load();
    if (before && after) {
      libraryUndoHistory.record(result.undo.label, before, after, result.undo.changes);
    }
    toastWithUndo(`${result.undo.label}: ${result.affectedIds.length} geändert.`);
    return true;
  };

  const prepareMetadata = async () => {
    try {
      const selected = new Set(selectedIds);
      const ordered = [...visibleGames, ...games].filter(
        (game, index, all) =>
          selected.has(game.id) && all.findIndex((item) => item.id === game.id) === index,
      );
      const igdbTargets = ordered
        .filter((game) => game.igdbId != null)
        .map((game) => ({ gameId: game.id, externalId: game.igdbId! }));
      const igdbIds = new Set(igdbTargets.map((target) => target.gameId));
      const steamTargets = ordered
        .filter((game) => !igdbIds.has(game.id) && game.steamAppId != null)
        .map((game) => ({ gameId: game.id, externalId: game.steamAppId! }));
      const jobs = [
        ...createMetadataRefreshJobs("igdb", igdbTargets),
        ...createMetadataRefreshJobs("steam", steamTargets),
      ];
      if (jobs.length === 0) {
        toast.error("Die Auswahl enthält keine Steam- oder IGDB-IDs.");
        return;
      }
      const scheduler = getLibraryJobScheduler();
      await Promise.all(jobs.map((job) => scheduler.enqueue(job)));
      toast.success(`Metadaten-Aufgabe für ${jobs.length} Spiele vorbereitet.`);
    } catch {
      toast.error("Metadaten-Aufgabe konnte nicht gespeichert werden.");
    }
  };

  const exportSelection = () => {
    const document = libraryRepository.load();
    if (!document) return toast.error("Bibliothek konnte nicht gelesen werden.");
    const selection = prepareSelectionDocument(document, selectedIds, new Date().toISOString());
    downloadTextFile("ggrid-auswahl.json", serializeLibraryBackup(selection));
    toast.success(`${selectedCount} Spiele exportiert.`);
  };

  const deleteSelection = async () => {
    const before = libraryRepository.load();
    if (!before) return toast.error("Bibliothek konnte nicht gelesen werden.");
    try {
      await getLibrarySnapshotRepository().create("before-bulk-delete", before);
      if (apply(deleteSelectedGames(games, selectedIds))) endSelection();
      setConfirmDelete(false);
    } catch {
      toast.error("Sicherungs-Snapshot fehlgeschlagen; es wurde nichts gelöscht.");
    }
  };

  if (!selectionMode) return null;
  return (
    <>
      <BulkActionBar
        selectedCount={selectedCount}
        visibleCount={visibleGames.length}
        onSelectAllVisible={() => selectAllVisible(visibleIds)}
        onClear={clearSelection}
        onClose={endSelection}
      >
        <BulkQuickActions
          disabled={selectedCount === 0}
          onAddToQueue={() => apply(appendBulkQueue(games, selectedIds, visibleIds))}
          onRemoveFromQueue={() => apply(removeBulkQueue(games, selectedIds))}
          onPrepareMetadata={() => void prepareMetadata()}
          onPrepareExport={exportSelection}
          onRequestDelete={() => setConfirmDelete(true)}
        />
        <details className={styles.moreActions}>
          <summary>Felder bearbeiten</summary>
          <div className={styles.moreActionsPanel}>
            <BulkBooleanControl
              disabled={selectedCount === 0}
              onApply={(field, value) => apply(setBulkBooleanField(games, selectedIds, field, value))}
            />
            <BulkClassificationControl
              disabled={selectedCount === 0}
              onListApply={(field: BulkListField, operation, values) => apply(
                operation === "add"
                  ? addBulkListValues(games, selectedIds, field, values)
                  : removeBulkListValues(games, selectedIds, field, values),
              )}
              onFranchiseApply={(franchise) => apply(setBulkFranchise(games, selectedIds, franchise))}
            />
          </div>
        </details>
      </BulkActionBar>
      <BulkConfirmDialog
        open={confirmDelete}
        selectedCount={selectedCount}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void deleteSelection()}
      />
    </>
  );
}
