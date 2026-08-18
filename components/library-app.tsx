"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useLibrary } from "@/store/library";
import { applyFiltersAndSort } from "@/lib/filter-games";
import { LibraryToolbar, filtersWithQuery } from "@/components/library-toolbar";
import { FilterBar } from "@/components/filter-bar";
import { GameList } from "@/components/game-list";
import { GameEditor } from "@/components/game-editor";
import { AddGameDialog } from "@/components/add-game-dialog";
import { SettingsDialog } from "@/components/settings-dialog";

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
  const resetToSeed = useLibrary((state) => state.resetToSeed);
  const importJson = useLibrary((state) => state.importJson);
  const exportJson = useLibrary((state) => state.exportJson);
  const setSteamCredentials = useLibrary((state) => state.setSteamCredentials);
  const applySteamPlaytime = useLibrary((state) => state.applySteamPlaytime);
  const refreshSteamIdentity = useLibrary((state) => state.refreshSteamIdentity);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const visible = useMemo(
    () => applyFiltersAndSort(games, filters, sort),
    [games, filters, sort],
  );
  const selected = games.find((game) => game.id === selectedId) ?? null;
  const [searchEpoch, setSearchEpoch] = useState(0);

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
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (typing) {
        if (event.key === "Escape") (target as HTMLElement).blur();
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
        document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
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

  if (!hydrated) {
    return (
      <div className="library-shell">
        <div className="library-toolbar">
          <div className="toolbar-title">
            <h1>Bibliothek</h1>
            <p>Lädt …</p>
          </div>
        </div>
        <div className="game-list">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="game-row is-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="library-shell">
      <LibraryToolbar
        key={searchEpoch}
        query={filters.query}
        sort={sort}
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
      <GameList
        games={visible}
        selectedId={selectedId}
        sortByPriority={sort.by === "priority"}
        onOpen={openEditor}
        onSelect={selectGame}
        onReorder={reorderPriorities}
        onClearFilters={() => {
          clearFilters();
          setSearchEpoch((value) => value + 1);
        }}
      />
      <button type="button" className="fab" aria-label="Spiel hinzufügen" onClick={() => setAddOpen(true)}>
        <Plus size={26} />
      </button>
      <GameEditor
        game={selected}
        games={games}
        open={editorOpen && Boolean(selected)}
        onClose={closeEditor}
        onChange={updateGame}
        onPriority={setGamePriority}
        onDelete={deleteGame}
      />
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
          onReset={resetToSeed}
          onApplyPlaytime={applySteamPlaytime}
          onRefreshIdentity={refreshSteamIdentity}
        />
      ) : null}
      <Toaster position="bottom-left" richColors closeButton />
    </div>
  );
}
