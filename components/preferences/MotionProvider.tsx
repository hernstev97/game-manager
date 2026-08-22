"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import {
  DEFAULT_MOTION_PREFERENCE,
  applyMotionPreference,
  readStoredMotionPreference,
  resolveEffectiveMotion,
  systemPrefersReducedMotion,
  writeStoredMotionPreference,
  type EffectiveMotion,
  type MotionPreference,
} from "@/lib/motion";

type MotionContextValue = {
  preference: MotionPreference;
  effectiveMotion: EffectiveMotion;
  systemReduced: boolean;
  setPreference: (preference: MotionPreference) => void;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void | Promise<void>) => {
    finished: Promise<void>;
    ready: Promise<void>;
    updateCallbackDone: Promise<void>;
  };
};

const MotionContext = createContext<MotionContextValue | null>(null);

export function MotionProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<MotionPreference>(() =>
    typeof window === "undefined"
      ? DEFAULT_MOTION_PREFERENCE
      : readStoredMotionPreference(),
  );
  const [systemReduced, setSystemReduced] = useState(() =>
    typeof window === "undefined" ? false : systemPrefersReducedMotion(),
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setSystemReduced(media.matches);
      applyMotionPreference(preference, media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [preference]);

  const setPreference = useCallback((next: MotionPreference) => {
    setPreferenceState(next);
    writeStoredMotionPreference(next);
    applyMotionPreference(next);
  }, []);

  const value = useMemo<MotionContextValue>(
    () => ({
      preference,
      effectiveMotion: resolveEffectiveMotion(preference, systemReduced),
      systemReduced,
      setPreference,
    }),
    [preference, setPreference, systemReduced],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotion() {
  const value = useContext(MotionContext);
  if (!value) throw new Error("useMotion must be used within MotionProvider");
  return value;
}

export function runMotionViewTransition(update: () => void) {
  if (typeof document === "undefined") {
    update();
    return;
  }
  const motionDocument = document as ViewTransitionDocument;
  if (
    document.documentElement.dataset.motion === "none" ||
    typeof motionDocument.startViewTransition !== "function"
  ) {
    update();
    return;
  }
  try {
    const transition = motionDocument.startViewTransition(() => flushSync(update));
    const handleTransitionRejection = (error: unknown) => {
      if (
        error instanceof DOMException &&
        error.name === "AbortError" &&
        error.message === "Transition was skipped"
      ) {
        return;
      }
      console.error("View transition failed.", error);
    };
    void transition.ready.catch(handleTransitionRejection);
    void transition.finished.catch(handleTransitionRejection);
    void transition.updateCallbackDone.catch(handleTransitionRejection);
  } catch {
    update();
  }
}
