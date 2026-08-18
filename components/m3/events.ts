"use client";

import { useEffect, useRef, type RefObject } from "react";

export function useHostEvent(
  ref: RefObject<EventTarget | null>,
  type: string,
  handler?: ((event: Event) => void) | undefined,
) {
  const saved = useRef(handler);

  useEffect(() => {
    saved.current = handler;
  }, [handler]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const listener = (event: Event) => saved.current?.(event);
    node.addEventListener(type, listener);
    return () => node.removeEventListener(type, listener);
  }, [ref, type]);
}

export function hostValue(event: Event): string {
  const target = event.currentTarget as HTMLElement & { value?: string };
  const detail = (event as CustomEvent<{ value?: string }>).detail;
  return String(detail?.value ?? target.value ?? "");
}

export function hostChecked(event: Event): boolean {
  const target = event.currentTarget as HTMLElement & { checked?: boolean };
  const detail = (event as CustomEvent<{ checked?: boolean }>).detail;
  return Boolean(detail?.checked ?? target.checked);
}

export function hostNumber(event: Event): number {
  const target = event.currentTarget as HTMLElement & { value?: number | string };
  const detail = (event as CustomEvent<{ value?: number }>).detail;
  const raw = detail?.value ?? target.value;
  return typeof raw === "number" ? raw : Number(raw);
}
