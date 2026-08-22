"use client";

import { useCallback, useState } from "react";
import type { PlanningMode, QueueInsertion } from "@/components/planning";
import { libraryUndoHistory } from "@/lib/runtime/library-runtime";
import { libraryRepository } from "@/lib/storage";
import { useLibrary } from "@/store/library";
import { toastWithUndo } from "@/components/undo";

function recordPlanningMutation(label: string, mutate: () => void): void {
  const before = libraryRepository.load();
  mutate();
  const after = libraryRepository.load();
  if (before && after && libraryUndoHistory.record(label, before, after)) {
    toastWithUndo(`${label}.`);
  }
}

export function useLibraryPlanning() {
  const endSelection = useLibrary((state) => state.endSelection);
  const setFavoriteRank = useLibrary((state) => state.setFavoriteRank);
  const insertGameQueueFirst = useLibrary((state) => state.insertGameQueueFirst);
  const insertGameQueueLast = useLibrary((state) => state.insertGameQueueLast);
  const removeGameFromQueue = useLibrary((state) => state.removeGameFromQueue);
  const reorderQueue = useLibrary((state) => state.reorderQueue);
  const reorderFavoriteRanks = useLibrary((state) => state.reorderFavoriteRanks);
  const [planningMode, setPlanningMode] = useState<PlanningMode>("library");
  const [queueReorderMode, setQueueReorderMode] = useState(false);
  const [favoriteReorderMode, setFavoriteReorderMode] = useState(false);

  const changePlanningMode = useCallback((mode: PlanningMode) => {
    setQueueReorderMode(false);
    setFavoriteReorderMode(false);
    setPlanningMode(mode);
  }, []);
  const openQueue = useCallback(() => {
    endSelection();
    changePlanningMode("queue");
  }, [changePlanningMode, endSelection]);

  return {
    planningMode,
    queueReorderMode,
    favoriteReorderMode,
    changePlanningMode,
    openQueue,
    setQueueReorderMode,
    setFavoriteReorderMode,
    insertQueue: (gameId: string, placement: QueueInsertion) =>
      recordPlanningMutation(
        "Spiel zur Warteschlange hinzugefügt",
        () => placement === "first"
          ? insertGameQueueFirst(gameId)
          : insertGameQueueLast(gameId),
      ),
    removeQueue: (gameId: string) =>
      recordPlanningMutation(
        "Spiel aus Warteschlange entfernt",
        () => removeGameFromQueue(gameId),
      ),
    reorderQueue: (orderedIds: readonly string[]) =>
      recordPlanningMutation("Spielreihenfolge geändert", () => reorderQueue(orderedIds)),
    setFavorite: (gameId: string, rank: number) =>
      recordPlanningMutation(
        "Persönlichen Rang geändert",
        () => setFavoriteRank(gameId, rank),
      ),
    removeFavorite: (gameId: string) =>
      recordPlanningMutation(
        "Persönlichen Rang entfernt",
        () => setFavoriteRank(gameId, null),
      ),
    reorderFavorites: (orderedIds: readonly string[]) =>
      recordPlanningMutation(
        "Persönliches Ranking geändert",
        () => reorderFavoriteRanks(orderedIds),
      ),
  };
}
