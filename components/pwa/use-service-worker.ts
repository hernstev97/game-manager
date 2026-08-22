"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ServiceWorkerState = {
  supported: boolean;
  ready: boolean;
  updateAvailable: boolean;
  error: string | null;
  applyUpdate: () => void;
};

export function useServiceWorker(): ServiceWorkerState {
  const [supported, setSupported] = useState(true);
  const [ready, setReady] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const applying = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      const unsupported = window.setTimeout(() => setSupported(false), 0);
      return () => window.clearTimeout(unsupported);
    }

    const findWaitingWorker = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting && navigator.serviceWorker.controller) {
        setWaiting(registration.waiting);
      }
      const installing = registration.installing;
      if (!installing) return;
      const onStateChange = () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          setWaiting(registration.waiting ?? installing);
        }
      };
      installing.addEventListener("statechange", onStateChange);
    };

    const onControllerChange = () => {
      if (applying.current) window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((nextRegistration) => {
        setReady(true);
        findWaitingWorker(nextRegistration);
        nextRegistration.addEventListener("updatefound", () => findWaitingWorker(nextRegistration));
        void nextRegistration.update().catch(() => undefined);
      })
      .catch(() => setError("Offline-Unterstützung konnte nicht aktiviert werden."));

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waiting) return;
    applying.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });
  }, [waiting]);

  return {
    supported,
    ready,
    updateAvailable: waiting !== null,
    error,
    applyUpdate,
  };
}
