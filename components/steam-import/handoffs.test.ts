import { describe, expect, it, vi } from "vitest";
import type { SteamImportPlan } from "@/lib/steam-import";
import { runSteamImportHandoffs } from "./handoffs";

function handoffPlan(): SteamImportPlan {
  return {
    jobs: [{ id: "job-1" }],
    reviewHandoff: {
      proposals: [],
      preview: { metadata: [{ fieldId: "name" }], volatilePrices: [] },
    },
  } as unknown as SteamImportPlan;
}

describe("Steam import callback handoffs", () => {
  it("passes prepared jobs and metadata review without transforming payloads", async () => {
    const onJobsPrepared = vi.fn();
    const onReviewHandoff = vi.fn();
    const plan = handoffPlan();
    const result = await runSteamImportHandoffs(plan, {
      onJobsPrepared,
      onReviewHandoff,
    });

    expect(result).toEqual({
      jobs: "prepared",
      review: "prepared",
      warnings: [],
    });
    expect(onJobsPrepared).toHaveBeenCalledWith(plan.jobs);
    expect(onReviewHandoff).toHaveBeenCalledWith(plan.reviewHandoff);
  });

  it("reports post-import handoff failures without exposing error text", async () => {
    const result = await runSteamImportHandoffs(handoffPlan(), {
      onJobsPrepared: () => {
        throw new Error("apiKey=private");
      },
      onReviewHandoff: () => {
        throw new Error("token=private");
      },
    });

    expect(result.jobs).toBe("failed");
    expect(result.review).toBe("failed");
    expect(result.warnings.join(" ")).not.toMatch(/private|apiKey|token/);
  });
});
