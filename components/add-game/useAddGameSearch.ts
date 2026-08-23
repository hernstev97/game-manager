"use client";

import { useEffect, useMemo, useState } from "react";
import type { GameRecord } from "@/lib/game-fields";
import {
  hasIgdbCredentials,
  parseIgdbInput,
  searchIgdbGames,
  type IgdbSearchHit,
  type IgdbRef,
} from "@/lib/igdb";
import {
  parseSteamInput,
  searchSteamStore,
  type SteamSearchHit,
} from "@/lib/steam";

export function useAddGameSearch({
  open,
  games,
  query,
  igdbClientId,
  igdbClientSecret,
  online,
}: {
  open: boolean;
  games: GameRecord[];
  query: string;
  igdbClientId: string;
  igdbClientSecret: string;
  online: boolean;
}) {
  const [steamHits, setSteamHits] = useState<SteamSearchHit[]>([]);
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
    if (!open || !online || steamId || igdbKey || !catalogQuery) return;
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
  }, [
    open,
    online,
    query,
    steamId,
    igdbKey,
    catalogQuery,
    igdbReady,
    igdbClientId,
    igdbClientSecret,
  ]);

  return {
    steamId,
    igdbRef: igdbRef as IgdbRef | null,
    igdbReady,
    creds,
    catalogQuery,
    existing,
    searching: Boolean(open && online && catalogQuery && resolvedQuery !== query),
    igdbHits,
    visibleSteam: catalogQuery ? steamHits : [],
    visibleIgdb: catalogQuery ? igdbHits : [],
  };
}
