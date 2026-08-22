import type { JobProgress } from "../model";
import type {
  RateLimitService,
  RetryPolicy,
  ServiceRateLimitPolicy,
} from "../rate-limit";
import type { RuntimeJob } from "./state";

export type JobTaskContext = {
  job: RuntimeJob;
  signal: AbortSignal;
  reportProgress(progress: JobProgress): Promise<void>;
};

export type JobTask = (context: JobTaskContext) => Promise<void>;

export type JobDefinitionOptions = {
  service?: RateLimitService;
  retry?: RetryPolicy;
};

export type JobSchedulerOptions = {
  concurrency?: number;
  now?: () => number;
  random?: () => number;
  servicePolicies?: Partial<Record<RateLimitService, ServiceRateLimitPolicy>>;
};
