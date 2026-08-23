"use client";

import { M3TextField } from "@/components/m3/host";
import { OfflineActionNotice, useOnlineStatus } from "@/components/pwa";

export function SteamSettingsPanel({
  hidden,
  idDraft,
  keyDraft,
  busy,
  onIdDraftChange,
  onKeyDraftChange,
  onSave,
  onRefreshCovers,
  onOpenImport,
}: {
  hidden: boolean;
  idDraft: string;
  keyDraft: string;
  busy: boolean;
  onIdDraftChange: (value: string) => void;
  onKeyDraftChange: (value: string) => void;
  onSave: () => void;
  onRefreshCovers: () => Promise<void>;
  onOpenImport: () => void;
}) {
  const online = useOnlineStatus();
  return (
    <section id="settings-steam" className="settings settings-panel" hidden={hidden}>
      <p className="settings-copy">
        Nur lokal gespeichert. Wird ausschließlich an Steam geschickt, nie geloggt.
        Custom-URL und Profil-Link werden automatisch in eine 64-bit-ID aufgelöst.
      </p>
      <M3TextField
        label="Steam-ID, Custom-URL oder Profil-Link"
        value={idDraft}
        onChange={onIdDraftChange}
        placeholder="7656119… oder steamcommunity.com/id/…"
      />
      <M3TextField
        label="Web-API-Schlüssel"
        value={keyDraft}
        onChange={onKeyDraftChange}
        type="password"
      />
      <div className="settings-actions">
        <m3-button onClick={onSave}>Speichern</m3-button>
        <m3-button variant="text" disabled={busy || !online} onClick={() => void onRefreshCovers()}>
          Cover, Namen &amp; Preise aktualisieren
        </m3-button>
        <m3-button variant="text" disabled={busy || !online} onClick={onOpenImport}>
          Steam-Bibliothek importieren
        </m3-button>
      </div>
      <OfflineActionNotice>Steam-Aktualisierungen warten auf eine Internetverbindung.</OfflineActionNotice>
    </section>
  );
}
