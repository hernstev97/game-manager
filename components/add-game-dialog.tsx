"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/m3/snackbar";
import { M3Dialog, M3TextField } from "@/components/m3/host";
import { CoverImage } from "@/components/cover-image";
import type { GameRecord } from "@/lib/game-fields";
import { fetchSteamAppDetails, parseSteamInput, searchSteamStore, steamCover } from "@/lib/steam";
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
  onClose,
  onCreate,
  onOpenExisting,
}: {
  open: boolean;
  games: GameRecord[];
  onClose: () => void;
  onCreate: (partial: Partial<GameRecord>) => void;
  onOpenExisting: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [hits, setHits] = useState<Array<{ appId: number; name: string; coverUrl: string }>>([]);
  const [resolvedQuery, setResolvedQuery] = useState("");

  const steamId = parseSteamInput(query);
  const existing = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("de-DE");
    if (needle.length < 2) return [];
    return games
      .filter((game) => {
        if (steamId && game.steamAppId === steamId) return true;
        return game.name.toLocaleLowerCase("de-DE").includes(needle);
      })
      .slice(0, 5);
  }, [games, query, steamId]);

  useEffect(() => {
    if (!open || steamId || query.trim().length < 3) return;
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      try {
        const results = await searchSteamStore(query);
        if (!cancelled) setHits(results);
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setResolvedQuery(query);
      }
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [open, query, steamId]);

  const searching = Boolean(open && !steamId && query.trim().length >= 3 && resolvedQuery !== query);

  const visibleHits = !steamId && query.trim().length >= 3 ? hits : [];

  const createFromSteam = async (appId: number) => {
    setBusy(true);
    try {
      const details = await fetchSteamAppDetails(appId);
      onCreate({
        steamAppId: appId,
        name: details?.name || query.trim() || `Steam ${appId}`,
        coverUrl: details?.coverUrl || steamCover(appId),
        released: details?.released ?? true,
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

  const createManual = () => {
    const name = query.trim();
    if (steamId) {
      void createFromSteam(steamId);
      return;
    }
    if (!name) {
      toast.error("Bitte einen Namen oder eine Steam-App-ID eingeben.");
      return;
    }
    onCreate({ name });
  };

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
            {steamId ? "Von Steam anlegen" : "Manuell anlegen"}
          </m3-button>
        </>
      }
    >
      <div className="add-dialog">
        <M3TextField
          label="Name, Steam-URL oder App-ID"
          value={query}
          onChange={setQuery}
          placeholder="Final Fantasy … oder 359870"
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

        {searching ? (
          <MorphLoader size={32} label="Steam-Suche läuft" />
        ) : null}

        {visibleHits.length > 0 ? (
          <section>
            <h3>Steam-Suche</h3>
            {busy ? <MorphLoader size={32} label="Steam-Details werden geladen" /> : null}
            <m3-list>
              {visibleHits.map((hit) => (
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
