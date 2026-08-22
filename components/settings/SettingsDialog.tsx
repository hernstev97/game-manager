"use client";

import { useState } from "react";
import { toast } from "@/components/m3/snackbar";
import { M3Dialog } from "@/components/m3/host";
import { IconClose } from "@/components/m3/icons";
import { MorphLoader } from "@/components/morph-loader";
import { SettingsNavigation } from "@/components/settings/SettingsNavigation";
import { SteamSettingsPanel } from "@/components/settings/SteamSettingsPanel";
import { IgdbSettingsPanel } from "@/components/settings/IgdbSettingsPanel";
import { AppearanceSettingsPanel } from "@/components/settings/AppearanceSettingsPanel";
import { DataSettingsPanel } from "@/components/settings/DataSettingsPanel";
import type { GameRecord } from "@/lib/game-fields";
import {
  fetchOwnedSteamGames,
  fetchSteamAppDetails,
  parseSteamIdentity,
  steamCover,
  type SteamPriceSnapshot,
} from "@/lib/steam";
import {
  fetchIgdbGame,
  hasIgdbCredentials,
  mergeCatalogFields,
} from "@/lib/igdb";

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export type SettingsIdentityUpdate = {
  id: string;
  name?: string;
  coverUrl?: string;
  released?: boolean;
  steamPrice?: SteamPriceSnapshot | null;
  genres?: string[];
  franchise?: string;
  platforms?: string[];
  igdbId?: number | null;
  steamAppId?: number | null;
};

export type SettingsDialogProps = {
  open: boolean;
  onClose: () => void;
  steamId: string;
  steamApiKey: string;
  igdbClientId: string;
  igdbClientSecret: string;
  games: GameRecord[];
  onSteamCredentials: (steamId: string, steamApiKey: string) => void;
  onIgdbCredentials: (clientId: string, clientSecret: string) => void;
  onClearLibrary: () => void;
  onApplyPlaytime: (
    owned: Array<{ appId: number; name: string; playtimeMinutes: number }>,
  ) => { updated: number; markedOwned: number };
  onRefreshIdentity: (updates: SettingsIdentityUpdate[]) => number;
  onImport: (file: File) => void;
  onExport: () => void;
};

export function SettingsDialog({
  open,
  onClose,
  steamId,
  steamApiKey,
  igdbClientId,
  igdbClientSecret,
  games,
  onSteamCredentials,
  onIgdbCredentials,
  onClearLibrary,
  onApplyPlaytime,
  onRefreshIdentity,
  onImport,
  onExport,
}: SettingsDialogProps) {
  const [idDraft, setIdDraft] = useState(steamId);
  const [keyDraft, setKeyDraft] = useState(steamApiKey);
  const [igdbIdDraft, setIgdbIdDraft] = useState(igdbClientId);
  const [igdbSecretDraft, setIgdbSecretDraft] = useState(igdbClientSecret);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState(0);
  const [mobileSectionOpen, setMobileSectionOpen] = useState(false);

  const saveSteam = () => {
    onSteamCredentials(idDraft.trim(), keyDraft.trim());
    toast.success("Steam-Zugangsdaten gespeichert.");
  };

  const saveIgdb = () => {
    onIgdbCredentials(igdbIdDraft.trim(), igdbSecretDraft.trim());
    toast.success("IGDB-Zugangsdaten gespeichert.");
  };

  const refreshCovers = async () => {
    setBusy(true);
    try {
      const withIds = games.filter((game) => game.steamAppId != null);
      const updates: Array<{
        id: string;
        name?: string;
        coverUrl?: string;
        released?: boolean;
        steamPrice?: SteamPriceSnapshot | null;
      }> = [];
      for (const game of withIds) {
        const appId = game.steamAppId!;
        try {
          const details = await fetchSteamAppDetails(appId);
          if (details) {
            updates.push({
              id: game.id,
              name: details.name || game.name,
              coverUrl: details.coverUrl || steamCover(appId),
              released: details.released,
              steamPrice: details.price,
            });
          } else {
            updates.push({ id: game.id, coverUrl: steamCover(appId) });
          }
        } catch {
          updates.push({ id: game.id, coverUrl: steamCover(appId) });
        }
      }
      const count = onRefreshIdentity(updates);
      toast.success(`${count} Cover, Namen und Preise aktualisiert.`);
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

  const refreshIgdb = async () => {
    const clientId = (igdbIdDraft || igdbClientId).trim();
    const clientSecret = (igdbSecretDraft || igdbClientSecret).trim();
    if (!hasIgdbCredentials({ clientId, clientSecret })) {
      toast.error("Bitte Twitch-Client-ID und Client-Secret eintragen.");
      return;
    }
    const withIds = games.filter((game) => game.igdbId != null);
    if (withIds.length === 0) {
      toast.error("Kein Spiel hat eine IGDB-ID.");
      return;
    }
    onIgdbCredentials(clientId, clientSecret);
    setBusy(true);
    try {
      const creds = { clientId, clientSecret };
      const updates: Array<{
        id: string;
        name?: string;
        coverUrl?: string;
        released?: boolean;
        genres?: string[];
        franchise?: string;
        platforms?: string[];
        igdbId?: number | null;
        steamAppId?: number | null;
      }> = [];
      let failures = 0;
      for (const [index, game] of withIds.entries()) {
        try {
          const details = await fetchIgdbGame({ kind: "id", value: game.igdbId! }, creds);
          if (details) {
            updates.push({ id: game.id, ...mergeCatalogFields(game, details) });
          } else {
            failures += 1;
          }
        } catch {
          failures += 1;
        }
        if (index < withIds.length - 1) await delay(280);
      }
      const count = onRefreshIdentity(updates);
      if (count === 0) {
        toast.error("Keine IGDB-Metadaten geladen.");
      } else if (failures > 0) {
        toast.success(
          `${count} IGDB-Metadaten aktualisiert, ${failures} fehlgeschlagen.`,
        );
      } else {
        toast.success(`${count} IGDB-Metadaten aktualisiert.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "IGDB-Aktualisierung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <M3Dialog
      open={open}
      onClose={onClose}
      headline="Einstellungen"
      presentation="fullscreen"
      leadingAction={
        <m3-icon-button aria-label="Einstellungen schließen" onClick={onClose}>
          <IconClose />
        </m3-icon-button>
      }
    >
      <div className={`settings settings-dialog-content ${mobileSectionOpen ? "mobile-settings-detail" : "mobile-settings-root"}`}>
        {busy ? <MorphLoader size={36} label="Katalog wird abgefragt" /> : null}
        <SettingsNavigation
          tab={tab}
          onTabChange={setTab}
          onMobileSectionOpen={setMobileSectionOpen}
        />
        <SteamSettingsPanel
          hidden={tab !== 0}
          idDraft={idDraft}
          keyDraft={keyDraft}
          busy={busy}
          onIdDraftChange={setIdDraft}
          onKeyDraftChange={setKeyDraft}
          onSave={saveSteam}
          onRefreshCovers={refreshCovers}
          onPullPlaytime={pullPlaytime}
        />
        <IgdbSettingsPanel
          hidden={tab !== 1}
          idDraft={igdbIdDraft}
          secretDraft={igdbSecretDraft}
          busy={busy}
          onIdDraftChange={setIgdbIdDraft}
          onSecretDraftChange={setIgdbSecretDraft}
          onSave={saveIgdb}
          onRefresh={refreshIgdb}
        />
        <AppearanceSettingsPanel hidden={tab !== 2} />
        <DataSettingsPanel
          hidden={tab !== 3}
          onClearLibrary={onClearLibrary}
          onImport={onImport}
          onExport={onExport}
        />
      </div>
    </M3Dialog>
  );
}
