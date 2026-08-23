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
  parseSteamIdentity,
} from "@/lib/steam";
import {
  hasIgdbCredentials,
} from "@/lib/igdb";

type MetadataRefreshTarget = { gameId: string; externalId: number };

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
  onClearLibrary: () => Promise<void>;
  onQueueSteamMetadata: (targets: MetadataRefreshTarget[]) => Promise<number>;
  onQueueIgdbMetadata: (targets: MetadataRefreshTarget[]) => Promise<number>;
  onOpenSteamImport: () => void;
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
  onQueueSteamMetadata,
  onQueueIgdbMetadata,
  onOpenSteamImport,
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

  const openSteamImport = () => {
    const id = (idDraft || steamId).trim();
    const key = (keyDraft || steamApiKey).trim();
    if (!parseSteamIdentity(id) || !key) {
      toast.error("Bitte Steam-ID (oder Profil-URL) und API-Schlüssel eintragen.");
      return;
    }
    onSteamCredentials(id, key);
    onOpenSteamImport();
  };

  const refreshCovers = async () => {
    setBusy(true);
    try {
      const withIds = games.filter((game) => game.steamAppId != null);
      if (withIds.length === 0) {
        toast.error("Kein Spiel hat eine Steam-App-ID.");
        return;
      }
      const count = await onQueueSteamMetadata(
        withIds.map((game) => ({ gameId: game.id, externalId: game.steamAppId! })),
      );
      toast.success(`${count} Steam-Aktualisierungen vorbereitet.`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Steam-Aktualisierung fehlgeschlagen.");
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
      const count = await onQueueIgdbMetadata(
        withIds.map((game) => ({ gameId: game.id, externalId: game.igdbId! })),
      );
      toast.success(`${count} IGDB-Aktualisierungen vorbereitet.`);
      onClose();
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
          onOpenImport={openSteamImport}
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
