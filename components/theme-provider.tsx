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
import {
  applyThemeTokens,
  DEFAULT_THEME_PREFERENCES,
  generateThemePair,
  pickTokens,
  readStoredThemePreferences,
  writeStoredThemePreferences,
  type SchemeVariant,
  type ThemeMode,
  type ThemePreferences,
  type ThemeSource,
  type WallpaperTheme,
} from "@/lib/theme";

type ThemeContextValue = {
  prefs: ThemePreferences;
  setMode: (mode: ThemeMode) => void;
  setVariant: (variant: SchemeVariant) => void;
  setSeed: (seed: string, source?: ThemeSource) => void;
  applyWallpaper: (candidate: WallpaperTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<ThemePreferences>(() =>
    typeof window === "undefined" ? DEFAULT_THEME_PREFERENCES : readStoredThemePreferences(),
  );

  const commit = useCallback((next: ThemePreferences) => {
    setPrefs(next);
    writeStoredThemePreferences(next);
    applyThemeTokens(pickTokens(next.pair, next.mode));
  }, []);

  useEffect(() => {
    applyThemeTokens(pickTokens(prefs.pair, prefs.mode));
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (prefs.mode === "system") {
        applyThemeTokens(pickTokens(prefs.pair, "system"));
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [prefs]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      prefs,
      setMode: (mode) => commit({ ...prefs, mode }),
      setVariant: (variant) => {
        const pair = generateThemePair(prefs.seed, variant);
        commit({ ...prefs, variant, pair });
      },
      setSeed: (seed, source = "custom") => {
        const pair = generateThemePair(seed, prefs.variant);
        commit({ ...prefs, seed, source, pair });
      },
      applyWallpaper: (candidate) => {
        commit({
          seed: candidate.seed,
          variant: candidate.variant,
          mode: prefs.mode,
          source: "image",
          pair: candidate.theme,
        });
      },
    }),
    [commit, prefs],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return value;
}
