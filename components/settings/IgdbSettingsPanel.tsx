"use client";

import { M3TextField } from "@/components/m3/host";

export function IgdbSettingsPanel({
  hidden,
  idDraft,
  secretDraft,
  busy,
  onIdDraftChange,
  onSecretDraftChange,
  onSave,
  onRefresh,
}: {
  hidden: boolean;
  idDraft: string;
  secretDraft: string;
  busy: boolean;
  onIdDraftChange: (value: string) => void;
  onSecretDraftChange: (value: string) => void;
  onSave: () => void;
  onRefresh: () => Promise<void>;
}) {
  return (
    <section id="settings-igdb" className="settings settings-panel" hidden={hidden}>
      <p className="settings-copy">
        Allgemeiner Spielekatalog (Cover, Genre, Franchise, Plattformen) für Steam, Switch, Retro
        und den Rest. Kostenlos über eine Twitch-App:{" "}
        <a href="https://dev.twitch.tv/console/apps/create" target="_blank" rel="noreferrer">
          Developer Console
        </a>
        , Typ Confidential, OAuth-Redirect <code>localhost</code>. Nur lokal gespeichert, geht an
        Twitch/IGDB, nie in ein Log. Daten von{" "}
        <a href="https://www.igdb.com/" target="_blank" rel="noreferrer">
          IGDB.com
        </a>
        .
      </p>
      <M3TextField
        label="Twitch Client-ID"
        value={idDraft}
        onChange={onIdDraftChange}
        placeholder="Client-ID"
      />
      <M3TextField
        label="Twitch Client-Secret"
        value={secretDraft}
        onChange={onSecretDraftChange}
        type="password"
      />
      <div className="settings-actions">
        <m3-button onClick={onSave}>Speichern</m3-button>
        <m3-button variant="text" disabled={busy} onClick={() => void onRefresh()}>
          Metadaten aktualisieren
        </m3-button>
      </div>
    </section>
  );
}
