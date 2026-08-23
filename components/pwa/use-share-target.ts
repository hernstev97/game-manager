"use client";

import { useEffect } from "react";
import {
  dispatchPwaShareTarget,
  parseShareTarget,
  PWA_SHARE_EVENT,
  removeShareTargetParams,
  shareFingerprint,
  type PwaShareEventDetail,
  type PwaShareHandler,
} from "./share-target";

const processing = new Set<string>();

export function useShareTarget(handler?: PwaShareHandler): void {
  useEffect(() => {
    const url = new URL(window.location.href);
    const payload = parseShareTarget(url.searchParams);
    if (!payload) return;

    const fingerprint = shareFingerprint(payload);
    if (processing.has(fingerprint)) return;
    if (processing.size > 50) processing.clear();
    processing.add(fingerprint);

    const process = async () => {
      try {
        let result = handler ? await handler(payload) : await dispatchPwaShareTarget(payload);
        if (!handler && result === null) {
          await new Promise((resolve) => window.setTimeout(resolve, 0));
          result = await dispatchPwaShareTarget(payload);
        }
        if (result === false || result === null) {
          processing.delete(fingerprint);
          return;
        }
        window.history.replaceState(
          window.history.state,
          "",
          removeShareTargetParams(new URL(window.location.href)),
        );
      } catch {
        processing.delete(fingerprint);
      }
    };

    void process();
  }, [handler]);
}

export function usePwaShareTargetListener(handler: PwaShareHandler): void {
  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<PwaShareEventDetail>).detail;
      if (!detail?.payload || typeof detail.accept !== "function") return;
      detail.accept(handler(detail.payload));
    };
    window.addEventListener(PWA_SHARE_EVENT, listener);
    return () => window.removeEventListener(PWA_SHARE_EVENT, listener);
  }, [handler]);
}
