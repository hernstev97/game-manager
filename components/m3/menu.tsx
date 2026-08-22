"use client";

import { useEffect, useRef, type ReactNode, type Ref } from "react";
import { useHostEvent } from "@/components/m3/events";
import { installShadowStyle, MENU_MOTION_STYLE } from "@/components/m3/shadow-styles";

type MenuEl = HTMLElement & {
  open: boolean;
  show: (reason?: string, opener?: HTMLElement | null) => void;
  dismiss: (reason?: string) => void;
};

export function M3Menu({
  open,
  onOpenChange,
  onSelect,
  placement = "bottom-start",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (value: string) => void;
  placement?:
    | "bottom-start"
    | "bottom-center"
    | "bottom-end"
    | "top-start"
    | "top-center"
    | "top-end";
  children: ReactNode;
}) {
  const ref = useRef<MenuEl>(null);
  useHostEvent(ref, "menu-item-select", (event) => {
    const detail = (event as CustomEvent<{ value?: string }>).detail;
    if (detail?.value != null) onSelect?.(detail.value);
  });
  useHostEvent(ref, "menu-open-change", (event) => {
    const detail = (event as CustomEvent<{ open?: boolean }>).detail;
    onOpenChange(Boolean(detail?.open));
  });

  useEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    const apply = () => installShadowStyle(menu, "menu", MENU_MOTION_STYLE);
    apply();
    queueMicrotask(apply);
    menu.addEventListener("menu-open-change", apply);
    return () => menu.removeEventListener("menu-open-change", apply);
  }, []);

  useEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    if (open && !menu.open) menu.show("programmatic");
    if (!open && menu.open) menu.dismiss("programmatic");
  }, [open]);

  return (
    <m3-menu ref={ref as Ref<HTMLElement>} placement={placement}>
      {children}
    </m3-menu>
  );
}
