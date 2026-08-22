"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLibrary } from "@/store/library";
import { applyFiltersAndSort } from "@/lib/filter-games";
import { LibraryWorkspace } from "@/components/library/LibraryWorkspace";
import { filtersWithQuery } from "@/components/library/LibraryToolbar";
import { GameEditor } from "@/components/game-editor";
import { AddGameDialog } from "@/components/add-game/AddGameDialog";
import { SettingsDialog } from "@/components/settings-dialog";
import { registerM3Components } from "@/components/m3/register";
import { SnackbarHost, toast } from "@/components/m3/snackbar";
import { MorphLoader } from "@/components/morph-loader";
import { runMotionViewTransition, useMotion } from "@/components/motion-provider";
import { PwaShell, type PwaSharePayload, type PwaShortcutAction } from "@/components/pwa";
import { useTheme } from "@/components/theme-provider";
import { useLibraryKeyboardShortcuts } from "@/components/library/useLibraryKeyboardShortcuts";

export function LibraryApp() {
  const hydrated = useLibrary((state) => state.hydrated);
  const games = useLibrary((state) => state.games);
  const filters = useLibrary((state) => state.filters);
  const sort = useLibrary((state) => state.sort);
  const selectedId = useLibrary((state) => state.selectedId);
  const editorOpen = useLibrary((state) => state.editorOpen);
  const addOpen = useLibrary((state) => state.addOpen);
  const settingsOpen = useLibrary((state) => state.settingsOpen);
  const steamId = useLibrary((state) => state.steamId);
  const steamApiKey = useLibrary((state) => state.steamApiKey);
  const igdbClientId = useLibrary((state) => state.igdbClientId);
  const igdbClientSecret = useLibrary((state) => state.igdbClientSecret);

  const hydrate = useLibrary((state) => state.hydrate);
  const setFilters = useLibrary((state) => state.setFilters);
  const clearFilters = useLibrary((state) => state.clearFilters);
  const setSort = useLibrary((state) => state.setSort);
  const selectGame = useLibrary((state) => state.selectGame);
  const openEditor = useLibrary((state) => state.openEditor);
  const closeEditor = useLibrary((state) => state.closeEditor);
  const setAddOpen = useLibrary((state) => state.setAddOpen);
  const setSettingsOpen = useLibrary((state) => state.setSettingsOpen);
  const updateGame = useLibrary((state) => state.updateGame);
  const setGamePriority = useLibrary((state) => state.setGamePriority);
  const reorderPriorities = useLibrary((state) => state.reorderPriorities);
  const addGame = useLibrary((state) => state.addGame);
  const deleteGame = useLibrary((state) => state.deleteGame);
  const clearLibrary = useLibrary((state) => state.clearLibrary);
  const importJson = useLibrary((state) => state.importJson);
  const exportJson = useLibrary((state) => state.exportJson);
  const setSteamCredentials = useLibrary((state) => state.setSteamCredentials);
  const setIgdbCredentials = useLibrary((state) => state.setIgdbCredentials);
  const applySteamPlaytime = useLibrary((state) => state.applySteamPlaytime);
  const refreshSteamIdentity = useLibrary((state) => state.refreshSteamIdentity);
  const themePreferences = useTheme().prefs;
  const motionPreference = useMotion().preference;

  const [m3Ready, setM3Ready] = useState(false);
  const [searchEpoch, setSearchEpoch] = useState(0);
  const [addDialogEpoch, setAddDialogEpoch] = useState(0);
  const [addInitialQuery, setAddInitialQuery] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated) useLibrary.getState().persist();
  }, [hydrated, motionPreference, themePreferences]);

  useEffect(() => {
    void registerM3Components().then(() => setM3Ready(true));
  }, []);

  const visible = useMemo(
    () => applyFiltersAndSort(games, filters, sort),
    [games, filters, sort],
  );
  const selected = games.find((game) => game.id === selectedId) ?? null;

  const onQuery = useCallback(
    (query: string) => {
      setFilters((current) => filtersWithQuery(current, query));
    },
    [setFilters],
  );

  const onAnimatedSort = useCallback(
    (next: typeof sort) => runMotionViewTransition(() => setSort(next)),
    [setSort],
  );

  const openAddDialog = useCallback(
    (initialQuery = "") => {
      setAddInitialQuery(initialQuery);
      setAddDialogEpoch((value) => value + 1);
      setAddOpen(true);
    },
    [setAddOpen],
  );

  const onPwaShareTarget = useCallback(
    (payload: PwaSharePayload) => {
      openAddDialog(payload.kind === "url" ? payload.name ?? payload.query : payload.query);
      return true;
    },
    [openAddDialog],
  );

  const onPwaShortcut = useCallback(
    (action: PwaShortcutAction) => {
      if (action === "add-game") {
        openAddDialog();
      } else if (action === "search") {
        window.requestAnimationFrame(() =>
          document.querySelector<HTMLElement>("m3-search-bar")?.focus(),
        );
      } else {
        runMotionViewTransition(() => {
          setFilters({
            query: "",
            fields: {
              queuePosition: { kind: "queue", selected: ["has"] },
            },
          });
          setSort({ by: "queuePosition", dir: "asc" });
        });
      }
      return true;
    },
    [openAddDialog, setFilters, setSort],
  );

  useLibraryKeyboardShortcuts(openAddDialog);

  const importFile = async (file: File) => {
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const result = importJson(raw);
      toast.success(
        `Importiert: ${result.total} Spiele (${result.added} neu, ${result.updated} aktualisiert, ${result.skipped} übersprungen)`,
      );
    } catch {
      toast.error("JSON konnte nicht importiert werden.");
    }
  };

  if (!hydrated || !m3Ready) {
    return (
      <div className="loading-state">
        <MorphLoader size={56} label="Bibliothek wird geladen" />
        <p>Lädt …</p>
      </div>
    );
  }

  const onFilterChange = (next: typeof filters) => {
    if (!next.query && filters.query) setSearchEpoch((value) => value + 1);
    runMotionViewTransition(() => setFilters(next));
  };

  const onClearFilters = () => {
    runMotionViewTransition(() => {
      clearFilters();
      setSearchEpoch((value) => value + 1);
    });
  };

  return (
    <div className="library-app">
      <LibraryWorkspace
        games={games}
        visibleGames={visible}
        filters={filters}
        sort={sort}
        selectedId={selectedId}
        searchEpoch={searchEpoch}
        onQuery={onQuery}
        onSort={onAnimatedSort}
        onImport={(file) => void importFile(file)}
        onExport={exportJson}
        onSettings={() => setSettingsOpen(true)}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        onOpenAdd={() => openAddDialog()}
        onOpenGame={openEditor}
        onSelectGame={selectGame}
        onReorder={reorderPriorities}
      />
      {editorOpen && selected ? (
        <GameEditor
          game={selected}
          games={games}
          visibleGames={visible}
          open
          onClose={closeEditor}
          onSelect={selectGame}
          onChange={updateGame}
          onPriority={setGamePriority}
          onDelete={deleteGame}
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
          onImport={(file) => void importFile(file)}
          onExport={exportJson}
        />
      ) : null}
      <PwaShell onShareTarget={onPwaShareTarget} onShortcut={onPwaShortcut} />
      <SnackbarHost />
    </div>
  );
}
