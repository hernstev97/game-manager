"use client";

import type { SteamSearchHit } from "@/lib/steam";
import { MorphLoader } from "@/components/morph-loader";
import { ResultItem } from "@/components/add-game/ResultItem";

export function SteamSearchResults({
  hits,
  busy,
  hasIgdbResults,
  onChoose,
}: {
  hits: SteamSearchHit[];
  busy: boolean;
  hasIgdbResults: boolean;
  onChoose: (appId: number) => void;
}) {
  if (hits.length === 0) return null;

  return (
    <section>
      <h3>Steam</h3>
      {busy && !hasIgdbResults ? <MorphLoader size={32} label="Steam-Details werden geladen" /> : null}
      <m3-list>
        {hits.map((hit) => (
          <ResultItem
            key={hit.appId}
            id={String(hit.appId)}
            name={hit.name}
            supporting={`App ${hit.appId}`}
            coverUrl={hit.coverUrl}
            steamAppId={hit.appId}
            disabled={busy}
            onChoose={() => onChoose(hit.appId)}
          />
        ))}
      </m3-list>
    </section>
  );
}
