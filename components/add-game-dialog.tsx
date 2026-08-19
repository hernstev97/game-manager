"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/m3/snackbar";
import { M3Dialog, M3TextField } from "@/components/m3/host";
import { CoverImage } from "@/components/cover-image";
import type { GameRecord } from "@/lib/game-fields";
import {
  fetchSteamAppDetails,
  parseSteamInput,
  searchSteamStore,
  steamCover,
  type SteamPriceSnapshot,
} from "@/lib/steam";
import {
  catalogFieldsFromIgdb,
  fetchIgdbGame,
  hasIgdbCredentials,
  parseIgdbInput,
  searchIgdbGames,
  supportingTextForHit,
  type IgdbSearchHit,
} from "@/lib/igdb";
import { useHostEvent } from "@/components/m3/events";
import { MorphLoader } from "@/components/morph-loader";

function ResultItem({
  id,
  name,
  supporting,
  coverUrl,
  steamAppId,
  disabled,
  onChoose,
}: {
  id: string;
  name: string;
  supporting: string;
  coverUrl: string;
  steamAppId: number | null;
  disabled?: boolean;
  onChoose: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useHostEvent(ref, "item-click", onChoose);
  return (
    <m3-list-item ref={ref} lines="2" clickable disabled={disabled} value={id} shape="rounded">
      <span slot="leading">
        <CoverImage name={name} coverUrl={coverUrl} steamAppId={steamAppId} />
      </span>
      {name}
      <span slot="supporting-text">{supporting}</span>
    </m3-list-item>
  );
}

export function AddGameDialog({
  open,
  games,
  igdbClientId,
  igdbClientSecret,
  onClose,
  onCreate,
  onOpenExisting,
}: {
  open: boolean;
  games: GameRecord[];
  igdbClientId: string;
  igdbClientSecret: string;
  onClose: () => void;
  onCreate: (partial: Partial<GameRecord>) => void;
  onOpenExisting: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [steamHits, setSteamHits] = useState<Array<{ appId: number; name: string; coverUrl: string }>>(
    [],
  );
  const [igdbHits, setIgdbHits] = useState<IgdbSearchHit[]>([]);
  const [resolvedQuery, setResolvedQuery] = useState("");

  const steamId = parseSteamInput(query);
  const igdbRef = parseIgdbInput(query);
  const igdbReady = hasIgdbCredentials({ clientId: igdbClientId, clientSecret: igdbClientSecret });
  const creds = { clientId: igdbClientId, clientSecret: igdbClientSecret };
  const catalogQuery = !steamId && !igdbRef && query.trim().length >= 3;
  const igdbKey = igdbRef ? `${igdbRef.kind}:${igdbRef.value}` : "";

  const existing = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("de-DE");
    if (needle.length < 2 && !steamId && !igdbRef) return [];
    return games
      .filter((game) => {
        if (steamId && game.steamAppId === steamId) return true;
        if (igdbRef?.kind === "id" && game.igdbId === igdbRef.value) return true;
        if (!needle || needle.length < 2) return false;
        return game.name.toLocaleLowerCase("de-DE").includes(needle);
      })
      .slice(0, 5);
  }, [games, query, steamId, igdbRef]);

  useEffect(() => {
    if (!open || steamId || igdbKey || !catalogQuery) return;
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      try {
        const [steamResults, igdbResults] = await Promise.all([
          searchSteamStore(query).catch(() => []),
          igdbReady
            ? searchIgdbGames(query, { clientId: igdbClientId, clientSecret: igdbClientSecret }).catch(
                () => [],
              )
            : Promise.resolve([]),
        ]);
        if (!cancelled) {
          setSteamHits(steamResults);
          setIgdbHits(igdbResults);
        }
      } finally {
        if (!cancelled) setResolvedQuery(query);
      }
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [open, query, steamId, igdbKey, catalogQuery, igdbReady, igdbClientId, igdbClientSecret]);

  const searching = Boolean(open && catalogQuery && resolvedQuery !== query);
  const visibleSteam = catalogQuery ? steamHits : [];
  const visibleIgdb = catalogQuery ? igdbHits : [];

  const createFromSteam = async (appId: number) => {
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
      let steamPrice: SteamPriceSnapshot | null = null;
      if (fields.steamAppId) {
        try {
          const steam = await fetchSteamAppDetails(fields.steamAppId);
          steamPrice = steam?.price ?? null;
        } catch {
          steamPrice = null;
        }
      }
      onCreate({
        ...fields,
        steamPrice,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "IGDB-Details nicht geladen.");
    } finally {
      setBusy(false);
    }
  };

  const createFromIgdbHit = async (id: number) => {
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
      let steamPrice: SteamPriceSnapshot | null = null;
      if ("steamAppId" in fields && fields.steamAppId) {
        try {
          const steam = await fetchSteamAppDetails(fields.steamAppId);
          steamPrice = steam?.price ?? null;
        } catch {
          steamPrice = null;
        }
      }
      onCreate({
        ...fields,
        name: fields.name || query.trim(),
        steamPrice,
      });
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
      actions={
        <>
          <m3-button slot="actions" variant="text" onClick={onClose}>
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
          label="Name, Steam-URL, App-ID oder IGDB-Link"
          value={query}
          onChange={setQuery}
          placeholder="Wind Waker … oder igdb.com/games/…"
          autoFocus
        />

        {existing.length > 0 ? (
          <section>
            <h3>Bereits in der Bibliothek</h3>
            <m3-list>
              {existing.map((game) => (
                <ResultItem
                  key={game.id}
                  id={game.id}
                  name={game.name}
                  supporting={game.franchise}
                  coverUrl={game.coverUrl}
                  steamAppId={game.steamAppId}
                  onChoose={() => onOpenExisting(game.id)}
                />
              ))}
            </m3-list>
          </section>
        ) : null}

        {searching ? <MorphLoader size={32} label="Suche läuft" /> : null}

        {catalogQuery && !igdbReady ? (
          <p className="settings-copy">
            IGDB in den Einstellungen verbinden, um Cover und Plattformen für Switch, PlayStation und
            Retro zu laden. Steam-Suche funktioniert ohne extra Schlüssel.
          </p>
        ) : null}

        {visibleIgdb.length > 0 ? (
          <section>
            <h3>IGDB</h3>
            {busy ? <MorphLoader size={32} label="Details werden geladen" /> : null}
            <m3-list>
              {visibleIgdb.map((hit) => (
                <ResultItem
                  key={`igdb-${hit.id}`}
                  id={`igdb-${hit.id}`}
                  name={hit.name}
                  supporting={supportingTextForHit(hit)}
                  coverUrl={hit.coverUrl}
                  steamAppId={null}
                  disabled={busy}
                  onChoose={() => void createFromIgdbHit(hit.id)}
                />
              ))}
            </m3-list>
          </section>
        ) : null}

        {visibleSteam.length > 0 ? (
          <section>
            <h3>Steam</h3>
            {busy && visibleIgdb.length === 0 ? (
              <MorphLoader size={32} label="Steam-Details werden geladen" />
            ) : null}
            <m3-list>
              {visibleSteam.map((hit) => (
                <ResultItem
                  key={hit.appId}
                  id={String(hit.appId)}
                  name={hit.name}
                  supporting={`App ${hit.appId}`}
                  coverUrl={hit.coverUrl}
                  steamAppId={hit.appId}
                  disabled={busy}
                  onChoose={() => void createFromSteam(hit.appId)}
                />
              ))}
            </m3-list>
          </section>
        ) : null}
      </div>
    </M3Dialog>
  );
}
