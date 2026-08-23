"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameRecord } from "@/lib/game-fields";
import { formatDate } from "@/lib/game-fields";
import { M3Chip } from "@/components/m3/host";
import { toast } from "@/components/m3/snackbar";
import { MorphLoader } from "@/components/morph-loader";
import {
  fetchSteamAppDetails,
  formatMoneyFromCents,
  isSteamPriceSnapshot,
} from "@/lib/steam";

export function SteamPriceField({
  game,
  onChange,
}: {
  game: GameRecord;
  onChange: (patch: Partial<GameRecord>) => void;
}) {
  const appId = game.steamAppId;
  const price = isSteamPriceSnapshot(game.steamPrice) ? game.steamPrice : null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptedFor = useRef<number | null>(null);
  const appIdRef = useRef(appId);
  const requestSeq = useRef(0);

  const load = useCallback(
    async (id: number, manual: boolean) => {
      const seq = ++requestSeq.current;
      setBusy(true);
      if (manual) setError(null);
      try {
        const details = await fetchSteamAppDetails(id);
        if (seq !== requestSeq.current) return;
        if (!details) {
          setError("Steam lieferte keine Spieldetails.");
          return;
        }
        onChange({ steamPrice: details.price, released: details.released });
        setError(details.price ? null : "Steam hat keinen Store-Preis geliefert.");
      } catch (err) {
        if (seq !== requestSeq.current) return;
        const message = err instanceof Error ? err.message : "Preis konnte nicht geladen werden.";
        setError(message);
        if (manual) toast.error(message);
      } finally {
        if (seq === requestSeq.current) setBusy(false);
      }
    },
    [onChange],
  );

  useEffect(() => {
    appIdRef.current = appId;
    if (appId == null) {
      attemptedFor.current = null;
      requestSeq.current += 1;
      return;
    }
    if (price) return;
    if (attemptedFor.current === appId) return;
    attemptedFor.current = appId;
    void load(appId, false);
  }, [appId, price, load]);

  const original =
    price &&
    !price.isFree &&
    price.initialCents != null &&
    price.finalCents != null &&
    price.initialCents > price.finalCents
      ? formatMoneyFromCents(price.initialCents, price.currency)
      : null;

  return (
    <div className="field">
      <span className="field-label">Steam-Preis</span>
      {appId == null ? (
        <p className="settings-copy">Keine Steam-App-ID — Preis kann nicht geladen werden.</p>
      ) : (
        <>
          <div className="steam-price">
            {busy && !price ? (
              <MorphLoader size={28} label="Steam-Preis wird geladen" />
            ) : price ? (
              <>
                <div className="steam-price-line">
                  {original ? <span className="steam-price-was">{original}</span> : null}
                  <strong className="steam-price-value">{price.formatted}</strong>
                  {price.discountPercent > 0 ? <M3Chip>−{price.discountPercent}%</M3Chip> : null}
                </div>
                <span className="settings-copy">Stand: {formatDate(price.updatedAt)}</span>
              </>
            ) : (
              <p className="settings-copy">{error || "Noch kein Preis geladen."}</p>
            )}
            {price && error ? <p className="settings-copy">{error}</p> : null}
          </div>
          <div className="confirm-row">
            <m3-button variant="text" disabled={busy} onClick={() => void load(appId, true)}>
              Preis aktualisieren
            </m3-button>
            {busy && price ? <MorphLoader size={24} label="Steam-Preis wird aktualisiert" /> : null}
          </div>
          <span className="settings-copy">Steam-Storepreis für Deutschland. Snapshot, nicht live.</span>
        </>
      )}
    </div>
  );
}
