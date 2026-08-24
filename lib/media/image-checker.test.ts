import { describe, expect, it, vi } from "vitest";
import { ImageChecker, type CheckableImage, type ImageCheckerDependencies } from "@/lib/media/image-checker";

function loadImage(outcome: "load" | "error", decode: "ok" | "error" = "ok") {
  return () => {
    let source = "";
    const image: CheckableImage = {
      get src() { return source; },
      set src(value) {
        source = value;
        queueMicrotask(() => {
          const handler = outcome === "load" ? image.onload : image.onerror;
          if (typeof handler === "function") (handler as (event: Event) => void)(new Event(outcome));
        });
      },
      onload: null,
      onerror: null,
      decode: () => decode === "ok" ? Promise.resolve() : Promise.reject(new Error("decode")),
    };
    return image;
  };
}

function dependencies(overrides: Partial<ImageCheckerDependencies> = {}): Partial<ImageCheckerDependencies> {
  return {
    createImage: loadImage("load"),
    isOnline: () => true,
    now: () => Date.parse("2026-08-22T10:00:00.000Z"),
    ...overrides,
  };
}

function response(status: number, contentType = "image/jpeg") {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => name.toLowerCase() === "content-type" ? contentType : null },
  };
}

describe("ImageChecker classification", () => {
  it("loads and decodes the image instead of relying on HEAD", async () => {
    const fetchStatus = vi.fn();
    const checker = new ImageChecker({ dependencies: dependencies({ fetchStatus }) });
    await expect(checker.check("https://images.test/ok.jpg")).resolves.toMatchObject({ result: "ok" });
    expect(fetchStatus).not.toHaveBeenCalled();
  });

  it("classifies decode failures and GET-visible HTTP failures", async () => {
    const invalid = new ImageChecker({
      dependencies: dependencies({ createImage: loadImage("load", "error"), fetchStatus: async () => response(200) }),
    });
    await expect(invalid.check("https://images.test/not-image")).resolves.toMatchObject({ result: "invalid-content" });

    const fetchStatus = vi.fn(async () => response(404, "text/html"));
    const missing = new ImageChecker({
      dependencies: dependencies({ createImage: loadImage("error"), fetchStatus }),
    });
    await expect(missing.check("https://images.test/missing.jpg")).resolves.toMatchObject({ result: "not-found" });
    expect(fetchStatus).toHaveBeenCalledWith(
      "https://images.test/missing.jpg",
      expect.objectContaining({ method: "GET", mode: "cors" }),
    );
  });

  it("keeps offline separate from network, timeout, and invalid URL results", async () => {
    const offline = new ImageChecker({ dependencies: dependencies({ isOnline: () => false }) });
    await expect(offline.check("https://images.test/offline.jpg")).resolves.toMatchObject({ result: "offline" });
    await expect(offline.check("data:image/png;base64,abc")).resolves.toMatchObject({ result: "invalid-content" });

    const network = new ImageChecker({
      dependencies: dependencies({
        createImage: loadImage("error"),
        fetchStatus: async () => { throw new TypeError("CORS or network"); },
      }),
    });
    await expect(network.check("https://images.test/network.jpg")).resolves.toMatchObject({ result: "network-error" });
  });

  it("classifies an image load that exceeds the configured timeout", async () => {
    vi.useFakeTimers();
    try {
      const checker = new ImageChecker({
        timeoutMs: 50,
        dependencies: dependencies({
          createImage: () => ({ src: "", onload: null, onerror: null }),
        }),
      });
      const result = checker.check("https://images.test/slow.jpg");
      await vi.advanceTimersByTimeAsync(50);
      await expect(result).resolves.toMatchObject({ result: "timeout" });
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("ImageChecker cache, retry, and concurrency", () => {
  it("expires only transient results by TTL and retry invalidates immediately", async () => {
    let now = 1_000;
    let online = false;
    const createImage = vi.fn(loadImage("load"));
    const checker = new ImageChecker({
      transientTtlMs: 100,
      dependencies: dependencies({ createImage, isOnline: () => online, now: () => now }),
    });

    await expect(checker.check("https://images.test/a.jpg")).resolves.toMatchObject({ result: "offline" });
    online = true;
    now = 1_050;
    await expect(checker.check("https://images.test/a.jpg")).resolves.toMatchObject({ result: "offline" });
    expect(createImage).not.toHaveBeenCalled();

    await expect(checker.retry("https://images.test/a.jpg")).resolves.toMatchObject({ result: "ok" });
    expect(createImage).toHaveBeenCalledTimes(1);

    now = 1_200;
    await checker.check("https://images.test/a.jpg");
    expect(createImage).toHaveBeenCalledTimes(1);
  });

  it("checks only supplied URLs and respects configured parallelism", async () => {
    const pending: CheckableImage[] = [];
    let active = 0;
    let maximum = 0;
    const createImage = () => {
      let source = "";
      const image: CheckableImage = {
        get src() { return source; },
        set src(value) { source = value; active += 1; maximum = Math.max(maximum, active); pending.push(image); },
        onload: null,
        onerror: null,
      };
      return image;
    };
    const checker = new ImageChecker({ concurrency: 2, dependencies: dependencies({ createImage }) });
    const task = checker.checkMany([
      "https://images.test/1.jpg",
      "https://images.test/2.jpg",
      "https://images.test/3.jpg",
      "https://images.test/4.jpg",
    ]);
    await vi.waitFor(() => expect(pending).toHaveLength(2));
    const completeWave = () => pending.splice(0).forEach((image) => {
      active -= 1;
      if (typeof image.onload === "function") (image.onload as (event: Event) => void)(new Event("load"));
    });
    completeWave();
    await vi.waitFor(() => expect(pending).toHaveLength(2));
    completeWave();
    await task;
    expect(maximum).toBe(2);
  });
});
