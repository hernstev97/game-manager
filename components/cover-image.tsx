"use client";

import { useMemo, useState } from "react";
import { steamCover } from "@/lib/steam";

const FRANCHISE_COLORS: Record<string, string> = {
  "Final Fantasy": "#1B4F9C",
  "Kingdom Come": "#8B5A2B",
  Nier: "#C9A227",
  "Fire Emblem": "#B42318",
  "Crimson Desert": "#8B1E1E",
  Enshrouded: "#2F6B4F",
  Pragmata: "#2A6F7A",
  Other: "#6750A4",
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
  const seed = FRANCHISE_COLORS[franchise] ?? FRANCHISE_COLORS.Other;
  return (
    <div
      className={className ? `cover-placeholder ${className}` : "cover-placeholder"}
      style={{
        background: `linear-gradient(135deg, ${seed} 0%, color-mix(in srgb, ${seed} 55%, #14080c) 100%)`,
      }}
      aria-hidden="true"
    >
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
