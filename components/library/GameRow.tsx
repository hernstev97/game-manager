"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { GameRecord } from "@/lib/game-fields";
import { CoverImage } from "@/components/media/CoverImage";
import { PriorityBadge } from "@/components/editor/fields/PriorityField";
import { RatingStars } from "@/components/editor/fields/RatingField";
import { IconCheck, IconGrip } from "@/components/m3/icons";
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

function SelectionToggle({
  gameName,
  selected,
  onToggle,
}: {
  gameName: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useHostEvent(ref, "click", (event) => {
    event.stopPropagation();
    onToggle();
  });

  return (
    <button
      ref={ref}
      type="button"
      className="selection-toggle"
      aria-label={selected ? `${gameName} aus Auswahl entfernen` : `${gameName} auswählen`}
      aria-pressed={selected}
    >
      {selected ? <IconCheck width={18} height={18} /> : null}
    </button>
  );
}

export function GameRow({
  game,
  index,
  selected,
  compact,
  selectionMode,
  draggingEnabled,
  onOpen,
  onSelect,
  onToggleSelection,
}: {
  game: GameRecord;
  index: number;
  selected: boolean;
  compact: boolean;
  selectionMode: boolean;
  draggingEnabled: boolean;
  onOpen: () => void;
  onSelect: () => void;
  onToggleSelection: () => void;
}) {
  const canDrag = draggingEnabled && game.priority != null;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: game.id,
    disabled: !canDrag,
  });
  const itemRef = useRef<HTMLElement>(null);
  const interactiveClickRef = useRef(false);
  useEffect(() => {
    const node = itemRef.current;
    if (!node) return;
    const markInteractiveClick = (event: Event) => {
      interactiveClickRef.current = event.composedPath().some(
        (entry) => entry instanceof Element
          && entry.matches("button, input, select, textarea, a"),
      );
      queueMicrotask(() => {
        interactiveClickRef.current = false;
      });
    };
    node.addEventListener("click", markInteractiveClick, { capture: true });
    return () => node.removeEventListener("click", markInteractiveClick, { capture: true });
  }, []);
  useHostEvent(itemRef, "item-click", () => {
    if (interactiveClickRef.current) return;
    if (isDragging) return;
    if (selectionMode) onToggleSelection();
    else onOpen();
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
      className={`game-row${compact ? " is-compact" : ""}`}
      style={style}
      lines={compact ? "2" : "3"}
      selected={selected}
      aria-selected={selectionMode ? selected : undefined}
      clickable
      shape="rounded"
      value={game.id}
      onFocus={onSelect}
    >
      <div slot="leading" className="row-leading">
        {selectionMode ? (
          <SelectionToggle
            gameName={game.name}
            selected={selected}
            onToggle={onToggleSelection}
          />
        ) : null}
        {draggingEnabled ? (
          <button
            type="button"
            className="drag-handle"
            aria-label={canDrag ? `${game.name}: Position in der Warteschlange verschieben` : "Nicht eingereiht – nicht verschiebbar"}
            disabled={!canDrag}
            onClick={(event) => event.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <IconGrip width={18} height={18} />
          </button>
        ) : null}
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
