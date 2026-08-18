"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  DEFAULT_THEME_SEED,
  SCHEME_VARIANT_LABELS,
  THEME_PRESETS,
  createWallpaperThemes,
  generateThemePair,
  normalizeHexColor,
  resolveBrowserAccent,
  schemeVariants,
  seedsFromImageFile,
  themeSwatch,
  type SchemeVariant,
  type WallpaperTheme,
} from "@/lib/theme";
import { DangerButton, FilledButton, Modal, TextButton, TextField } from "@/components/ui";
import { useTheme } from "@/components/theme-provider";
import { fetchOwnedSteamGames, fetchSteamAppDetails, parseSteamIdentity, steamCover } from "@/lib/steam";
import type { GameRecord } from "@/lib/game-fields";
import { cn } from "@/lib/cn";

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
    <Modal open={open} onClose={onClose} title="Einstellungen" wide>
      <div className="settings">
        <div className="settings-intro">
          <span className="settings-intro-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <div>
            <span className="section-eyebrow">PERSONALISIEREN</span>
            <h3>Mach die Bibliothek zu deiner.</h3>
            <p>Farbkern, Datenquelle und Darstellung bleiben unter deiner Kontrolle.</p>
          </div>
        </div>

        <section className="settings-section">
          <h3>Steam</h3>
          <p className="settings-copy">
            Nur lokal gespeichert. Wird ausschließlich an Steam geschickt, nie geloggt.
            Custom-URL und Profil-Link werden automatisch in eine 64-bit-ID aufgelöst.
          </p>
          <div className="settings-grid">
            <TextField
              label="Steam-ID, Custom-URL oder Profil-Link"
              value={idDraft}
              onChange={setIdDraft}
              placeholder="7656119… oder steamcommunity.com/id/…"
            />
            <TextField
              label="Web-API-Schlüssel"
              value={keyDraft}
              onChange={setKeyDraft}
              type="password"
            />
          </div>
          <div className="chip-row">
            <FilledButton onClick={saveSteam}>Speichern</FilledButton>
            <TextButton disabled={busy} onClick={() => void refreshCovers()}>
              Cover &amp; Namen aktualisieren
            </TextButton>
            <TextButton disabled={busy} onClick={() => void pullPlaytime()}>
              Spielzeit holen
            </TextButton>
          </div>
        </section>

        <section className="settings-section">
          <h3>Erscheinungsbild</h3>
          <div className="segmented">
            {(["light", "dark", "system"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={cn(prefs.mode === mode && "is-active")}
                onClick={() => setMode(mode)}
              >
                {mode === "light" ? "Hell" : mode === "dark" ? "Dunkel" : "System"}
              </button>
            ))}
          </div>
          <div className="field">
            <span className="field-label">Schema</span>
            <div className="chip-row">
              {schemeVariants.map((variant) => {
                const pair = generateThemePair(prefs.seed, variant);
                const swatch = themeSwatch(pair);
                return (
                  <button
                    key={variant}
                    type="button"
                    className={cn("swatch-chip", prefs.variant === variant && "is-active")}
                    onClick={() => setVariant(variant as SchemeVariant)}
                  >
                    <span className="swatch">
                      {swatch.map((color) => (
                        <i key={color} style={{ background: color }} />
                      ))}
                    </span>
                    {SCHEME_VARIANT_LABELS[variant]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="field">
            <span className="field-label">Farbkern</span>
            <div className="chip-row">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={cn("swatch-chip", prefs.seed === preset.seed && prefs.source === "preset" && "is-active")}
                  onClick={() => {
                    setHexDraft(preset.seed);
                    setSeed(preset.seed, "preset");
                  }}
                >
                  <i className="seed-dot" style={{ background: preset.seed }} />
                  {preset.label}
                </button>
              ))}
              <TextButton onClick={useAccent}>Systemakzent</TextButton>
            </div>
            <div className="hex-row">
              <TextField label="Hex" value={hexDraft} onChange={setHexDraft} placeholder={DEFAULT_THEME_SEED} />
              <FilledButton onClick={applyHex}>Übernehmen</FilledButton>
            </div>
            <label className="file-pick">
              Farben aus Bild ableiten
              <input
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
                  <button
                    key={`${item.seed}-${item.variant}-${index}`}
                    type="button"
                    className="swatch-chip"
                    onClick={() => applyWallpaper(item)}
                  >
                    <span className="swatch">
                      {item.swatch.map((color) => (
                        <i key={color} style={{ background: color }} />
                      ))}
                    </span>
                    {SCHEME_VARIANT_LABELS[item.variant]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="settings-section settings-section-danger">
          <h3>Daten</h3>
          {confirmReset ? (
            <div className="confirm-row">
              <span>Bibliothek auf die 19 Beispieleinträge zurücksetzen?</span>
              <DangerButton
                onClick={() => {
                  onReset();
                  setConfirmReset(false);
                  toast.success("Beispieldaten wiederhergestellt.");
                }}
              >
                Zurücksetzen
              </DangerButton>
              <TextButton onClick={() => setConfirmReset(false)}>Abbrechen</TextButton>
            </div>
          ) : (
            <DangerButton onClick={() => setConfirmReset(true)}>
              Auf Beispieldaten zurücksetzen
            </DangerButton>
          )}
        </section>
      </div>
    </Modal>
  );
}
