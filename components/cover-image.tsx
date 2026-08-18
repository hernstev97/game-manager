"use client";

import { useMemo, useState } from "react";
import { steamCover } from "@/lib/steam";

const FRANCHISE_TONES: Record<string, "primary" | "secondary" | "tertiary" | "hero"> = {
  "Final Fantasy": "primary",
  "Kingdom Come": "secondary",
  Nier: "tertiary",
  "Fire Emblem": "hero",
  "Crimson Desert": "hero",
  Enshrouded: "secondary",
  Pragmata: "primary",
  Other: "tertiary",
};

const failedUrls = new Set<string>();

function initialsFromName(name: string): string {
  const parts = name
    .replace(/[:]/g, " ")
    .split(/\s+/)
    .filter((part) => part && !/^(the|a|of|and|und|der|die|das)$/i.test(part));
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function PlaceholderCover({
  name,
  franchise,
  className,
}: {
  name: string;
  franchise: string;
  className?: string;
}) {
  const tone = FRANCHISE_TONES[franchise] ?? FRANCHISE_TONES.Other;
  const colorToken = tone === "hero" ? "var(--color-hero-accent)" : `var(--color-${tone})`;
  return (
    <div
      className={className ? `cover-placeholder ${className}` : "cover-placeholder"}
      style={{
        background: `linear-gradient(135deg, ${colorToken} 0%, color-mix(in srgb, ${colorToken} 45%, var(--color-page)) 100%)`,
      }}
      aria-hidden="true"
    >
      <svg
        style={{
          position: "absolute",
          top: "6px",
          right: "8px",
          width: "48px",
          height: "48px",
          opacity: 0.16,
          pointerEvents: "none",
        }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L14.4 6.8L19.6 4.4L18.4 9.8L23.4 12L18.4 14.2L19.6 19.6L14.4 17.2L12 22L9.6 17.2L4.4 19.6L5.6 14.2L0.6 12L5.6 9.8L4.4 4.4L9.6 6.8L12 2Z" />
      </svg>
      <span className="cover-kicker">{franchise}</span>
      <span className="cover-initials">{initialsFromName(name)}</span>
    </div>
  );
}

export function CoverImage({
  name,
  franchise,
  coverUrl,
  steamAppId,
  className,
}: {
  name: string;
  franchise: string;
  coverUrl: string;
  steamAppId: number | null;
  className?: string;
}) {
  const sources = useMemo(() => {
    const list: string[] = [];
    if (coverUrl) list.push(coverUrl);
    if (steamAppId != null) {
      const header = steamCover(steamAppId, "header");
      const capsule = steamCover(steamAppId, "capsule");
      if (!list.includes(header)) list.push(header);
      if (!list.includes(capsule)) list.push(capsule);
    }
    return list.filter((url) => !failedUrls.has(url));
  }, [coverUrl, steamAppId]);

  const [index, setIndex] = useState(0);
  const src = sources[index];

  if (!src) {
    return <PlaceholderCover name={name} franchise={franchise} className={className} />;
  }

  return (
    // Steam CDN covers; next/image is unnecessary and would 404-spam on missing art.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={className ? `cover-img ${className}` : "cover-img"}
      draggable={false}
      onError={() => {
        failedUrls.add(src);
        setIndex((current) => current + 1);
      }}
    />
  );
}
