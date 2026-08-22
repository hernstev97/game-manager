"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useHostEvent } from "@/components/m3/events";
import { installShadowStyle, RESPONSIVE_TABS_STYLE } from "@/components/m3/shadow-styles";

export function M3Tabs({
  activeTab,
  onChange,
  children,
  scrollableOnMobile = false,
  className,
}: {
  activeTab: number;
  onChange: (index: number, value: string) => void;
  children: ReactNode;
  scrollableOnMobile?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useHostEvent(ref, "tab-change", (event) => {
    const detail = (event as CustomEvent<{ activeTab?: number; value?: string }>).detail;
    onChange(detail?.activeTab ?? 0, detail?.value ?? "");
  });

  useEffect(() => {
    if (!scrollableOnMobile) return;
    installShadowStyle(ref.current, "tabs", RESPONSIVE_TABS_STYLE);
  }, [scrollableOnMobile]);

  const classes = [className, scrollableOnMobile ? "mobile-scrollable" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <m3-tabs ref={ref} activeTab={activeTab} className={classes}>
      {children}
    </m3-tabs>
  );
}
