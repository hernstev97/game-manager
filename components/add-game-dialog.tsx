"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FilledButton, Modal, TextButton, TextField } from "@/components/ui";
import { CoverImage } from "@/components/cover-image";
import type { GameRecord } from "@/lib/game-fields";
import { fetchSteamAppDetails, parseSteamInput, searchSteamStore, steamCover } from "@/lib/steam";

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
      }
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [open, query, steamId]);

  const visibleHits = !steamId && query.trim().length >= 3 ? hits : [];

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

  return (
    <Modal open={open} onClose={onClose} title="Spiel hinzufügen" wide>
      <div className="add-dialog">
        <TextField
          label="Name, Steam-URL oder App-ID"
          value={query}
          onChange={setQuery}
          placeholder="Final Fantasy … oder 359870"
          autoFocus
        />

        {existing.length > 0 ? (
          <section>
            <h3>Bereits in der Bibliothek</h3>
            <ul className="add-results">
              {existing.map((game) => (
                <li key={game.id}>
                  <button type="button" className="add-result" onClick={() => onOpenExisting(game.id)}>
                    <CoverImage
                      name={game.name}
                      franchise={game.franchise}
                      coverUrl={game.coverUrl}
                      steamAppId={game.steamAppId}
                    />
                    <span>
                      <strong>{game.name}</strong>
                      <em>{game.franchise}</em>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {visibleHits.length > 0 ? (
          <section>
            <h3>Steam-Suche</h3>
            <ul className="add-results">
              {visibleHits.map((hit) => (
                <li key={hit.appId}>
                  <button
                    type="button"
                    className="add-result"
                    disabled={busy}
                    onClick={() => void createFromSteam(hit.appId)}
                  >
                    <CoverImage
                      name={hit.name}
                      franchise="Other"
                      coverUrl={hit.coverUrl}
                      steamAppId={hit.appId}
                    />
                    <span>
                      <strong>{hit.name}</strong>
                      <em>App {hit.appId}</em>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="modal-actions">
          <TextButton onClick={onClose}>Abbrechen</TextButton>
          <FilledButton onClick={createManual} disabled={busy}>
            {steamId ? "Von Steam anlegen" : "Manuell anlegen"}
          </FilledButton>
        </div>
      </div>
    </Modal>
  );
}
