import type { ImportApplyResult } from "@/lib/model";
import type {
  SteamImportHandoffStatus,
  SteamImportPlan,
  SteamImportReport,
} from "./types";

export function createSteamImportReport(
  plan: SteamImportPlan,
  result: ImportApplyResult,
  handoffs: {
    jobs: SteamImportHandoffStatus;
    review: SteamImportHandoffStatus;
    warnings?: readonly string[];
  },
): SteamImportReport {
  return {
    importPlanId: plan.id,
    appliedAt: result.appliedAt,
    added: plan.operations.filter((operation) => operation.kind === "add").length,
    updated: plan.operations.filter((operation) => operation.kind === "update").length,
    skipped: Math.max(0, plan.selectedAppIds.length - plan.operations.length),
    jobsPrepared: plan.jobs.length,
    reviewChangesPrepared:
      plan.reviewHandoff.preview.metadata.length +
      plan.reviewHandoff.preview.volatilePrices.length,
    jobsHandoff: handoffs.jobs,
    reviewHandoff: handoffs.review,
    items: plan.operations.map((operation) => ({
      steamAppId: operation.steamAppId,
      gameId: operation.targetGameId,
      status: operation.kind === "add" ? "added" : "updated",
    })),
    warnings: [...(handoffs.warnings ?? [])],
  };
}
