"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useHostEvent } from "@/components/m3/events";

export function M3ListItem({
  children,
  lines = "1",
  selected,
  clickable,
  shape = "rounded",
  value,
  onClick,
  style,
}: {
  children: ReactNode;
  lines?: "1" | "2" | "3";
  selected?: boolean;
  clickable?: boolean;
  shape?: "default" | "rounded" | "full";
  value?: string;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  useHostEvent(ref, "item-click", () => onClick?.());
  return (
    <m3-list-item
      ref={ref}
      lines={lines}
      selected={selected}
      clickable={clickable}
      shape={shape}
      value={value}
      style={style}
    >
      {children}
    </m3-list-item>
  );
}
