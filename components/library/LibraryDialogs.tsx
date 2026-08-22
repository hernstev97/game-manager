"use client";

import { useState } from "react";
import type { GameRecord } from "@/lib/game-fields";
import { AddGameDialog } from "@/components/add-game/AddGameDialog";
import { GameEditor } from "@/components/game-editor";
import { MediaManagerDialog } from "@/components/media-manager/MediaManagerDialog";
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
  const applySteamPlaytime = useLibrary((state) => state.applySteamPlaytime);
  const refreshSteamIdentity = useLibrary((state) => state.refreshSteamIdentity);
  const [mediaOpen, setMediaOpen] = useState(false);
  const selected = games.find((game) => game.id === selectedId) ?? null;

  return (
    <>
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
          onApplyPlaytime={applySteamPlaytime}
          onRefreshIdentity={refreshSteamIdentity}
          onImport={onImport}
          onExport={exportJson}
        />
      ) : null}
    </>
  );
}
