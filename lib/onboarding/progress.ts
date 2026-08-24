export const ONBOARDING_PROGRESS_STORAGE_KEY = "ggrid:onboarding-progress:v1";
export const ONBOARDING_PROGRESS_VERSION = 1 as const;

export const ONBOARDING_STEP_IDS = ["welcome", "local-library", "pwa"] as const;
export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number];

export const ONBOARDING_ACTION_IDS = [
  "import",
  "add-game",
  "connect-steam",
  "later",
] as const;
export type OnboardingActionId = (typeof ONBOARDING_ACTION_IDS)[number];
export type OnboardingStatus = "pending" | "completed" | "dismissed";

export type OnboardingProgress = {
  version: typeof ONBOARDING_PROGRESS_VERSION;
  status: OnboardingStatus;
  completedSteps: OnboardingStepId[];
  selectedAction: OnboardingActionId | null;
  updatedAt: string | null;
};

export type OnboardingProgressStorage = Pick<Storage, "getItem" | "setItem">;

const STEP_IDS = new Set<string>(ONBOARDING_STEP_IDS);
const ACTION_IDS = new Set<string>(ONBOARDING_ACTION_IDS);
const STATUS_IDS = new Set<string>(["pending", "completed", "dismissed"]);

export function createOnboardingProgress(): OnboardingProgress {
  return {
    version: ONBOARDING_PROGRESS_VERSION,
    status: "pending",
    completedSteps: [],
    selectedAction: null,
    updatedAt: null,
  };
}

export function normalizeOnboardingProgress(value: unknown): OnboardingProgress {
  if (!value || typeof value !== "object") return createOnboardingProgress();
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== ONBOARDING_PROGRESS_VERSION) return createOnboardingProgress();

  const rawCompletedSteps = Array.isArray(candidate.completedSteps)
    ? candidate.completedSteps
    : [];
  const completedSteps = ONBOARDING_STEP_IDS.filter((step) => rawCompletedSteps.includes(step));
  const status =
    typeof candidate.status === "string" && STATUS_IDS.has(candidate.status)
      ? (candidate.status as OnboardingStatus)
      : "pending";
  const selectedAction =
    typeof candidate.selectedAction === "string" && ACTION_IDS.has(candidate.selectedAction)
      ? (candidate.selectedAction as OnboardingActionId)
      : null;
  const updatedAt =
    typeof candidate.updatedAt === "string" && Number.isFinite(Date.parse(candidate.updatedAt))
      ? candidate.updatedAt
      : null;

  return {
    version: ONBOARDING_PROGRESS_VERSION,
    status,
    completedSteps: completedSteps.filter((step) => STEP_IDS.has(step)),
    selectedAction,
    updatedAt,
  };
}

export function finishOnboarding(
  action: OnboardingActionId,
  updatedAt = new Date().toISOString(),
): OnboardingProgress {
  return {
    version: ONBOARDING_PROGRESS_VERSION,
    status: action === "later" ? "dismissed" : "completed",
    completedSteps: [...ONBOARDING_STEP_IDS],
    selectedAction: action,
    updatedAt,
  };
}

export function shouldOfferOnboarding(progress: OnboardingProgress): boolean {
  return progress.status === "pending";
}

export function readOnboardingProgress(
  storage: OnboardingProgressStorage | undefined = browserStorage(),
): OnboardingProgress {
  if (!storage) return createOnboardingProgress();
  try {
    const raw = storage.getItem(ONBOARDING_PROGRESS_STORAGE_KEY);
    return raw ? normalizeOnboardingProgress(JSON.parse(raw)) : createOnboardingProgress();
  } catch {
    return createOnboardingProgress();
  }
}

export function writeOnboardingProgress(
  progress: OnboardingProgress,
  storage: OnboardingProgressStorage | undefined = browserStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(ONBOARDING_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

function browserStorage(): OnboardingProgressStorage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}
