"use client";

import { useEffect, useRef, useState } from "react";
import { useHostEvent } from "@/components/m3/events";

type Toast = {
  id: number;
  message: string;
  lines: "1" | "2";
  live: "polite" | "assertive";
};

type Listener = (toast: Toast) => void;

let nextId = 1;
const listeners = new Set<Listener>();

function publish(message: string, live: "polite" | "assertive") {
  const toast: Toast = {
    id: nextId++,
    message,
    lines: message.length > 72 ? "2" : "1",
    live,
  };
  listeners.forEach((listener) => listener(toast));
}

export const toast = {
  success(message: string) {
    publish(message, "polite");
  },
  error(message: string) {
    publish(message, "assertive");
  },
};

export function SnackbarHost() {
  const [current, setCurrent] = useState<Toast | null>(null);
  const ref = useRef<HTMLElement & { show?: () => void }>(null);
  useHostEvent(ref, "snackbar-dismiss", () => setCurrent(null));

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
    />
  );
}
