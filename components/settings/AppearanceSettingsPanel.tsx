"use client";

import { useState } from "react";
import { toast } from "@/components/m3/snackbar";
import { M3Chip, M3Radio, M3TextField } from "@/components/m3/host";
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
      <MotionSelector />
      <m3-divider />
      <span className="field-label">Modus</span>
      <div className="chip-row">
        <M3Radio name="theme-mode" value="light" checked={prefs.mode === "light"} onChange={() => setMode("light")} label="Hell" />
        <M3Radio name="theme-mode" value="dark" checked={prefs.mode === "dark"} onChange={() => setMode("dark")} label="Dunkel" />
        <M3Radio name="theme-mode" value="system" checked={prefs.mode === "system"} onChange={() => setMode("system")} label="System" />
      </div>
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
      <span className="field-label">Farbkern</span>
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
        <m3-button variant="text" onClick={useAccent}>
          Systemakzent
        </m3-button>
      </div>
      <div className="hex-row">
        <M3TextField label="Hex" value={hexDraft} onChange={setHexDraft} placeholder={DEFAULT_THEME_SEED} />
        <m3-button onClick={applyHex}>Übernehmen</m3-button>
      </div>
      <label>
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
      </label>
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
    </section>
  );
}
