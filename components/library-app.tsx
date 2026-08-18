"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLibrary } from "@/store/library";
import { applyFiltersAndSort } from "@/lib/filter-games";
import { LibraryToolbar, filtersWithQuery } from "@/components/library-toolbar";
import { FilterBar } from "@/components/filter-bar";
import { GameList } from "@/components/game-list";
import { GameEditor } from "@/components/game-editor";
import { AddGameDialog } from "@/components/add-game-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import { registerM3Components } from "@/components/m3/register";
import { IconAdd } from "@/components/m3/icons";
import { SnackbarHost, toast } from "@/components/m3/snackbar";
import { MorphLoader } from "@/components/morph-loader";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    target.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    tag === "M3-TEXT-FIELD" ||
    tag === "M3-SEARCH-BAR" ||
    tag === "M3-SLIDER"
  );
}

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
  const applySteamPlaytime = useLibrary((state) => state.applySteamPlaytime);
  const refreshSteamIdentity = useLibrary((state) => state.refreshSteamIdentity);

  const [m3Ready, setM3Ready] = useState(false);
  const [searchEpoch, setSearchEpoch] = useState(0);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        if (event.key === "Escape") (event.target as HTMLElement).blur();
        return;
      }
      const state = useLibrary.getState();
      const list = applyFiltersAndSort(state.games, state.filters, state.sort);
      if (event.key === "Escape") {
        if (useLibrary.getState().addOpen) {
          useLibrary.getState().setAddOpen(false);
          return;
        }
        if (useLibrary.getState().settingsOpen) {
          useLibrary.getState().setSettingsOpen(false);
          return;
        }
        if (useLibrary.getState().editorOpen) {
          useLibrary.getState().closeEditor();
          return;
        }
        useLibrary.getState().selectGame(null);
        return;
      }
      if (event.key === "/" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        document.querySelector<HTMLElement>("m3-search-bar")?.focus();
        return;
      }
      if (event.key === "n" && !event.ctrlKey && !event.metaKey) {
        useLibrary.getState().setAddOpen(true);
        return;
      }
      if (list.length === 0) return;
      const currentId = useLibrary.getState().selectedId;
      const index = Math.max(0, list.findIndex((game) => game.id === currentId));
      if (event.key === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        const next = list[Math.min(list.length - 1, (currentId ? index : -1) + 1)];
        if (next) useLibrary.getState().selectGame(next.id);
      }
      if (event.key === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        const next = list[Math.max(0, (currentId ? index : 0) - 1)];
        if (next) useLibrary.getState().selectGame(next.id);
      }
      if (event.key === "Enter" && currentId) {
        useLibrary.getState().openEditor(currentId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!hydrated || !m3Ready) {
    return (
      <div className="loading-state">
        <MorphLoader size={56} label="Bibliothek wird geladen" />
        <p>Lädt …</p>
      </div>
    );
  }

  return (
    <div className="library-app">
      <m3-top-app-bar >
        gGrid
        <m3-button slot="actions" onClick={() => setAddOpen(true)}>
          <IconAdd slot="icon" width={18} height={18} />
          Spiel hinzufügen
        </m3-button>
      </m3-top-app-bar>
      <div className="library-shell">
        <LibraryToolbar
          key={searchEpoch}
          query={filters.query}
          sort={sort}
          totalCount={games.length}
          onQuery={onQuery}
          onSort={setSort}
          onImport={(file) => void importFile(file)}
          onExport={exportJson}
          onSettings={() => setSettingsOpen(true)}
        />
        <FilterBar
          games={games}
          filters={filters}
          visibleCount={visible.length}
          onChange={(next) => {
            if (!next.query && filters.query) setSearchEpoch((value) => value + 1);
            setFilters(next);
          }}
          onClear={() => {
            clearFilters();
            setSearchEpoch((value) => value + 1);
          }}
        />
        <m3-divider />
        <GameList
          games={visible}
          libraryEmpty={games.length === 0}
          selectedId={selectedId}
          sortByPriority={sort.by === "priority"}
          onOpen={openEditor}
          onSelect={selectGame}
          onReorder={reorderPriorities}
          onAdd={() => setAddOpen(true)}
          onClearFilters={() => {
            clearFilters();
            setSearchEpoch((value) => value + 1);
          }}
        />
      </div>
      {editorOpen && selected ? (
        <GameEditor
          game={selected}
          games={games}
          open
          onClose={closeEditor}
          onChange={updateGame}
          onPriority={setGamePriority}
          onDelete={deleteGame}
        />
      ) : null}
      {addOpen ? (
        <AddGameDialog
          open
          games={games}
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
          games={games}
          onSteamCredentials={setSteamCredentials}
          onClearLibrary={clearLibrary}
          onApplyPlaytime={applySteamPlaytime}
          onRefreshIdentity={refreshSteamIdentity}
        />
      ) : null}
      <SnackbarHost />
    </div>
  );
}
