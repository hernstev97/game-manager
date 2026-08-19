"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { GameRecord } from "@/lib/game-fields";
import { fieldsForRowSlot, formatPlaytime } from "@/lib/game-fields";
import { steamPriceLabel } from "@/lib/steam";
import { CoverImage } from "@/components/cover-image";
import { PriorityBadge, RatingStars } from "@/components/field-widgets";
import { IconGrip } from "@/components/m3/icons";
import { useHostEvent } from "@/components/m3/events";
import { useRef } from "react";

export function GameRow({
  game,
  selected,
  draggingEnabled,
  onOpen,
  onSelect,
}: {
  game: GameRecord;
  index: number;
  selected: boolean;
  draggingEnabled: boolean;
  onOpen: () => void;
  onSelect: () => void;
}) {
  const canDrag = draggingEnabled && game.priority != null;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: game.id,
    disabled: !canDrag,
  });
  const itemRef = useRef<HTMLElement>(null);
  useHostEvent(itemRef, "item-click", () => {
    if (!isDragging) onOpen();
  });

  const setRefs = (node: HTMLElement | null) => {
    itemRef.current = node;
    setNodeRef(node);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : undefined,
  };

  const statusFields = fieldsForRowSlot("chips").filter((field) => field.type === "boolean");
  const chipEnums = fieldsForRowSlot("chips").filter((field) => field.type === "multiEnum");
  const metaParts = fieldsForRowSlot("meta").flatMap((field) => {
    const value = game[field.id];
    if (field.type === "number" && field.id === "playtimeMinutes") {
      const formatted = formatPlaytime(typeof value === "number" ? value : null);
      return formatted ? [formatted] : [];
    }
    if (field.type === "steamPrice") {
      const formatted = steamPriceLabel(game.steamPrice);
      return formatted ? [formatted] : [];
    }
    if (Array.isArray(value)) return value.length ? [value.join(", ")] : [];
    if (typeof value === "string" && value) return [value];
    return [];
  });
  const tertiaryParts = [
    ...statusFields.filter((field) => Boolean(game[field.id])).map((field) => field.label),
    ...chipEnums.flatMap((field) => (Array.isArray(game[field.id]) ? (game[field.id] as string[]) : [])),
  ];
  const notes = game.notes.split(/\r?\n/, 1)[0]?.trim() ?? "";

  return (
    <m3-list-item
      ref={setRefs}
      style={style}
      lines="3"
      selected={selected}
      clickable
      shape="rounded"
      value={game.id}
      onFocus={onSelect}
    >
      <div slot="leading" className="row-leading">
        <button
          type="button"
          className="drag-handle"
          aria-label={canDrag ? "Priorität verschieben" : "Nur bei gesetzter Priorität verschiebbar"}
          disabled={!canDrag}
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <IconGrip width={18} height={18} />
        </button>
        <CoverImage
          name={game.name}
          franchise={game.franchise}
          coverUrl={game.coverUrl}
          steamAppId={game.steamAppId}
        />
      </div>
      {game.name || "Unbenanntes Spiel"}
      <span slot="supporting-text">{metaParts.join(" · ") || "Ohne Zusatzangaben"}</span>
      <span slot="tertiary-text">{tertiaryParts.join(" · ") || notes || " "}</span>
      <div slot="trailing" className="row-trailing">
        <RatingStars value={game.rating} compact />
        <PriorityBadge value={game.priority} />
      </div>
    </m3-list-item>
  );
}
