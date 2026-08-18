"use client";

let pending: Promise<void> | null = null;

export function registerM3Components(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (pending) return pending;
  pending = Promise.all([
    import("@banegasn/m3-button"),
    import("@banegasn/m3-card"),
    import("@banegasn/m3-chip"),
    import("@banegasn/m3-dialog"),
    import("@banegasn/m3-divider"),
    import("@banegasn/m3-icon-button"),
    import("@banegasn/m3-list"),
    import("@banegasn/m3-menu"),
    import("@banegasn/m3-radio-button"),
    import("@banegasn/m3-search-bar"),
    import("@banegasn/m3-slider"),
    import("@banegasn/m3-snackbar"),
    import("@banegasn/m3-split-button"),
    import("@banegasn/m3-switch"),
    import("@banegasn/m3-tabs"),
    import("@banegasn/m3-text-field"),
    import("@banegasn/m3-tooltip"),
    import("@banegasn/m3-top-app-bar"),
  ]).then(() => undefined);
  return pending;
}
