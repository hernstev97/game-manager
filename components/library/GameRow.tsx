"use client";

import { useRef, type CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { GameRecord } from "@/lib/game-fields";
import { CoverImage } from "@/components/cover-image";
import { PriorityBadge, RatingStars } from "@/components/field-widgets";
import { IconGrip } from "@/components/m3/icons";
import { useHostEvent } from "@/components/m3/events";
import { GameRowText } from "@/components/library/GameRowText";

function transitionNameForGame(id: string): string {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index++) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `game-row-${(hash >>> 0).toString(36)}`;
}

export function GameRow({
  game,
  index,
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

  const style: CSSProperties & { "--row-index": number } = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : undefined,
    "--row-index": Math.min(index, 10),
    viewTransitionName: index < 14 ? transitionNameForGame(game.id) : "none",
  };

  return (
    <m3-list-item
      ref={setRefs}
      className="game-row"
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
          eager={index < 3}
        />
      </div>
      <GameRowText game={game} />
      <div slot="trailing" className="row-trailing">
        <span className="row-rating">
          <RatingStars value={game.rating} compact />
        </span>
        <PriorityBadge value={game.priority} />
      </div>
    </m3-list-item>
  );
}
