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
    import("@banegasn/m3-switch"),
    import("@banegasn/m3-tabs"),
    import("@banegasn/m3-text-field"),
  ]).then(() => adoptAppTypography());
  return pending;
}

/**
 * m3-button hardcodes Inter, which the app does not load. Append a sheet to
 * the Lit element styles before any button upgrades so labels use the app's
 * Google Sans Flex like every other component.
 */
function adoptAppTypography(): void {
  const ButtonClass = customElements.get("m3-button") as
    | (CustomElementConstructor & { elementStyles?: unknown[] })
    | undefined;
  if (!ButtonClass?.elementStyles || typeof CSSStyleSheet === "undefined") return;
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync("button { font-family: inherit; }");
    ButtonClass.elementStyles.push(sheet);
  } catch {
    // Constructable stylesheets unavailable: keep the component default.
  }
}
