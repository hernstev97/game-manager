"use client";

import type { IgdbSearchHit } from "@/lib/igdb";
import type { SteamSearchHit } from "@/lib/steam";
import { MorphLoader } from "@/components/morph-loader";
import { IgdbSearchResults } from "@/components/add-game/IgdbSearchResults";
import { SteamSearchResults } from "@/components/add-game/SteamSearchResults";

export function CatalogSearchResults({
  catalogQuery,
  igdbReady,
  searching,
  busy,
  igdbHits,
  steamHits,
  onChooseIgdb,
  onChooseSteam,
}: {
  catalogQuery: boolean;
  igdbReady: boolean;
  searching: boolean;
  busy: boolean;
  igdbHits: IgdbSearchHit[];
  steamHits: SteamSearchHit[];
  onChooseIgdb: (id: number) => void;
  onChooseSteam: (appId: number) => void;
}) {
  if (!catalogQuery) return null;

  return (
    <>
      {searching ? <MorphLoader size={32} label="Suche läuft" /> : null}
      {!igdbReady ? (
        <p className="settings-copy">
          IGDB in den Einstellungen verbinden, um Cover und Plattformen für Switch, PlayStation und
          Retro zu laden. Steam-Suche funktioniert ohne extra Schlüssel.
        </p>
      ) : null}
      <IgdbSearchResults hits={igdbHits} busy={busy} onChoose={onChooseIgdb} />
      <SteamSearchResults
        hits={steamHits}
        busy={busy}
        hasIgdbResults={igdbHits.length > 0}
        onChoose={onChooseSteam}
      />
    </>
  );
}
