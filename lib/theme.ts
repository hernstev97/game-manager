/**
 * Material 3 / Material You dynamic color engine.
 *
 * Public API is seed + variant + mode → CSS custom properties on :root.
 * Compatible with @material/material-color-utilities 0.3 (static DynamicColors)
 * and 0.4 (instance methods). Theme settings persist separately from the
 * library JSON so Steam credentials never ride along with a wallpaper seed.
 */
import {
  Hct,
  MaterialDynamicColors,
  QuantizerCelebi,
  SchemeExpressive,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeTonalSpot,
  SchemeVibrant,
  Score,
  argbFromHex,
  argbFromRgb,
  hexFromArgb,
  type DynamicColor,
  type DynamicScheme,
} from "@material/material-color-utilities";

export const DEFAULT_THEME_SEED = "#6750A4";
export const TEAL_THEME_SEED = "#2F667A";
export const MATERIAL_CONTRAST_LEVEL = 0;
export const THEME_STORAGE_KEY = "game-library.theme.v1";

export const schemeVariants = [
  "expressive",
  "vibrant",
  "tonalSpot",
  "neutral",
  "monochrome",
] as const;
export type SchemeVariant = (typeof schemeVariants)[number];
export type ResolvedThemeMode = "light" | "dark";
export type ThemeMode = ResolvedThemeMode | "system";

/** CSS custom properties generated from Material Dynamic Colors. */
export const themeTokenNames = [
  "--color-page",
  "--color-container-low",
  "--color-container",
  "--color-container-high",
  "--color-surface-bright",
  "--color-on-surface",
  "--color-on-surface-variant",
  "--color-primary",
  "--color-on-primary",
  "--color-primary-container",
  "--color-on-primary-container",
  "--color-secondary",
  "--color-on-secondary",
  "--color-secondary-container",
  "--color-on-secondary-container",
  "--color-tertiary",
  "--color-on-tertiary",
  "--color-tertiary-container",
  "--color-on-tertiary-container",
  "--color-outline",
  "--color-outline-variant",
  "--color-scrim",
] as const;

/** Extra tokens the UI actually needs (error, inverse, extreme surfaces). */
export const extraThemeTokenNames = [
  "--color-error",
  "--color-on-error",
  "--color-error-container",
  "--color-on-error-container",
  "--color-inverse-surface",
  "--color-inverse-on-surface",
  "--color-container-lowest",
  "--color-container-highest",
  "--color-surface-dim",
] as const;

export const allThemeTokenNames = [
  ...themeTokenNames,
  ...extraThemeTokenNames,
] as const;

export type ThemeTokenName = (typeof allThemeTokenNames)[number];
export type ThemeTokenSet = Record<ThemeTokenName, string>;
export type ThemePair = { light: ThemeTokenSet; dark: ThemeTokenSet };

export type ThemeSource = "preset" | "custom" | "accent" | "image";

export type ThemePreferences = {
  seed: string;
  variant: SchemeVariant;
  mode: ThemeMode;
  source: ThemeSource;
  pair: ThemePair;
};

export const THEME_PRESETS = [
  { id: "violet", label: "Violett", seed: DEFAULT_THEME_SEED },
  { id: "electric", label: "Electric", seed: "#7C4DFF" },
  { id: "teal", label: "Petrol", seed: TEAL_THEME_SEED },
  { id: "crimson", label: "Crimson", seed: "#8B1E3A" },
] as const;

export const SCHEME_VARIANT_LABELS: Record<SchemeVariant, string> = {
  tonalSpot: "Tonal Spot",
  neutral: "Neutral",
  vibrant: "Vibrant",
  expressive: "Expressive",
  monochrome: "Mono",
};

export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  if (!/^#[\da-f]{6}$/i.test(trimmed)) return null;
  return `#${trimmed.slice(1).toUpperCase()}`;
}

type ColorAccessor = DynamicColor | ((this: MaterialDynamicColors) => DynamicColor);

function readDynamicColor(
  colors: MaterialDynamicColors,
  name: string,
): DynamicColor {
  const staticTable = MaterialDynamicColors as unknown as Record<string, ColorAccessor>;
  const instanceTable = colors as unknown as Record<string, ColorAccessor>;
  const value = instanceTable[name] ?? staticTable[name];
  if (typeof value === "function") {
    return value.call(colors);
  }
  if (value && typeof value === "object") {
    return value;
  }
  throw new Error(`Unknown Material dynamic color: ${name}`);
}

function createScheme(
  seed: string,
  variant: SchemeVariant,
  resolvedMode: ResolvedThemeMode,
): DynamicScheme {
  const source = Hct.fromInt(argbFromHex(seed));
  const dark = resolvedMode === "dark";

  switch (variant) {
    case "neutral":
      return new SchemeNeutral(source, dark, MATERIAL_CONTRAST_LEVEL);
    case "vibrant":
      return new SchemeVibrant(source, dark, MATERIAL_CONTRAST_LEVEL);
    case "expressive":
      return new SchemeExpressive(source, dark, MATERIAL_CONTRAST_LEVEL);
    case "monochrome":
      return new SchemeMonochrome(source, dark, MATERIAL_CONTRAST_LEVEL);
    case "tonalSpot":
      return new SchemeTonalSpot(source, dark, MATERIAL_CONTRAST_LEVEL);
  }
}

function resolveTokens(
  seed: string,
  variant: SchemeVariant,
  resolvedMode: ResolvedThemeMode,
): ThemeTokenSet {
  const scheme = createScheme(seed, variant, resolvedMode);
  const colors = new MaterialDynamicColors();
  const color = (name: string) =>
    normalizeHexColor(hexFromArgb(readDynamicColor(colors, name).getArgb(scheme)))!;

  return {
    "--color-page": color("background"),
    "--color-container-low": color("surfaceContainerLow"),
    "--color-container": color("surfaceContainer"),
    "--color-container-high": color("surfaceContainerHigh"),
    "--color-surface-bright": color("surfaceBright"),
    "--color-on-surface": color("onSurface"),
    "--color-on-surface-variant": color("onSurfaceVariant"),
    "--color-primary": color("primary"),
    "--color-on-primary": color("onPrimary"),
    "--color-primary-container": color("primaryContainer"),
    "--color-on-primary-container": color("onPrimaryContainer"),
    "--color-secondary": color("secondary"),
    "--color-on-secondary": color("onSecondary"),
    "--color-secondary-container": color("secondaryContainer"),
    "--color-on-secondary-container": color("onSecondaryContainer"),
    "--color-tertiary": color("tertiary"),
    "--color-on-tertiary": color("onTertiary"),
    "--color-tertiary-container": color("tertiaryContainer"),
    "--color-on-tertiary-container": color("onTertiaryContainer"),
    "--color-outline": color("outline"),
    "--color-outline-variant": color("outlineVariant"),
    "--color-scrim": color("scrim"),
    "--color-error": color("error"),
    "--color-on-error": color("onError"),
    "--color-error-container": color("errorContainer"),
    "--color-on-error-container": color("onErrorContainer"),
    "--color-inverse-surface": color("inverseSurface"),
    "--color-inverse-on-surface": color("inverseOnSurface"),
    "--color-container-lowest": color("surfaceContainerLowest"),
    "--color-container-highest": color("surfaceContainerHighest"),
    "--color-surface-dim": color("surfaceDim"),
  };
}

/** Core API: seed + variant → complete light/dark token pair. */
export function generateThemePair(
  seed: string,
  variant: SchemeVariant = "expressive",
): ThemePair {
  const normalized = normalizeHexColor(seed) ?? DEFAULT_THEME_SEED;
  return {
    light: resolveTokens(normalized, variant, "light"),
    dark: resolveTokens(normalized, variant, "dark"),
  };
}

/** Swatch: primary, secondary, tertiary, container-high (light scheme). */
export function themeSwatch(theme: ThemePair): readonly [string, string, string, string] {
  return [
    theme.light["--color-primary"],
    theme.light["--color-secondary"],
    theme.light["--color-tertiary"],
    theme.light["--color-container-high"],
  ];
}

function circularHueDistance(a: number, b: number) {
  const difference = Math.abs(a - b);
  return Math.min(difference, 360 - difference);
}

export function areSeedsDistinct(first: string, second: string): boolean {
  const a = Hct.fromInt(argbFromHex(first));
  const b = Hct.fromInt(argbFromHex(second));
  return (
    circularHueDistance(a.hue, b.hue) >= 18 ||
    Math.abs(a.chroma - b.chroma) >= 16 ||
    Math.abs(a.tone - b.tone) >= 18
  );
}

export function dedupeSeedColors(seeds: readonly string[], limit = 3): string[] {
  const distinct: string[] = [];
  for (const seed of seeds) {
    const normalized = normalizeHexColor(seed);
    if (!normalized || distinct.some((existing) => !areSeedsDistinct(existing, normalized))) {
      continue;
    }
    distinct.push(normalized);
    if (distinct.length === limit) break;
  }
  return distinct;
}

export function quantizeWallpaperSeeds(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): string[] {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    data.length !== width * height * 4
  ) {
    throw new Error("Invalid pixel buffer");
  }

  const pixels: number[] = [];
  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3];
    if (alpha < 128) continue;
    if (alpha < 255) {
      const opacity = alpha / 255;
      pixels.push(
        argbFromRgb(
          data[index] * opacity + 255 * (1 - opacity),
          data[index + 1] * opacity + 255 * (1 - opacity),
          data[index + 2] * opacity + 255 * (1 - opacity),
        ),
      );
    } else {
      pixels.push(argbFromRgb(data[index], data[index + 1], data[index + 2]));
    }
  }

  if (!pixels.length) return [DEFAULT_THEME_SEED];

  const quantized = QuantizerCelebi.quantize(pixels, 128);
  const ranked = Score.score(quantized, {
    desired: 8,
    fallbackColorARGB: argbFromRgb(103, 80, 164),
    filter: true,
  });
  return dedupeSeedColors(
    ranked.map((argb) => hexFromArgb(argb)),
    3,
  );
}

export type WallpaperTheme = {
  seed: string;
  variant: SchemeVariant;
  theme: ThemePair;
  swatch: readonly [string, string, string, string];
};

/**
 * Wallpaper candidates:
 * - 5 variants from the best seed
 * - plus up to 2 extra distinct seeds as tonalSpot
 */
export function createWallpaperThemes(seeds: readonly string[]): WallpaperTheme[] {
  const distinct = dedupeSeedColors(seeds);
  const best = distinct[0] ?? DEFAULT_THEME_SEED;
  const variants: SchemeVariant[] = [
    "tonalSpot",
    "neutral",
    "vibrant",
    "expressive",
    "monochrome",
  ];

  const palettes = variants.map((variant) => {
    const theme = generateThemePair(best, variant);
    return { seed: best, variant, theme, swatch: themeSwatch(theme) };
  });

  for (const seed of distinct.slice(1, 3)) {
    const theme = generateThemePair(seed, "tonalSpot");
    palettes.push({ seed, variant: "tonalSpot", theme, swatch: themeSwatch(theme) });
  }
  return palettes;
}

function byteToHex(value: number) {
  return Math.round(value).toString(16).padStart(2, "0");
}

function parseRgbChannel(value: string): number | null {
  const percentage = value.endsWith("%");
  const parsed = Number.parseFloat(value);
  const channel = percentage ? parsed * 2.55 : parsed;
  return Number.isFinite(channel) && channel >= 0 && channel <= 255 ? channel : null;
}

function parseAlphaChannel(value: string): number | null {
  const parsed = Number.parseFloat(value);
  const alpha = value.endsWith("%") ? parsed / 100 : parsed;
  return Number.isFinite(alpha) && alpha >= 0 && alpha <= 1 ? alpha : null;
}

export function parseConcreteCssColor(value: string): string | null {
  const hex = value.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (hex) {
    const expanded =
      hex[1].length === 3 ? [...hex[1]].map((c) => `${c}${c}`).join("") : hex[1];
    return `#${expanded.toUpperCase()}`;
  }

  const rgb = value.trim().match(/^rgba?\((.+)\)$/i);
  if (rgb) {
    const components = rgb[1]
      .replaceAll(",", " ")
      .replace("/", " ")
      .split(/\s+/)
      .filter(Boolean);
    if (components.length < 3 || components.length > 4) return null;
    const channels = components.slice(0, 3).map(parseRgbChannel);
    const alpha = components[3] === undefined ? 1 : parseAlphaChannel(components[3]);
    if (channels.some((c) => c === null) || alpha === null || alpha < 0.99) return null;
    return `#${channels.map((c) => byteToHex(c!)).join("").toUpperCase()}`;
  }

  const srgb = value
    .trim()
    .match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/i);
  if (srgb) {
    const channels = srgb.slice(1, 4).map(Number);
    const alpha = srgb[4] === undefined ? 1 : Number(srgb[4]);
    if (
      channels.some((c) => !Number.isFinite(c) || c < 0 || c > 1) ||
      !Number.isFinite(alpha) ||
      alpha < 0.99
    ) {
      return null;
    }
    return `#${channels.map((c) => byteToHex(c * 255)).join("").toUpperCase()}`;
  }
  return null;
}

export function resolveBrowserAccent(
  documentRef = typeof document === "undefined" ? undefined : document,
) {
  const css = documentRef?.defaultView?.CSS;
  if (!documentRef || !css?.supports("color", "AccentColor")) {
    return { seed: DEFAULT_THEME_SEED, available: false, foreground: null as string | null };
  }

  const probe = documentRef.createElement("span");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText =
    "position:fixed;inline-size:0;block-size:0;overflow:hidden;pointer-events:none;color:AccentColor;background-color:AccentColorText;";
  try {
    documentRef.documentElement.append(probe);
    const style = documentRef.defaultView?.getComputedStyle(probe);
    const seed = style ? parseConcreteCssColor(style.color) : null;
    const foreground = style ? parseConcreteCssColor(style.backgroundColor) : null;
    return seed
      ? { seed, available: true, foreground }
      : { seed: DEFAULT_THEME_SEED, available: false, foreground: null };
  } catch {
    return { seed: DEFAULT_THEME_SEED, available: false, foreground: null };
  } finally {
    probe.remove();
  }
}

export function tokensAreDark(tokens: ThemeTokenSet): boolean {
  const hex = tokens["--color-page"];
  const raw = hex.replace("#", "");
  const n = Number.parseInt(raw, 16);
  if (!Number.isFinite(n)) return false;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.45;
}

export function applyThemeTokens(
  tokens: ThemeTokenSet,
  documentRef = typeof document === "undefined" ? undefined : document,
) {
  if (!documentRef) return;
  const root = documentRef.documentElement;
  for (const name of allThemeTokenNames) {
    if (tokens[name]) root.style.setProperty(name, tokens[name]);
  }
  const dark = tokensAreDark(tokens);
  root.style.colorScheme = dark ? "dark" : "light";
  root.dataset.theme = dark ? "dark" : "light";
  root.setAttribute("theme", dark ? "dark" : "light");
}

export function resolveThemeMode(
  mode: ThemeMode,
  mediaDark = typeof window !== "undefined"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : false,
): ResolvedThemeMode {
  if (mode === "system") return mediaDark ? "dark" : "light";
  return mode;
}

export function pickTokens(pair: ThemePair, mode: ThemeMode): ThemeTokenSet {
  return pair[resolveThemeMode(mode)];
}

export const FALLBACK_THEME_PAIR: ThemePair = {
  light: {
    "--color-page": "#FDF7FF",
    "--color-container-low": "#F8F2FA",
    "--color-container": "#F2ECF4",
    "--color-container-high": "#ECE6EE",
    "--color-surface-bright": "#FDF7FF",
    "--color-on-surface": "#1D1B20",
    "--color-on-surface-variant": "#49454E",
    "--color-primary": "#65558F",
    "--color-on-primary": "#FFFFFF",
    "--color-primary-container": "#E9DDFF",
    "--color-on-primary-container": "#4D3D75",
    "--color-secondary": "#625B71",
    "--color-on-secondary": "#FFFFFF",
    "--color-secondary-container": "#E8DEF8",
    "--color-on-secondary-container": "#4A4458",
    "--color-tertiary": "#7E5260",
    "--color-on-tertiary": "#FFFFFF",
    "--color-tertiary-container": "#FFD9E3",
    "--color-on-tertiary-container": "#633B48",
    "--color-outline": "#7A757F",
    "--color-outline-variant": "#CAC4CF",
    "--color-scrim": "#000000",
    "--color-error": "#BA1A1A",
    "--color-on-error": "#FFFFFF",
    "--color-error-container": "#FFDAD6",
    "--color-on-error-container": "#93000A",
    "--color-inverse-surface": "#322F35",
    "--color-inverse-on-surface": "#F5EFF7",
    "--color-container-lowest": "#FFFFFF",
    "--color-container-highest": "#E6E0E9",
    "--color-surface-dim": "#DED8E0",
  },
  dark: {
    "--color-page": "#141218",
    "--color-container-low": "#1D1B20",
    "--color-container": "#211F24",
    "--color-container-high": "#2B292F",
    "--color-surface-bright": "#3B383E",
    "--color-on-surface": "#E6E0E9",
    "--color-on-surface-variant": "#CAC4CF",
    "--color-primary": "#CFBDFE",
    "--color-on-primary": "#36275D",
    "--color-primary-container": "#4D3D75",
    "--color-on-primary-container": "#E9DDFF",
    "--color-secondary": "#CBC2DB",
    "--color-on-secondary": "#332D41",
    "--color-secondary-container": "#4A4458",
    "--color-on-secondary-container": "#E8DEF8",
    "--color-tertiary": "#EFB8C8",
    "--color-on-tertiary": "#4A2532",
    "--color-tertiary-container": "#633B48",
    "--color-on-tertiary-container": "#FFD9E3",
    "--color-outline": "#948F99",
    "--color-outline-variant": "#49454E",
    "--color-scrim": "#000000",
    "--color-error": "#FFB4AB",
    "--color-on-error": "#690005",
    "--color-error-container": "#93000A",
    "--color-on-error-container": "#FFDAD6",
    "--color-inverse-surface": "#E6E0E9",
    "--color-inverse-on-surface": "#322F35",
    "--color-container-lowest": "#0F0D13",
    "--color-container-highest": "#36343A",
    "--color-surface-dim": "#141218",
  },
};

export const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  seed: DEFAULT_THEME_SEED,
  variant: "expressive",
  mode: "system",
  source: "preset",
  pair: FALLBACK_THEME_PAIR,
};

export function parseThemePreferences(raw: unknown): ThemePreferences {
  if (!raw || typeof raw !== "object") return DEFAULT_THEME_PREFERENCES;
  const value = raw as Partial<ThemePreferences>;
  const seed = normalizeHexColor(String(value.seed ?? "")) ?? DEFAULT_THEME_SEED;
  const variant = schemeVariants.includes(value.variant as SchemeVariant)
    ? (value.variant as SchemeVariant)
    : "expressive";
  const mode: ThemeMode =
    value.mode === "light" || value.mode === "dark" || value.mode === "system"
      ? value.mode
      : "system";
  const source: ThemeSource =
    value.source === "custom" || value.source === "accent" || value.source === "image"
      ? value.source
      : "preset";
  const pair =
    value.pair?.light && value.pair?.dark
      ? {
          light: { ...FALLBACK_THEME_PAIR.light, ...value.pair.light },
          dark: { ...FALLBACK_THEME_PAIR.dark, ...value.pair.dark },
        }
      : generateThemePair(seed, variant);
  return { seed, variant, mode, source, pair };
}

export function readStoredThemePreferences(): ThemePreferences {
  if (typeof window === "undefined") return DEFAULT_THEME_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME_PREFERENCES;
    return parseThemePreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_THEME_PREFERENCES;
  }
}

export function writeStoredThemePreferences(prefs: ThemePreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(prefs));
}

export async function seedsFromImageFile(file: File): Promise<string[]> {
  const bitmap = await createImageBitmap(file);
  const max = 96;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [DEFAULT_THEME_SEED];
  ctx.drawImage(bitmap, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  bitmap.close();
  return quantizeWallpaperSeeds(data, width, height);
}

/** Inline boot: apply last-known tokens before first paint (no MCU in the script). */
export const THEME_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var raw=localStorage.getItem(k);var data=raw?JSON.parse(raw):null;var mode=data&&data.mode?data.mode:"system";var dark=mode==="dark"||(mode==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var pair=data&&data.pair;var tokens=pair?(dark?pair.dark:pair.light):null;var root=document.documentElement;root.dataset.theme=dark?"dark":"light";root.setAttribute("theme",dark?"dark":"light");root.style.colorScheme=dark?"dark":"light";if(tokens){for(var name in tokens){if(Object.prototype.hasOwnProperty.call(tokens,name))root.style.setProperty(name,tokens[name]);}}}catch(e){}})();`;
