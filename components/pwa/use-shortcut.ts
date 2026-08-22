"use client";

import { useEffect } from "react";
import {
  parsePwaShortcut,
  removeShortcutParam,
  type PwaShortcutHandler,
} from "./shortcut";

let activeShortcut: string | null = null;

export function usePwaShortcut(handler?: PwaShortcutHandler): void {
  useEffect(() => {
    if (!handler) return;
    const url = new URL(window.location.href);
    const action = parsePwaShortcut(url.searchParams);
    if (!action) return;
    const fingerprint = `${url.pathname}:${action}`;
    if (activeShortcut === fingerprint) return;
    activeShortcut = fingerprint;

    void Promise.resolve(handler(action))
      .then((accepted) => {
        if (accepted === false) {
          activeShortcut = null;
          return;
        }
        window.history.replaceState(
          window.history.state,
          "",
          removeShortcutParam(new URL(window.location.href)),
        );
      })
      .catch(() => {
        activeShortcut = null;
      });
  }, [handler]);
}
