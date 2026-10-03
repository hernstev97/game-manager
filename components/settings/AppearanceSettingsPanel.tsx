"use client";

import { useState } from "react";
import { toast } from "@/components/m3/snackbar";
import { M3Chip, M3TextField } from "@/components/m3/host";
import { IconCheck } from "@/components/m3/icons";
import { MotionSelector } from "@/components/preferences/MotionSelector";
import { useTheme } from "@/components/preferences/ThemeProvider";
import {
  DEFAULT_THEME_SEED,
  SCHEME_VARIANT_LABELS,
  THEME_PRESETS,
  createWallpaperThemes,
  generateThemePair,
  normalizeHexColor,
  resolveBrowserAccent,
  seedsFromImageFile,
  schemeVariants,
  themeSwatch,
  type SchemeVariant,
  type WallpaperTheme,
} from "@/lib/theme";

const MODE_OPTIONS = [
  { value: "light", label: "Hell" },
  { value: "dark", label: "Dunkel" },
  { value: "system", label: "System" },
] as const;

export function AppearanceSettingsPanel({ hidden }: { hidden: boolean }) {
  const { prefs, setMode, setVariant, setSeed, applyWallpaper } = useTheme();
  const [hexDraft, setHexDraft] = useState(prefs.seed);
  const [wallpaper, setWallpaper] = useState<WallpaperTheme[]>([]);

  const applyHex = () => {
    const hex = normalizeHexColor(hexDraft);
    if (!hex) {
      toast.error("Bitte eine 6-stellige Hex-Farbe angeben.");
      return;
    }
    setSeed(hex, "custom");
  };

  const useAccent = () => {
    const accent = resolveBrowserAccent();
    if (!accent.available) {
      toast.error("Keine System-Akzentfarbe gefunden.");
      return;
    }
    setHexDraft(accent.seed);
    setSeed(accent.seed, "accent");
  };

  const onImage = async (file: File) => {
    try {
      const seeds = await seedsFromImageFile(file);
      const themes = createWallpaperThemes(seeds);
      setWallpaper(themes);
      if (themes[0]) applyWallpaper(themes[0]);
    } catch {
      toast.error("Farben konnten aus dem Bild nicht gelesen werden.");
    }
  };

  return (
    <section id="settings-theme" className="settings settings-panel" hidden={hidden}>
      <h3 className="settings-section-title">Modus</h3>
      <div className="segmented-button" role="radiogroup" aria-label="Farbmodus">
        {MODE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={prefs.mode === option.value}
            onClick={() => setMode(option.value)}
          >
            {prefs.mode === option.value ? <IconCheck width={18} height={18} /> : null}
            {option.label}
          </button>
        ))}
      </div>

      <h3 className="settings-section-title">Farbe</h3>
      <div className="chip-row">
        {THEME_PRESETS.map((preset) => (
          <M3Chip
            key={preset.id}
            variant="filter"
            selected={prefs.seed === preset.seed && prefs.source === "preset"}
            onClick={() => {
              setHexDraft(preset.seed);
              setSeed(preset.seed, "preset");
            }}
          >
            <i className="seed-dot" slot="icon" style={{ background: preset.seed }} />
            {preset.label}
          </M3Chip>
        ))}
      </div>

      <details className="settings-disclosure">
        <summary>Weitere Farboptionen</summary>
        <div className="settings-disclosure-body">
          <span className="field-label">Schema</span>
          <div className="chip-row">
            {schemeVariants.map((variant) => {
              const pair = generateThemePair(prefs.seed, variant);
              const swatch = themeSwatch(pair);
              return (
                <M3Chip
                  key={variant}
                  variant="filter"
                  selected={prefs.variant === variant}
                  onClick={() => setVariant(variant as SchemeVariant)}
                >
                  <span className="swatch" slot="icon">
                    {swatch.map((color) => (
                      <i key={color} style={{ background: color }} />
                    ))}
                  </span>
                  {SCHEME_VARIANT_LABELS[variant]}
                </M3Chip>
              );
            })}
          </div>
          <span className="field-label">Eigene Farbe</span>
          <div className="hex-row">
            <M3TextField label="Hex" value={hexDraft} onChange={setHexDraft} placeholder={DEFAULT_THEME_SEED} />
            <m3-button variant="tonal" onClick={applyHex}>Übernehmen</m3-button>
          </div>
          <div className="settings-actions">
            <m3-button variant="outlined" onClick={useAccent}>
              Systemakzent verwenden
            </m3-button>
            <m3-button variant="outlined" onClick={() => document.getElementById("wallpaper-file")?.click()}>
              Farben aus Bild ableiten
            </m3-button>
            <input
              id="wallpaper-file"
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onImage(file);
                event.target.value = "";
              }}
            />
          </div>
          {wallpaper.length > 0 ? (
            <div className="chip-row">
              {wallpaper.map((item, index) => (
                <M3Chip
                  key={`${item.seed}-${item.variant}-${index}`}
                  onClick={() => applyWallpaper(item)}
                >
                  <span className="swatch" slot="icon">
                    {item.swatch.map((color) => (
                      <i key={color} style={{ background: color }} />
                    ))}
                  </span>
                  {SCHEME_VARIANT_LABELS[item.variant]}
                </M3Chip>
              ))}
            </div>
          ) : null}
        </div>
      </details>

      <MotionSelector />
    </section>
  );
}
