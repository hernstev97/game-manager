import type {
  SteamImportHandoffStatus,
  SteamImportPlan,
  SteamImportWizardProps,
} from "@/lib/steam-import/types";

export async function runSteamImportHandoffs(
  plan: SteamImportPlan,
  callbacks: Pick<
    SteamImportWizardProps,
    "onJobsPrepared" | "onReviewHandoff"
  >,
): Promise<{
  jobs: SteamImportHandoffStatus;
  review: SteamImportHandoffStatus;
  warnings: string[];
}> {
  const handoffJobs = async (): Promise<{
    status: SteamImportHandoffStatus;
    warning?: string;
  }> => {
    if (plan.jobs.length === 0 || !callbacks.onJobsPrepared) {
      return { status: "not-requested" };
    }
    try {
      await callbacks.onJobsPrepared(plan.jobs);
      return { status: "prepared" };
    } catch {
      return {
        status: "failed",
        warning:
          "Der Bibliotheksimport war erfolgreich, Detail-/Coverjobs konnten aber nicht übergeben werden.",
      };
    }
  };
  const reviewCount =
    plan.reviewHandoff.preview.metadata.length +
    plan.reviewHandoff.preview.volatilePrices.length;
  const handoffReview = async (): Promise<{
    status: SteamImportHandoffStatus;
    warning?: string;
  }> => {
    if (reviewCount === 0 || !callbacks.onReviewHandoff) {
      return { status: "not-requested" };
    }
    try {
      await callbacks.onReviewHandoff(plan.reviewHandoff);
      return { status: "prepared" };
    } catch {
      return {
        status: "failed",
        warning:
          "Der Bibliotheksimport war erfolgreich, Metadatenvorschläge konnten aber nicht übergeben werden.",
      };
    }
  };
  const [jobs, review] = await Promise.all([handoffJobs(), handoffReview()]);
  return {
    jobs: jobs.status,
    review: review.status,
    warnings: [jobs.warning, review.warning].filter(
      (warning): warning is string => warning !== undefined,
    ),
  };
}
