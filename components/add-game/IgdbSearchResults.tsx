"use client";

import type { IgdbSearchHit } from "@/lib/igdb";
import { MorphLoader } from "@/components/morph-loader";
import { ResultItem } from "@/components/add-game/ResultItem";
import { supportingTextForHit } from "@/lib/igdb";

export function IgdbSearchResults({
  hits,
  busy,
  onChoose,
}: {
  hits: IgdbSearchHit[];
  busy: boolean;
  onChoose: (id: number) => void;
}) {
  if (hits.length === 0) return null;

  return (
    <section>
      <h3>IGDB</h3>
      {busy ? <MorphLoader size={32} label="Details werden geladen" /> : null}
      <m3-list>
        {hits.map((hit) => (
          <ResultItem
            key={`igdb-${hit.id}`}
            id={`igdb-${hit.id}`}
            name={hit.name}
            supporting={supportingTextForHit(hit)}
            coverUrl={hit.coverUrl}
            steamAppId={null}
            disabled={busy}
            onChoose={() => onChoose(hit.id)}
          />
        ))}
      </m3-list>
    </section>
  );
}
