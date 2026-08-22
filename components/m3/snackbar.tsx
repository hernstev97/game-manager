"use client";

import { useEffect, useRef, useState } from "react";
import { useHostEvent } from "@/components/m3/events";

type Toast = {
  id: number;
  message: string;
  lines: "1" | "2";
  live: "polite" | "assertive";
  actionLabel?: string;
  onAction?: () => void;
};

type ToastOptions = {
  actionLabel?: string;
  onAction?: () => void;
};

type Listener = (toast: Toast) => void;

let nextId = 1;
const listeners = new Set<Listener>();

function publish(
  message: string,
  live: "polite" | "assertive",
  options: ToastOptions = {},
) {
  const toast: Toast = {
    id: nextId++,
    message,
    lines: message.length > 72 ? "2" : "1",
    live,
    ...options,
  };
  listeners.forEach((listener) => listener(toast));
}

export const toast = {
  success(message: string, options?: ToastOptions) {
    publish(message, "polite", options);
  },
  error(message: string, options?: ToastOptions) {
    publish(message, "assertive", options);
  },
};

export function SnackbarHost() {
  const [current, setCurrent] = useState<Toast | null>(null);
  const ref = useRef<HTMLElement & { show?: () => void }>(null);
  useHostEvent(ref, "snackbar-dismiss", () => setCurrent(null));
  useHostEvent(ref, "snackbar-action", () => {
    current?.onAction?.();
    setCurrent(null);
  });

  useEffect(() => {
    const listener: Listener = (toastItem) => setCurrent(toastItem);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (current) ref.current?.show?.();
  }, [current]);

  if (!current) return null;
  return (
    <m3-snackbar
      key={current.id}
      ref={ref}
      open
      message={current.message}
      lines={current.lines}
      live={current.live}
      duration={5000}
    >
      {current.actionLabel ? (
        <button type="button" slot="action">
          {current.actionLabel}
        </button>
      ) : null}
    </m3-snackbar>
  );
}
