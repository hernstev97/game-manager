export type InstallPlatform = "ios" | "android" | "desktop";

export type NavigatorPlatformInfo = {
  userAgent?: string;
  platform?: string;
  maxTouchPoints?: number;
};

export type PwaInstallCopy = {
  platform: InstallPlatform;
  title: string;
  instruction: string;
};

export function detectInstallPlatform(info: NavigatorPlatformInfo): InstallPlatform {
  const agent = info.userAgent ?? "";
  const ios =
    /iPad|iPhone|iPod/i.test(agent) ||
    (info.platform === "MacIntel" && (info.maxTouchPoints ?? 0) > 1);
  if (ios) return "ios";
  if (/Android/i.test(agent)) return "android";
  return "desktop";
}

export function getPwaInstallCopy(platform: InstallPlatform): PwaInstallCopy {
  if (platform === "ios") {
    return {
      platform,
      title: "Auf iPhone oder iPad installieren",
      instruction: "In Safari Teilen öffnen und „Zum Home-Bildschirm“ wählen.",
    };
  }
  if (platform === "android") {
    return {
      platform,
      title: "Auf Android installieren",
      instruction: "Im Browsermenü „App installieren“ oder „Zum Startbildschirm“ wählen.",
    };
  }
  return {
    platform,
    title: "Als App installieren",
    instruction: "Im Browsermenü „App installieren“ wählen, falls die Option angeboten wird.",
  };
}
