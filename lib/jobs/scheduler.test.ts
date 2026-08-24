import { describe, expect, it } from "vitest";
import { JobRepository, MemoryJobStorage } from "./repository";
import { JobScheduler } from "./scheduler";
import { createQueuedJob } from "./state";

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

async function waitFor(condition: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20 && !condition(); attempt += 1) {
    await flush();
  }
}

describe("JobScheduler", () => {
  it("enforces configured parallelism and completes queued work", async () => {
    const scheduler = new JobScheduler(
      new JobRepository(new MemoryJobStorage()),
      { concurrency: 2 },
    );
    let running = 0;
    let maximum = 0;
    const release: Array<() => void> = [];
    scheduler.register("work", async () => {
      running += 1;
      maximum = Math.max(maximum, running);
      await new Promise<void>((resolve) => release.push(resolve));
      running -= 1;
    });
    for (const id of ["one", "two", "three"]) {
      await scheduler.enqueue(createQueuedJob({ id, kind: "work", payload: {} }));
    }

    await scheduler.start();
    await flush();
    expect(running).toBe(2);
    release.shift()?.();
    await flush();
    await waitFor(() => running === 2);
    expect(maximum).toBe(2);
    expect(running).toBe(2);
    release.splice(0).forEach((resolve) => resolve());
    await scheduler.waitForIdle();

    expect(scheduler.list().map((job) => job.state)).toEqual([
      "succeeded",
      "succeeded",
      "succeeded",
    ]);
  });

  it("pauses running work offline and resumes it only when the app is online", async () => {
    const storage = new MemoryJobStorage();
    const scheduler = new JobScheduler(new JobRepository(storage));
    let attempts = 0;
    scheduler.register("network", async ({ signal }) => {
      attempts += 1;
      if (attempts === 1) {
        await new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve()));
      }
    });
    await scheduler.enqueue(createQueuedJob({ id: "one", kind: "network", payload: {} }));
    await scheduler.start();
    await flush();

    await scheduler.setOnline(false);
    await scheduler.waitForIdle();
    expect(scheduler.get("one")).toMatchObject({ state: "paused", pauseReason: "offline" });
    expect((await storage.get("one"))?.state).toBe("paused");

    await scheduler.setOnline(true);
    await scheduler.waitForIdle();
    expect(scheduler.get("one")?.state).toBe("succeeded");
    expect(attempts).toBe(2);
  });

  it("cancels an abortable task without turning abort into a failure", async () => {
    const scheduler = new JobScheduler(new JobRepository(new MemoryJobStorage()));
    scheduler.register("work", async ({ signal }) => {
      await new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve()));
    });
    await scheduler.enqueue(createQueuedJob({ id: "one", kind: "work", payload: {} }));
    await scheduler.start();
    await flush();

    expect(await scheduler.cancel("one")).toBe(true);
    await scheduler.waitForIdle();

    expect(scheduler.get("one")?.state).toBe("cancelled");
    expect(scheduler.get("one")?.errors).toEqual([]);
  });

  it("retries a failed job on demand and preserves separated progress counts", async () => {
    const scheduler = new JobScheduler(new JobRepository(new MemoryJobStorage()));
    let attempts = 0;
    scheduler.register("work", async ({ reportProgress }) => {
      attempts += 1;
      if (attempts === 1) throw new Error("first attempt failed");
      await reportProgress({ processed: 3, remaining: 2, failed: 1, total: 6 });
    });
    await scheduler.enqueue(createQueuedJob({ id: "one", kind: "work", payload: {} }));
    await scheduler.start();
    await scheduler.waitForIdle();
    expect(scheduler.get("one")?.state).toBe("failed");

    expect(await scheduler.retry("one")).toBe(true);
    await scheduler.waitForIdle();

    expect(scheduler.get("one")).toMatchObject({
      state: "succeeded",
      progress: { processed: 3, remaining: 2, failed: 1, total: 6 },
    });
    expect(attempts).toBe(2);
  });
});
