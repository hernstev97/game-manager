import { describe, expect, it } from "vitest";
import { JobRepository, MemoryJobStorage } from "./repository";
import { createQueuedJob, type PersistableJobRecord } from "./state";

describe("JobRepository", () => {
  it("rehydrates a foreign running marker as interrupted and persists the repair", async () => {
    const queued = createQueuedJob({ id: "one", kind: "metadata", payload: {} });
    const legacy = { ...queued, state: "running" } as PersistableJobRecord;
    const storage = new MemoryJobStorage([legacy]);
    const repository = new JobRepository(storage);

    const [job] = await repository.hydrate();

    expect(job.state).toBe("interrupted");
    expect(job.pauseReason).toBe("app-closed");
    expect((await storage.get("one"))?.state).toBe("interrupted");
  });

  it("never writes a running session state", async () => {
    const storage = new MemoryJobStorage();
    const repository = new JobRepository(storage);
    const running = {
      ...createQueuedJob({ id: "one", kind: "metadata", payload: {} }),
      state: "running" as const,
    };

    await repository.save(running);

    expect((await storage.get("one"))?.state).toBe("interrupted");
  });
});
