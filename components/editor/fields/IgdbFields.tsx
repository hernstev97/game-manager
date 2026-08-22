"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameRecord } from "@/lib/game-fields";
import { M3TextField } from "@/components/m3/host";
import { toast } from "@/components/m3/snackbar";
import { fetchIgdbGame, hasIgdbCredentials, igdbSearchUrl, mergeCatalogFields } from "@/lib/igdb";
import { useLibrary } from "@/store/library";

const IGDB_ID_DEBOUNCE_MS = 400;

function parsePositiveIgdbId(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function IgdbIdField({
  game,
  onChange,
}: {
  game: GameRecord;
  onChange: (patch: Partial<GameRecord>) => void;
}) {
  const igdbClientId = useLibrary((state) => state.igdbClientId);
  const igdbClientSecret = useLibrary((state) => state.igdbClientSecret);
  const committed = typeof game.igdbId === "number" ? game.igdbId : null;
  const [draft, setDraft] = useState(committed == null ? "" : String(committed));
  const [busy, setBusy] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const requestSeq = useRef(0);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const apply = useCallback(
    (raw: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const parsed = parsePositiveIgdbId(raw);
      if (raw.trim() === "") {
        if (committed != null) onChange({ igdbId: null });
        return;
      }
      if (parsed == null || parsed === committed) return;
      onChange({ igdbId: parsed });
    },
    [committed, onChange],
  );

  const storeId = parsePositiveIgdbId(draft) ?? committed;
  const creds = { clientId: igdbClientId, clientSecret: igdbClientSecret };
  const ready = hasIgdbCredentials(creds);

  const loadMetadata = async () => {
    const id = storeId;
    if (id == null) {
      toast.error("Bitte zuerst eine IGDB-ID eintragen.");
      return;
    }
    if (!ready) {
      toast.error("IGDB in den Einstellungen verbinden (Twitch-Client-ID und Secret).");
      return;
    }
    apply(draft);
    const seq = ++requestSeq.current;
    const requestedId = id;
    setBusy(true);
    try {
      const details = await fetchIgdbGame({ kind: "id", value: requestedId }, creds);
      if (seq !== requestSeq.current) return;
      if (!details) {
        toast.error("IGDB hat kein Spiel zu dieser ID gefunden.");
        return;
      }
      const latest = useLibrary.getState().games.find((item) => item.id === game.id);
      if (!latest || latest.igdbId !== requestedId) return;
      onChange(mergeCatalogFields(latest, details));
      toast.success("IGDB-Metadaten übernommen.");
    } catch (error) {
      if (seq !== requestSeq.current) return;
      toast.error(error instanceof Error ? error.message : "IGDB-Metadaten nicht geladen.");
    } finally {
      if (seq === requestSeq.current) setBusy(false);
    }
  };

  return (
    <div className="field">
      <M3TextField
        label="IGDB-ID"
        value={draft}
        onChange={(next) => {
          setDraft(next);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => apply(next), IGDB_ID_DEBOUNCE_MS);
        }}
        onCommit={apply}
        placeholder="1026"
        helperText={ready ? undefined : "Twitch-App in den Einstellungen eintragen, um zu laden."}
      />
      <div className="confirm-row">
        <m3-button
          variant="outlined"
          disabled={!game.name && storeId == null}
          onClick={() => {
            window.open(
              igdbSearchUrl(game.name || (storeId != null ? String(storeId) : "")),
              "_blank",
              "noopener,noreferrer",
            );
          }}
        >
          Bei IGDB öffnen
        </m3-button>
        <m3-button variant="text" disabled={busy || storeId == null} onClick={() => void loadMetadata()}>
          Metadaten laden
        </m3-button>
      </div>
    </div>
  );
}
