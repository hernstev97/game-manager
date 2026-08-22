export const MOTION_STORAGE_KEY = "game-library.motion.v1";

export const motionPreferences = ["expressive", "standard", "none"] as const;

export type MotionPreference = (typeof motionPreferences)[number];
export type EffectiveMotion = MotionPreference;

export const DEFAULT_MOTION_PREFERENCE: MotionPreference = "expressive";

export const MOTION_PREFERENCE_DETAILS: Record<
  MotionPreference,
  { label: string; description: string }
> = {
  expressive: {
    label: "Ausdrucksstark",
    description: "Weiche Übergänge, räumliche Bewegung und gestaffelte Auftritte.",
  },
  standard: {
    label: "Normal",
    description: "Kurze, ruhige Übergänge mit deutlich weniger Bewegung.",
  },
  none: {
    label: "Keine",
    description: "Deaktiviert Bewegung und entspricht einer Reduced-Motion-Darstellung.",
  },
};

export function normalizeMotionPreference(value: unknown): MotionPreference {
  return motionPreferences.includes(value as MotionPreference)
    ? (value as MotionPreference)
    : DEFAULT_MOTION_PREFERENCE;
}

export function resolveEffectiveMotion(
  preference: MotionPreference,
  systemReduced: boolean,
): EffectiveMotion {
  return systemReduced ? "none" : preference;
}

export function systemPrefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function readStoredMotionPreference(): MotionPreference {
  if (typeof window === "undefined") return DEFAULT_MOTION_PREFERENCE;
  try {
    const raw = window.localStorage.getItem(MOTION_STORAGE_KEY);
    if (!raw) return DEFAULT_MOTION_PREFERENCE;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "string") return normalizeMotionPreference(parsed);
    if (parsed && typeof parsed === "object" && "preference" in parsed) {
      return normalizeMotionPreference((parsed as { preference?: unknown }).preference);
    }
  } catch {
    // A malformed preference should never prevent the library from loading.
  }
  return DEFAULT_MOTION_PREFERENCE;
}

export function writeStoredMotionPreference(preference: MotionPreference) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      MOTION_STORAGE_KEY,
      JSON.stringify({ preference }),
    );
  } catch {
    // The in-memory preference still works when storage is unavailable.
  }
}

export function applyMotionPreference(
  preference: MotionPreference,
  systemReduced = systemPrefersReducedMotion(),
) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.motionPreference = preference;
  const effectiveMotion = resolveEffectiveMotion(preference, systemReduced);
  root.dataset.motion = effectiveMotion;
  if (effectiveMotion === "none") {
    document.getAnimations?.().forEach((animation) => animation.cancel());
  }
}

export const MOTION_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(MOTION_STORAGE_KEY)};var raw=localStorage.getItem(k);var data=raw?JSON.parse(raw):null;var candidate=typeof data==="string"?data:data&&data.preference;var pref=candidate==="standard"||candidate==="none"||candidate==="expressive"?candidate:"expressive";var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;var root=document.documentElement;root.dataset.motionPreference=pref;root.dataset.motion=reduced?"none":pref;}catch(e){document.documentElement.dataset.motion="expressive";document.documentElement.dataset.motionPreference="expressive";}})();`;
