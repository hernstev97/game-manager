import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createQueuedJob, type RuntimeJob } from "@/lib/jobs/state";
import { TaskStatusIndicator } from "./TaskStatusIndicator";

function job(state: RuntimeJob["state"]): RuntimeJob {
  return {
    ...createQueuedJob({
      id: `status-${state}`,
      kind: "metadata.steam",
      payload: {},
      createdAt: "2026-08-22T09:00:00.000Z",
    }),
    state,
    ...(state === "failed"
      ? {
          errors: [{
            code: "provider-error",
            message: "Nicht erreichbar",
            count: 1,
            lastOccurredAt: "2026-08-22T09:00:01.000Z",
            retryable: false,
          }],
        }
      : {}),
  };
}

function render(jobs: RuntimeJob[]) {
  return renderToStaticMarkup(createElement(TaskStatusIndicator, {
    jobs,
    isOnline: true,
    onOpen: () => undefined,
  }));
}

describe("TaskStatusIndicator", () => {
  it("keeps the complete idle state in the accessible name", () => {
    const markup = render([]);
    expect(markup).toContain("Keine offenen Aufgaben. Aufgaben-Center öffnen.");
  });

  it("marks running work and exposes progress without changing the control label", () => {
    const markup = render([{ ...job("running"), progress: {
      processed: 2,
      remaining: 2,
      failed: 0,
      total: 4,
    } }]);
    expect(markup).toContain("status-running");
    expect(markup).toContain("--compact-progress:50%");
    expect(markup).toContain("läuft. Aufgaben-Center öffnen.");
  });

  it("marks failed work with an error badge and accessible state", () => {
    const markup = render([job("failed")]);
    expect(markup).toContain("status-failed");
    expect(markup).toContain("Aufgabe fehlgeschlagen. Aufgaben-Center öffnen.");
    expect(markup).toMatch(/badge[^>]*>1</);
  });
});
