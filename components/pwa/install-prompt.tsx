"use client";

import { useEffect, useState } from "react";
import styles from "./pwa.module.css";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isIosDevice(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const detectIosInstall = window.setTimeout(
      () => setShowIosHint(isIosDevice() && !isStandalone()),
      0,
    );
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => setPromptEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.clearTimeout(detectIosInstall);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (dismissed || (!promptEvent && !showIosHint)) return null;

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  return (
    <aside className={styles.card} aria-label="gGrid installieren">
      <div>
        <strong>gGrid installieren</strong>
        <p>
          {promptEvent
            ? "Schneller starten und die Bibliothek auch bei Verbindungsproblemen öffnen."
            : "In Safari: Teilen und dann „Zum Home-Bildschirm“ wählen."}
        </p>
      </div>
      <div className={styles.actions}>
        {promptEvent ? (
          <button className={styles.primaryButton} type="button" onClick={() => void install()}>
            Installieren
          </button>
        ) : null}
        <button className={styles.textButton} type="button" onClick={() => setDismissed(true)}>
          Später
        </button>
      </div>
    </aside>
  );
}
