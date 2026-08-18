"use client";

import { useState } from "react";
import { toast } from "@/components/m3/snackbar";
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
import { M3Chip, M3Dialog, M3Radio, M3Tabs, M3TextField } from "@/components/m3/host";
import { useTheme } from "@/components/theme-provider";
import { fetchOwnedSteamGames, fetchSteamAppDetails, parseSteamIdentity, steamCover } from "@/lib/steam";
import type { GameRecord } from "@/lib/game-fields";
import { MorphLoader } from "@/components/morph-loader";

export function SettingsDialog({
  open,
  onClose,
  steamId,
  steamApiKey,
  games,
  onSteamCredentials,
  onReset,
  onApplyPlaytime,
  onRefreshIdentity,
}: {
  open: boolean;
  onClose: () => void;
  steamId: string;
  steamApiKey: string;
  games: GameRecord[];
  onSteamCredentials: (steamId: string, steamApiKey: string) => void;
  onReset: () => void;
  onApplyPlaytime: (
    owned: Array<{ appId: number; name: string; playtimeMinutes: number }>,
  ) => { updated: number; markedOwned: number };
  onRefreshIdentity: (
    updates: Array<{ id: string; name?: string; coverUrl?: string; released?: boolean }>,
  ) => number;
}) {
  const { prefs, setMode, setVariant, setSeed, applyWallpaper } = useTheme();
  const [idDraft, setIdDraft] = useState(steamId);
  const [keyDraft, setKeyDraft] = useState(steamApiKey);
  const [hexDraft, setHexDraft] = useState(prefs.seed);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [wallpaper, setWallpaper] = useState<WallpaperTheme[]>([]);
  const [tab, setTab] = useState(0);

  const saveSteam = () => {
    onSteamCredentials(idDraft.trim(), keyDraft.trim());
    toast.success("Steam-Zugangsdaten gespeichert.");
  };

  const refreshCovers = async () => {
    setBusy(true);
    try {
      const withIds = games.filter((game) => game.steamAppId != null);
      const updates: Array<{ id: string; name?: string; coverUrl?: string; released?: boolean }> = [];
      for (const game of withIds) {
        const appId = game.steamAppId!;
        try {
          const details = await fetchSteamAppDetails(appId);
          updates.push({
            id: game.id,
            name: details?.name || game.name,
            coverUrl: details?.coverUrl || steamCover(appId),
            released: details?.released,
          });
        } catch {
          updates.push({ id: game.id, coverUrl: steamCover(appId) });
        }
      }
      const count = onRefreshIdentity(updates);
      toast.success(`${count} Cover und Namen aktualisiert.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Steam-Aktualisierung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  const pullPlaytime = async () => {
    const id = (idDraft || steamId).trim();
    const key = (keyDraft || steamApiKey).trim();
    if (!parseSteamIdentity(id) || !key) {
      toast.error("Bitte Steam-ID (oder Profil-URL) und API-Schlüssel eintragen.");
      return;
    }
    setBusy(true);
    try {
      onSteamCredentials(id, key);
      const owned = await fetchOwnedSteamGames(id, key);
      if (owned.steamId && owned.steamId !== id) {
        setIdDraft(owned.steamId);
        onSteamCredentials(owned.steamId, key);
      }
      const result = onApplyPlaytime(owned.games);
      if (owned.games.length === 0) {
        toast.error("Steam lieferte keine Spiele. Ist die Bibliothek öffentlich?");
        return;
      }
      if (result.updated === 0) {
        toast.error(
          `Steam lieferte ${owned.games.length} Spiele, aber keine App-ID passt zur Bibliothek.`,
        );
        return;
      }
      toast.success(
        `Spielzeit für ${result.updated} Spiele übernommen${result.markedOwned ? `, ${result.markedOwned} als Besitz markiert` : ""}.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Spielzeit konnte nicht geladen werden.");
    } finally {
      setBusy(false);
    }
  };

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
    <M3Dialog open={open} onClose={onClose} headline="Einstellungen">
      <div className="settings">
        {busy ? <MorphLoader size={36} label="Steam wird abgefragt" /> : null}
        <M3Tabs activeTab={tab} onChange={(index) => setTab(index)}>
          <m3-tab panel="settings-steam" value="steam">
            Steam
          </m3-tab>
          <m3-tab panel="settings-theme" value="theme">
            Erscheinungsbild
          </m3-tab>
          <m3-tab panel="settings-data" value="data">
            Daten
          </m3-tab>
        </M3Tabs>

        <section id="settings-steam" className="settings" hidden={tab !== 0}>
          <p className="settings-copy">
            Nur lokal gespeichert. Wird ausschließlich an Steam geschickt, nie geloggt.
            Custom-URL und Profil-Link werden automatisch in eine 64-bit-ID aufgelöst.
          </p>
          <M3TextField
            label="Steam-ID, Custom-URL oder Profil-Link"
            value={idDraft}
            onChange={setIdDraft}
            placeholder="7656119… oder steamcommunity.com/id/…"
          />
          <M3TextField
            label="Web-API-Schlüssel"
            value={keyDraft}
            onChange={setKeyDraft}
            type="password"
          />
          <div className="settings-actions">
            <m3-button onClick={saveSteam}>Speichern</m3-button>
            <m3-button variant="text" disabled={busy} onClick={() => void refreshCovers()}>
              Cover &amp; Namen aktualisieren
            </m3-button>
            <m3-button variant="text" disabled={busy} onClick={() => void pullPlaytime()}>
              Spielzeit holen
            </m3-button>
          </div>
        </section>

        <section id="settings-theme" className="settings" hidden={tab !== 1}>
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

        <section id="settings-data" className="settings" hidden={tab !== 2}>
          {confirmReset ? (
            <div className="confirm-row">
              <span>Bibliothek auf die 19 Beispieleinträge zurücksetzen?</span>
              <m3-button
                className="danger-button"
                onClick={() => {
                  onReset();
                  setConfirmReset(false);
                  toast.success("Beispieldaten wiederhergestellt.");
                }}
              >
                Zurücksetzen
              </m3-button>
              <m3-button variant="text" onClick={() => setConfirmReset(false)}>
                Abbrechen
              </m3-button>
            </div>
          ) : (
            <m3-button className="danger-button" variant="outlined" onClick={() => setConfirmReset(true)}>
              Auf Beispieldaten zurücksetzen
            </m3-button>
          )}
        </section>
      </div>
    </M3Dialog>
  );
}
