"use client";

import { useMemo, useState } from "react";
import Image, { type ImageLoaderProps } from "next/image";
import { steamCover } from "@/lib/steam";
import { PlaceholderCover } from "@/components/media/CoverPlaceholder";

const failedUrls = new Set<string>();
const coverLoader = ({ src }: ImageLoaderProps) => src;

export function CoverImage({
  name,
  coverUrl,
  steamAppId,
  className,
  eager = false,
  sizes = "(max-width: 599px) 104px, (max-width: 839px) 144px, 175px",
}: {
  name: string;
  franchise?: string;
  coverUrl: string;
  steamAppId: number | null;
  className?: string;
  eager?: boolean;
  sizes?: string;
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
    return <PlaceholderCover name={name} className={className} />;
  }

  return (
    <Image
      key={src}
      loader={coverLoader}
      unoptimized
      src={src}
      alt=""
      width={350}
      height={164}
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={className ? `cover-img ${className}` : "cover-img"}
      draggable={false}
      onError={() => {
        failedUrls.add(src);
        setIndex((current) => current + 1);
      }}
    />
  );
}

export { PlaceholderCover };
