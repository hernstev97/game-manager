"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLibrary } from "@/store/library";
import { applyFiltersAndSort } from "@/lib/filter-games";
import { LibraryWorkspace } from "@/components/library/LibraryWorkspace";
import { filtersWithQuery } from "@/components/library/LibraryToolbar";
import { registerM3Components } from "@/components/m3/register";
import { SnackbarHost, toast } from "@/components/m3/snackbar";
import { MorphLoader } from "@/components/morph-loader";
import { runMotionViewTransition, useMotion } from "@/components/motion-provider";
import { PwaShell, type PwaSharePayload, type PwaShortcutAction } from "@/components/pwa";
import { useTheme } from "@/components/theme-provider";
import { useLibraryKeyboardShortcuts } from "@/components/library/useLibraryKeyboardShortcuts";
import { LibraryBulkActions } from "@/components/bulk-actions/LibraryBulkActions";
import { LibraryDialogs } from "@/components/library/LibraryDialogs";
import { BackupImportDialog } from "@/components/import-export/BackupImportDialog";

export function LibraryApp() {
  const hydrated = useLibrary((state) => state.hydrated);
  const games = useLibrary((state) => state.games);
  const filters = useLibrary((state) => state.filters);
  const sort = useLibrary((state) => state.sort);
  const savedViews = useLibrary((state) => state.savedViews);
  const activeViewId = useLibrary((state) => state.activeViewId);
  const displayMode = useLibrary((state) => state.displayMode);
  const groupBy = useLibrary((state) => state.groupBy);
  const franchises = useLibrary((state) => state.franchises);
  const selectionMode = useLibrary((state) => state.selectionMode);
  const selectedIds = useLibrary((state) => state.selectedIds);
  const dndDisabled = useLibrary((state) => state.dndDisabled);
  const selectedId = useLibrary((state) => state.selectedId);

  const hydrate = useLibrary((state) => state.hydrate);
  const setFilters = useLibrary((state) => state.setFilters);
  const clearFilters = useLibrary((state) => state.clearFilters);
  const setSort = useLibrary((state) => state.setSort);
  const setSavedViews = useLibrary((state) => state.setSavedViews);
  const selectSavedView = useLibrary((state) => state.selectSavedView);
  const setDisplayMode = useLibrary((state) => state.setDisplayMode);
  const setGroupBy = useLibrary((state) => state.setGroupBy);
  const setFranchisePresentation = useLibrary((state) => state.setFranchisePresentation);
  const startSelection = useLibrary((state) => state.startSelection);
  const endSelection = useLibrary((state) => state.endSelection);
  const toggleSelection = useLibrary((state) => state.toggleSelection);
  const selectGame = useLibrary((state) => state.selectGame);
  const openEditor = useLibrary((state) => state.openEditor);
  const setAddOpen = useLibrary((state) => state.setAddOpen);
  const setSettingsOpen = useLibrary((state) => state.setSettingsOpen);
  const reorderPriorities = useLibrary((state) => state.reorderPriorities);
  const exportJson = useLibrary((state) => state.exportJson);
  const themePreferences = useTheme().prefs;
  const motionPreference = useMotion().preference;

  const [m3Ready, setM3Ready] = useState(false);
  const [searchEpoch, setSearchEpoch] = useState(0);
  const [addDialogEpoch, setAddDialogEpoch] = useState(0);
  const [addInitialQuery, setAddInitialQuery] = useState("");
  const [importCandidate, setImportCandidate] = useState<{ raw: unknown; fileName: string } | null>(null);

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
      setImportCandidate({ raw, fileName: file.name });
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
        savedViews={savedViews}
        activeViewId={activeViewId}
        displayMode={displayMode}
        groupBy={groupBy}
        franchises={franchises}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        dndDisabled={dndDisabled}
        selectedId={selectedId}
        searchEpoch={searchEpoch}
        onQuery={onQuery}
        onSort={onAnimatedSort}
        onSavedViews={setSavedViews}
        onSelectView={selectSavedView}
        onDisplayMode={setDisplayMode}
        onGroupBy={setGroupBy}
        onSelectionMode={(enabled) => enabled ? startSelection(selectedId ?? undefined) : endSelection()}
        onImport={(file) => void importFile(file)}
        onExport={exportJson}
        onSettings={() => setSettingsOpen(true)}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        onOpenAdd={() => openAddDialog()}
        onOpenGame={openEditor}
        onSelectGame={selectGame}
        onToggleSelection={toggleSelection}
        onReorder={reorderPriorities}
        onFranchisePresentation={setFranchisePresentation}
      />
      <LibraryBulkActions visibleGames={visible} />
      <LibraryDialogs
        visibleGames={visible}
        addDialogEpoch={addDialogEpoch}
        addInitialQuery={addInitialQuery}
        onImport={(file) => void importFile(file)}
      />
      {importCandidate ? (
        <BackupImportDialog
          open
          raw={importCandidate.raw}
          fileName={importCandidate.fileName}
          onClose={() => setImportCandidate(null)}
          onApplied={({ games: gameCount, views: viewCount, mode }) => {
            setImportCandidate(null);
            toast.success(
              `${mode === "replace" ? "Wiederhergestellt" : "Zusammengeführt"}: ${gameCount} Spiele, ${viewCount} Ansichten.`,
            );
          }}
        />
      ) : null}
      <PwaShell onShareTarget={onPwaShareTarget} onShortcut={onPwaShortcut} />
      <SnackbarHost />
    </div>
  );
}
