"use client";

import { useRef } from "react";
import { CoverImage } from "@/components/cover-image";
import { useHostEvent } from "@/components/m3/events";

export function ResultItem({
  id,
  name,
  supporting,
  coverUrl,
  steamAppId,
  disabled,
  onChoose,
}: {
  id: string;
  name: string;
  supporting: string;
  coverUrl: string;
  steamAppId: number | null;
  disabled?: boolean;
  onChoose: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useHostEvent(ref, "item-click", onChoose);
  return (
    <m3-list-item ref={ref} lines="2" clickable disabled={disabled} value={id} shape="rounded">
      <span slot="leading">
        <CoverImage name={name} coverUrl={coverUrl} steamAppId={steamAppId} />
      </span>
      {name}
      <span slot="supporting-text">{supporting}</span>
    </m3-list-item>
  );
}
