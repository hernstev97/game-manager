"use client";

import { useState } from "react";
import { toast } from "@/components/m3/snackbar";
import { M3Dialog, M3TextField } from "@/components/m3/host";
import type { GameRecord } from "@/lib/game-fields";
import {
  catalogFieldsFromIgdb,
  fetchIgdbGame,
} from "@/lib/igdb";
import { fetchSteamAppDetails, steamCover, type SteamPriceSnapshot } from "@/lib/steam";
import { useAddGameSearch } from "@/components/add-game/useAddGameSearch";
import { CatalogSearchResults } from "@/components/add-game/CatalogSearchResults";
import { ExistingGameResults } from "@/components/add-game/ExistingGameResults";
import { IconClose } from "@/components/m3/icons";
import { OfflineActionNotice, useOnlineStatus } from "@/components/pwa";

export function AddGameDialog({
  open,
  games,
  igdbClientId,
  igdbClientSecret,
  initialQuery = "",
  onClose,
  onCreate,
  onOpenExisting,
}: {
  open: boolean;
  games: GameRecord[];
  igdbClientId: string;
  igdbClientSecret: string;
  initialQuery?: string;
  onClose: () => void;
  onCreate: (partial: Partial<GameRecord>) => void;
  onOpenExisting: (id: string) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [busy, setBusy] = useState(false);
  const online = useOnlineStatus();
  const {
    steamId,
    igdbRef,
    igdbReady,
    creds,
    catalogQuery,
    existing,
    searching,
    igdbHits,
    visibleSteam,
    visibleIgdb,
  } = useAddGameSearch({
    open,
    games,
    query,
    igdbClientId,
    igdbClientSecret,
    online,
  });

  const createFromSteam = async (appId: number) => {
    if (!online) {
      onCreate({
        steamAppId: appId,
        name: query.trim() || `Steam ${appId}`,
        coverUrl: steamCover(appId),
      });
      toast.success("Offline lokal angelegt; Steam-Details können später ergänzt werden.");
      return;
    }
    setBusy(true);
    try {
      const details = await fetchSteamAppDetails(appId);
      onCreate({
        steamAppId: appId,
        name: details?.name || query.trim() || `Steam ${appId}`,
        coverUrl: details?.coverUrl || steamCover(appId),
        released: details?.released ?? true,
        steamPrice: details?.price ?? null,
      });
    } catch {
      onCreate({
        steamAppId: appId,
        name: query.trim() || `Steam ${appId}`,
        coverUrl: steamCover(appId),
      });
      toast.error("Steam-Details nicht geladen — Spiel trotzdem angelegt.");
    } finally {
      setBusy(false);
    }
  };

  const createFromIgdb = async () => {
    if (!igdbRef) return;
    if (!online) {
      toast.error("IGDB ist offline nicht verfügbar.");
      return;
    }
    if (!igdbReady) {
      toast.error("IGDB in den Einstellungen verbinden (Twitch-Client-ID und Secret).");
      return;
    }
    setBusy(true);
    try {
      const details = await fetchIgdbGame(igdbRef, creds);
      if (!details) {
        toast.error("IGDB hat kein Spiel zu dieser ID gefunden.");
        return;
      }
      const fields = catalogFieldsFromIgdb(details);
      const steamPrice = await priceForSteamApp(fields.steamAppId);
      onCreate({ ...fields, steamPrice });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "IGDB-Details nicht geladen.");
    } finally {
      setBusy(false);
    }
  };

  const createFromIgdbHit = async (id: number) => {
    if (!online) {
      toast.error("IGDB ist offline nicht verfügbar.");
      return;
    }
    if (!igdbReady) {
      toast.error("IGDB in den Einstellungen verbinden (Twitch-Client-ID und Secret).");
      return;
    }
    setBusy(true);
    try {
      const details = await fetchIgdbGame({ kind: "id", value: id }, creds);
      const fallback = igdbHits.find((hit) => hit.id === id);
      if (!details && !fallback) {
        toast.error("IGDB-Details nicht geladen.");
        return;
      }
      const fields = details
        ? catalogFieldsFromIgdb(details)
        : {
            igdbId: fallback!.id,
            name: fallback!.name,
            coverUrl: fallback!.coverUrl,
            platforms: fallback!.platforms,
            released: true,
          };
      const steamPrice = await priceForSteamApp("steamAppId" in fields ? fields.steamAppId : null);
      onCreate({ ...fields, name: fields.name || query.trim(), steamPrice });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "IGDB-Details nicht geladen.");
    } finally {
      setBusy(false);
    }
  };

  const createManual = () => {
    if (steamId) {
      void createFromSteam(steamId);
      return;
    }
    if (igdbRef) {
      void createFromIgdb();
      return;
    }
    const name = query.trim();
    if (!name) {
      toast.error("Bitte einen Namen, eine Steam-App-ID oder eine IGDB-URL eingeben.");
      return;
    }
    onCreate({ name });
  };

  const primaryLabel = steamId ? "Von Steam anlegen" : igdbRef ? "Von IGDB anlegen" : "Manuell anlegen";

  return (
    <M3Dialog
      open={open}
      onClose={onClose}
      headline="Spiel hinzufügen"
      presentation="fullscreen"
      leadingAction={
        <m3-icon-button aria-label="Schließen" onClick={onClose}>
          <IconClose />
        </m3-icon-button>
      }
      actions={
        <>
          <m3-button className="desktop-dialog-cancel" slot="actions" variant="text" onClick={onClose}>
            Abbrechen
          </m3-button>
          <m3-button slot="actions" loading={busy} onClick={createManual}>
            {primaryLabel}
          </m3-button>
        </>
      }
    >
      <div className="add-dialog">
        <M3TextField
          label="Spiel suchen oder Link einfügen"
          value={query}
          onChange={setQuery}
          placeholder="Name, Steam-URL, App-ID oder IGDB-Link"
          autoFocus
        />
        <OfflineActionNotice>
          Katalogsuche und Metadaten sind offline nicht verfügbar. Spiele können weiterhin manuell
          oder über eine Steam-App-ID angelegt werden.
        </OfflineActionNotice>
        <ExistingGameResults games={existing} onOpenExisting={onOpenExisting} />
        <CatalogSearchResults
          catalogQuery={catalogQuery}
          igdbReady={igdbReady}
          searching={searching}
          busy={busy}
          igdbHits={visibleIgdb}
          steamHits={visibleSteam}
          onChooseIgdb={(id) => void createFromIgdbHit(id)}
          onChooseSteam={(appId) => void createFromSteam(appId)}
        />
      </div>
    </M3Dialog>
  );
}

async function priceForSteamApp(appId: number | null | undefined): Promise<SteamPriceSnapshot | null> {
  if (!appId) return null;
  try {
    const steam = await fetchSteamAppDetails(appId);
    return steam?.price ?? null;
  } catch {
    return null;
  }
}
