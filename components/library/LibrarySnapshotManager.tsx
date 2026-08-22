"use client";

import { useCallback, useEffect, useState } from "react";
import { SnapshotManager } from "@/components/snapshots";
import { toastWithUndo } from "@/components/undo";
import type { StoredLibrarySnapshot } from "@/lib/persistence/snapshots";
import {
  getLibrarySnapshotRepository,
  libraryUndoHistory,
} from "@/lib/runtime/library-runtime";
import { libraryRepository } from "@/lib/storage";
import { useLibrary } from "@/store/library";

export function LibrarySnapshotManager() {
  const [snapshots, setSnapshots] = useState<StoredLibrarySnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setSnapshots(await getLibrarySnapshotRepository().list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void getLibrarySnapshotRepository().list().then((items) => {
      if (active) setSnapshots(items);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const currentDocument = () => libraryRepository.load() ?? libraryRepository.empty();

  return (
    <SnapshotManager
      snapshots={snapshots}
      loading={loading}
      onReload={reload}
      onCreate={async () => {
        await getLibrarySnapshotRepository().create("manual", currentDocument(), {
          protected: true,
        });
        await reload();
      }}
      onProtectionChange={async (id, protectedValue) => {
        await getLibrarySnapshotRepository().setProtected(id, protectedValue);
        await reload();
      }}
      onDelete={async (id) => {
        await getLibrarySnapshotRepository().remove(id);
        await reload();
      }}
      onRestore={async (id) => {
        const before = currentDocument();
        const prepared = await getLibrarySnapshotRepository().prepareRestore(id, before);
        useLibrary.getState().applyLibraryDocument(prepared.document);
        libraryUndoHistory.record("Snapshot wiederherstellen", before, prepared.document);
        await reload();
        toastWithUndo("Snapshot wiederhergestellt. Sicherheitssnapshot wurde erstellt.");
      }}
    />
  );
}
