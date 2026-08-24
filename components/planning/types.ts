import type { LibraryGameRecordV2 } from "@/lib/model/shared";

export const PLANNING_MODES = ["library", "queue", "favorites"] as const;

export type PlanningMode = (typeof PLANNING_MODES)[number];

export type QueueInsertion = "first" | "last";

export type PlanningPositionField = "queuePosition" | "favoriteRank";

/** Minimal library-game projection consumed by the planning views. */
export type PlanningGame = Pick<
  LibraryGameRecordV2,
  | "id"
  | "name"
  | "coverUrl"
  | "steamAppId"
  | "owned"
  | "wishlisted"
  | "played"
  | "finished"
  | "queuePosition"
  | "favoriteRank"
>;
