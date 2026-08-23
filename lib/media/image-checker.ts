import {
  TRANSIENT_IMAGE_CHECK_RESULTS,
  type ImageCheck,
  type ImageCheckResult,
} from "@/lib/model";
import { normalizeRemoteImageUrl } from "@/lib/media/remote-url";

export type CheckableImage = {
  src: string;
  onload: HTMLImageElement["onload"];
  onerror: HTMLImageElement["onerror"];
  decode?: () => Promise<void>;
};

export type StatusResponse = {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
};

export type ImageCheckerDependencies = {
  createImage: () => CheckableImage;
  fetchStatus?: (url: string, init: RequestInit) => Promise<StatusResponse>;
  isOnline: () => boolean;
  now: () => number;
  setTimer: (callback: () => void, milliseconds: number) => unknown;
  clearTimer: (handle: unknown) => void;
};

export type ImageCheckerOptions = {
  concurrency?: number;
  timeoutMs?: number;
  transientTtlMs?: number;
  statusCheckOnError?: boolean;
  dependencies?: Partial<ImageCheckerDependencies>;
};

type CacheEntry = { check: ImageCheck; expiresAt: number };

const defaultDependencies: ImageCheckerDependencies = {
  createImage: () => new Image(),
  fetchStatus: (url, init) => fetch(url, init),
  isOnline: () => typeof navigator === "undefined" || navigator.onLine,
  now: () => Date.now(),
  setTimer: (callback, milliseconds) => setTimeout(callback, milliseconds),
  clearTimer: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

function isTransient(result: ImageCheckResult): boolean {
  return (TRANSIENT_IMAGE_CHECK_RESULTS as readonly ImageCheckResult[]).includes(result);
}

export class ImageChecker {
  private readonly deps: ImageCheckerDependencies;
  private readonly concurrency: number;
  private readonly timeoutMs: number;
  private readonly transientTtlMs: number;
  private readonly statusCheckOnError: boolean;
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Promise<ImageCheck>>();

  constructor(options: ImageCheckerOptions = {}) {
    this.deps = { ...defaultDependencies, ...options.dependencies };
    this.concurrency = Math.max(1, Math.min(8, Math.floor(options.concurrency ?? 3)));
    this.timeoutMs = Math.max(1, options.timeoutMs ?? 8_000);
    this.transientTtlMs = Math.max(0, options.transientTtlMs ?? 60_000);
    this.statusCheckOnError = options.statusCheckOnError ?? true;
  }

  invalidate(url?: string): void {
    if (url === undefined) {
      this.cache.clear();
      return;
    }
    const normalized = normalizeRemoteImageUrl(url);
    if (normalized) this.cache.delete(normalized);
  }

  async retry(url: string): Promise<ImageCheck> {
    this.invalidate(url);
    return this.check(url, true);
  }

  async check(url: string, force = false): Promise<ImageCheck> {
    const normalized = normalizeRemoteImageUrl(url);
    if (!normalized) return this.result("invalid-content");
    if (!force) {
      const cached = this.cache.get(normalized);
      if (cached && cached.expiresAt > this.deps.now()) return cached.check;
      const active = this.inFlight.get(normalized);
      if (active) return active;
    }
    const task = this.performCheck(normalized).then((check) => {
      this.cache.set(normalized, {
        check,
        expiresAt: isTransient(check.result)
          ? this.deps.now() + this.transientTtlMs
          : Number.POSITIVE_INFINITY,
      });
      return check;
    });
    this.inFlight.set(normalized, task);
    try {
      return await task;
    } finally {
      if (this.inFlight.get(normalized) === task) this.inFlight.delete(normalized);
    }
  }

  async checkMany(urls: readonly string[]): Promise<Map<string, ImageCheck>> {
    const unique = [...new Set(urls)];
    const output = new Map<string, ImageCheck>();
    let next = 0;
    const worker = async () => {
      while (next < unique.length) {
        const url = unique[next++];
        output.set(url, await this.check(url));
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(this.concurrency, unique.length) }, () => worker()),
    );
    return output;
  }

  private result(result: ImageCheckResult): ImageCheck {
    return { result, checkedAt: new Date(this.deps.now()).toISOString() };
  }

  private async performCheck(url: string): Promise<ImageCheck> {
    if (!this.deps.isOnline()) return this.result("offline");
    const loaded = await this.loadImage(url);
    if (loaded === "timeout") return this.result("timeout");
    if (loaded === "ok") return this.result("ok");
    if (!this.deps.isOnline()) return this.result("offline");
    if (!this.statusCheckOnError || !this.deps.fetchStatus) {
      return this.result("network-error");
    }
    return this.result(await this.classifyGet(url));
  }

  private loadImage(url: string): Promise<"ok" | "error" | "timeout"> {
    return new Promise((resolve) => {
      let settled = false;
      let image: CheckableImage = { src: "", onload: null, onerror: null };
      const finish = (value: "ok" | "error" | "timeout") => {
        if (settled) return;
        settled = true;
        this.deps.clearTimer(timer);
        image.onload = null;
        image.onerror = null;
        resolve(value);
      };
      const timer = this.deps.setTimer(() => finish("timeout"), this.timeoutMs);
      try {
        image = this.deps.createImage();
        image.onload = () => {
          if (!image.decode) return finish("ok");
          void image.decode().then(() => finish("ok"), () => finish("error"));
        };
        image.onerror = () => finish("error");
        image.src = url;
      } catch {
        finish("error");
      }
    });
  }

  private async classifyGet(url: string): Promise<ImageCheckResult> {
    const controller = typeof AbortController === "undefined" ? undefined : new AbortController();
    const request = this.deps.fetchStatus!(url, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      signal: controller?.signal,
    });
    const timeout = new Promise<"timeout">((resolve) => {
      const handle = this.deps.setTimer(() => {
        controller?.abort();
        resolve("timeout");
      }, this.timeoutMs);
      void request.then(
        () => this.deps.clearTimer(handle),
        () => this.deps.clearTimer(handle),
      );
    });
    try {
      const response = await Promise.race([request, timeout]);
      if (response === "timeout") return "timeout";
      if (response.status === 404 || response.status === 410) return "not-found";
      if (response.status === 429) return "rate-limited";
      if (response.status === 401 || response.status === 403) return "blocked";
      if (!response.ok) return "network-error";
      return "invalid-content";
    } catch {
      return this.deps.isOnline() ? "network-error" : "offline";
    }
  }
}
