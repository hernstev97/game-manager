"use client";

import { useState } from "react";
import type { GameRecord } from "@/lib/game-fields";
import { AddGameDialog } from "@/components/add-game/AddGameDialog";
import { GameEditor } from "@/components/game-editor";
import { MediaManagerDialog } from "@/components/media-manager/MediaManagerDialog";
import { LibraryMetadataReviewFlow } from "@/components/library/LibraryMetadataReviewFlow";
import { SteamImportDialog } from "@/components/library/SteamImportDialog";
import { createMetadataRefreshJobs } from "@/lib/runtime/library-job-factories";
import { getLibraryJobScheduler } from "@/lib/runtime/library-runtime";
import { SettingsDialog } from "@/components/settings-dialog";
import { useLibrary } from "@/store/library";

export function LibraryDialogs({
  visibleGames,
  addDialogEpoch,
  addInitialQuery,
  onImport,
}: {
  visibleGames: GameRecord[];
  addDialogEpoch: number;
  addInitialQuery: string;
  onImport: (file: File) => void;
}) {
  const games = useLibrary((state) => state.games);
  const selectedId = useLibrary((state) => state.selectedId);
  const editorOpen = useLibrary((state) => state.editorOpen);
  const addOpen = useLibrary((state) => state.addOpen);
  const settingsOpen = useLibrary((state) => state.settingsOpen);
  const steamId = useLibrary((state) => state.steamId);
  const steamApiKey = useLibrary((state) => state.steamApiKey);
  const igdbClientId = useLibrary((state) => state.igdbClientId);
  const igdbClientSecret = useLibrary((state) => state.igdbClientSecret);
  const closeEditor = useLibrary((state) => state.closeEditor);
  const selectGame = useLibrary((state) => state.selectGame);
  const openEditor = useLibrary((state) => state.openEditor);
  const setAddOpen = useLibrary((state) => state.setAddOpen);
  const setSettingsOpen = useLibrary((state) => state.setSettingsOpen);
  const updateGame = useLibrary((state) => state.updateGame);
  const setGamePriority = useLibrary((state) => state.setGamePriority);
  const setFavoriteRank = useLibrary((state) => state.setFavoriteRank);
  const addGame = useLibrary((state) => state.addGame);
  const deleteGame = useLibrary((state) => state.deleteGame);
  const clearLibrary = useLibrary((state) => state.clearLibrary);
  const exportJson = useLibrary((state) => state.exportJson);
  const setSteamCredentials = useLibrary((state) => state.setSteamCredentials);
  const setIgdbCredentials = useLibrary((state) => state.setIgdbCredentials);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [steamImportOpen, setSteamImportOpen] = useState(false);
  const selected = games.find((game) => game.id === selectedId) ?? null;

  const queueMetadataJobs = async (
    source: "steam" | "igdb",
    targets: Array<{ gameId: string; externalId: number }>,
  ) => {
    const jobs = createMetadataRefreshJobs(source, targets);
    const scheduler = getLibraryJobScheduler();
    await Promise.all(jobs.map((job) => scheduler.enqueue(job)));
    return jobs.length;
  };

  return (
    <>
      <LibraryMetadataReviewFlow />
      {editorOpen && selected ? (
        <GameEditor
          game={selected}
          games={games}
          visibleGames={visibleGames}
          open
          onClose={closeEditor}
          onSelect={selectGame}
          onChange={updateGame}
          onPriority={setGamePriority}
          onPosition={(id, fieldId, position) => {
            if (fieldId === "favoriteRank") setFavoriteRank(id, position);
            else setGamePriority(id, position);
          }}
          onDelete={deleteGame}
          onManageMedia={() => setMediaOpen(true)}
        />
      ) : null}
      {mediaOpen && selected ? (
        <MediaManagerDialog
          open
          game={selected}
          onApply={(patch) => updateGame(selected.id, patch)}
          onClose={() => setMediaOpen(false)}
        />
      ) : null}
      {addOpen ? (
        <AddGameDialog
          key={addDialogEpoch}
          open
          games={games}
          igdbClientId={igdbClientId}
          igdbClientSecret={igdbClientSecret}
          initialQuery={addInitialQuery}
          onClose={() => setAddOpen(false)}
          onCreate={addGame}
          onOpenExisting={(id) => {
            setAddOpen(false);
            openEditor(id);
          }}
        />
      ) : null}
      {settingsOpen ? (
        <SettingsDialog
          open
          onClose={() => setSettingsOpen(false)}
          steamId={steamId}
          steamApiKey={steamApiKey}
          igdbClientId={igdbClientId}
          igdbClientSecret={igdbClientSecret}
          games={games}
          onSteamCredentials={setSteamCredentials}
          onIgdbCredentials={setIgdbCredentials}
          onClearLibrary={clearLibrary}
          onQueueSteamMetadata={(targets) => queueMetadataJobs("steam", targets)}
          onQueueIgdbMetadata={(targets) => queueMetadataJobs("igdb", targets)}
          onOpenSteamImport={() => {
            setSettingsOpen(false);
            setSteamImportOpen(true);
          }}
          onImport={onImport}
          onExport={exportJson}
        />
      ) : null}
      {steamImportOpen ? (
        <SteamImportDialog onClose={() => setSteamImportOpen(false)} />
      ) : null}
    </>
  );
}
