export const RATE_LIMIT_SERVICES = ["igdb", "twitch", "steam"] as const;
export type RateLimitService = (typeof RATE_LIMIT_SERVICES)[number];

export type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterRatio: number;
};

export type ServiceRateLimitPolicy = {
  service: RateLimitService;
  maxConcurrency: number;
  minIntervalMs: number;
  headerDriven: boolean;
  retry: RetryPolicy;
  batch?: { endpoint: "/multiquery"; maxQueries: 10 };
};

const DEFAULT_RETRY: RetryPolicy = {
  maxAttempts: 5,
  baseDelayMs: 1_000,
  maxDelayMs: 60_000,
  jitterRatio: 0.2,
};

/** Official IGDB limits: 4 requests/s and at most 8 open requests. */
export const IGDB_RATE_LIMIT_POLICY: ServiceRateLimitPolicy = {
  service: "igdb",
  maxConcurrency: 8,
  minIntervalMs: 250,
  headerDriven: false,
  retry: DEFAULT_RETRY,
  batch: { endpoint: "/multiquery", maxQueries: 10 },
};

/** Twitch publishes bucket headers, not one fixed limit for every endpoint. */
export const TWITCH_RATE_LIMIT_POLICY: ServiceRateLimitPolicy = {
  service: "twitch",
  // No provider-specific numeric cap is assumed; the scheduler's low global
  // concurrency still applies while bucket headers drive provider throttling.
  maxConcurrency: Number.MAX_SAFE_INTEGER,
  minIntervalMs: 0,
  headerDriven: true,
  retry: DEFAULT_RETRY,
};

export type SteamRateLimitOverrides = Partial<
  Pick<ServiceRateLimitPolicy, "maxConcurrency" | "minIntervalMs" | "retry">
>;

/**
 * A conservative, configurable local policy. Valve publishes no general
 * numeric Web API limit, so response headers and 429 always take precedence.
 */
export function createSteamRateLimitPolicy(
  overrides: SteamRateLimitOverrides = {},
): ServiceRateLimitPolicy {
  return {
    service: "steam",
    maxConcurrency: Math.max(1, overrides.maxConcurrency ?? 2),
    minIntervalMs: Math.max(0, overrides.minIntervalMs ?? 1_000),
    headerDriven: true,
    retry: overrides.retry ?? {
      ...DEFAULT_RETRY,
      baseDelayMs: 2_000,
      maxDelayMs: 120_000,
    },
  };
}

export const DEFAULT_SERVICE_POLICIES: Record<
  RateLimitService,
  ServiceRateLimitPolicy
> = {
  igdb: IGDB_RATE_LIMIT_POLICY,
  twitch: TWITCH_RATE_LIMIT_POLICY,
  steam: createSteamRateLimitPolicy(),
};
