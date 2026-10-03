"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { M3Dialog } from "@/components/m3/host";
import {
  detectInstallPlatform,
  finishOnboarding,
  getPwaInstallCopy,
  readOnboardingProgress,
  shouldOfferOnboarding,
  writeOnboardingProgress,
  type OnboardingActionId,
} from "@/lib/onboarding";
import styles from "./onboarding.module.css";

export type OnboardingDialogProps = {
  onImport: (file: File) => void;
  onAddGame: () => void;
  onConnectSteam: () => void;
};

export function OnboardingDialog({ onImport, onAddGame, onConnectSteam }: OnboardingDialogProps) {
  const [progress, setProgress] = useState(readOnboardingProgress);
  const clientReady = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const importRef = useRef<HTMLInputElement>(null);
  const platform = detectInstallPlatform({
    userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
    platform: typeof navigator === "undefined" ? "" : navigator.platform,
    maxTouchPoints: typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints,
  });
  const installCopy = getPwaInstallCopy(platform);

  const finish = (action: OnboardingActionId) => {
    const next = finishOnboarding(action);
    writeOnboardingProgress(next);
    setProgress(next);
  };

  return (
    <M3Dialog
      open={clientReady && shouldOfferOnboarding(progress)}
      onClose={() => finish("later")}
      headline="Willkommen bei gGrid"
      presentation="sheet"
      actions={
        <m3-button slot="actions" variant="text" onClick={() => finish("later")}>
          Später
        </m3-button>
      }
    >
      <input
        ref={importRef}
        type="file"
        hidden
        accept="application/json,.json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            finish("import");
            onImport(file);
          }
          event.target.value = "";
        }}
      />
      <p className={styles.lead}>
        Deine Bibliothek bleibt lokal auf diesem Gerät. Es gibt bewusst kein Konto und keinen Cloud-Sync.
      </p>
      <div className={styles.actions}>
        <button type="button" onClick={() => importRef.current?.click()}>
          <strong>Sicherung importieren</strong>
          <span>Eine vorhandene vollständige gGrid-Sicherung wiederherstellen.</span>
        </button>
        <button type="button" onClick={() => { finish("add-game"); onAddGame(); }}>
          <strong>Spiel hinzufügen</strong>
          <span>Mit einer leeren lokalen Bibliothek starten.</span>
        </button>
        <button type="button" onClick={() => { finish("connect-steam"); onConnectSteam(); }}>
          <strong>Steam verbinden</strong>
          <span>Zugangsdaten bleiben lokal und werden standardmäßig nicht exportiert.</span>
        </button>
      </div>
      <div className={styles.pwaNote}>
        <strong>{installCopy.title}</strong>
        <span>{installCopy.instruction}</span>
        <span>Installiert startet gGrid auch offline; externe Steam-/IGDB-Abfragen benötigen weiterhin Internet.</span>
      </div>
    </M3Dialog>
  );
}
