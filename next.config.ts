import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The collaborative preview may address the local dev server through
  // 127.0.0.1 while Next starts on localhost.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  transpilePackages: [
    "@banegasn/m3-button",
    "@banegasn/m3-card",
    "@banegasn/m3-chip",
    "@banegasn/m3-dialog",
    "@banegasn/m3-divider",
    "@banegasn/m3-form-associated",
    "@banegasn/m3-icon-button",
    "@banegasn/m3-list",
    "@banegasn/m3-menu",
    "@banegasn/m3-radio-button",
    "shape-morph",
    "@banegasn/m3-search-bar",
    "@banegasn/m3-slider",
    "@banegasn/m3-snackbar",
    "@banegasn/m3-split-button",
    "@banegasn/m3-switch",
    "@banegasn/m3-tabs",
    "@banegasn/m3-text-field",
    "@banegasn/m3-tooltip",
    "@banegasn/m3-top-app-bar",
    "lit",
    "@lit/reactive-element",
    "lit-html",
    "lit-element",
  ],
};

export default nextConfig;
