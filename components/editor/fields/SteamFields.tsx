"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameRecord } from "@/lib/game-fields";
import { M3TextField } from "@/components/m3/host";
import { steamStoreUrl } from "@/lib/steam";

const STEAM_APP_ID_DEBOUNCE_MS = 400;

export function parsePositiveSteamAppId(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function SteamAppIdField({
  game,
  onChange,
}: {
  game: GameRecord;
  onChange: (patch: Partial<GameRecord>) => void;
}) {
  const committed = typeof game.steamAppId === "number" ? game.steamAppId : null;
  const [draft, setDraft] = useState(committed == null ? "" : String(committed));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const apply = useCallback(
    (raw: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const parsed = parsePositiveSteamAppId(raw);
      if (raw.trim() === "") {
        if (committed != null) onChange({ steamAppId: null, steamPrice: null });
        return;
      }
      if (parsed == null || parsed === committed) return;
      onChange({
        steamAppId: parsed,
        steamPrice: null,
      });
    },
    [committed, onChange],
  );

  const storeId = parsePositiveSteamAppId(draft) ?? committed;

  return (
    <div className="field">
      <M3TextField
        label="Steam App-ID"
        value={draft}
        onChange={(next) => {
          setDraft(next);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => apply(next), STEAM_APP_ID_DEBOUNCE_MS);
        }}
        onCommit={apply}
        placeholder="359870"
      />
      <div className="confirm-row">
        <m3-button
          variant="outlined"
          disabled={storeId == null}
          onClick={() => {
            if (storeId == null) return;
            apply(draft);
            window.open(steamStoreUrl(storeId), "_blank", "noopener,noreferrer");
          }}
        >
          Im Steam Store öffnen
        </m3-button>
      </div>
    </div>
  );
}
