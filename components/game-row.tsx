"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil } from "lucide-react";
import type { GameRecord } from "@/lib/game-fields";
import { fieldsForRowSlot, formatPlaytime } from "@/lib/game-fields";
import { CoverImage } from "@/components/cover-image";
import { BooleanChip, NotesPreview, PriorityBadge, RatingStars } from "@/components/field-widgets";
import { Chip } from "@/components/ui";
import { cn } from "@/lib/cn";

export function GameRow({
  game,
  selected,
  draggingEnabled,
  onOpen,
  onSelect,
}: {
  game: GameRecord;
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusFields = fieldsForRowSlot("chips").filter((field) => field.type === "boolean");
  const chipEnums = fieldsForRowSlot("chips").filter((field) => field.type === "multiEnum");
  const metaParts = fieldsForRowSlot("meta").flatMap((field) => {
    const value = game[field.id];
    if (field.type === "number" && field.id === "playtimeMinutes") {
      const formatted = formatPlaytime(typeof value === "number" ? value : null);
      return formatted ? [formatted] : [];
    }
    if (Array.isArray(value)) return value.length ? [value.join(" · ")] : [];
    if (typeof value === "string" && value) return [value];
    return [];
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      className={cn("game-row", selected && "is-selected", isDragging && "is-dragging")}
      onClick={() => {
        if (isDragging) return;
        onOpen();
      }}
      onFocus={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <button
        type="button"
        className={cn("drag-handle", !canDrag && "is-disabled")}
        aria-label={canDrag ? "Priorität verschieben" : "Nur bei gesetzter Priorität verschiebbar"}
        title={canDrag ? "Ziehen, um die Reihenfolge zu ändern" : "Priorität setzen, um zu sortieren"}
        onClick={(event) => event.stopPropagation()}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>

      <div className="row-cover">
        <CoverImage
          name={game.name}
          franchise={game.franchise}
          coverUrl={game.coverUrl}
          steamAppId={game.steamAppId}
        />
      </div>

      <div className="row-main">
        <div className="row-title">{game.name}</div>
        <div className="row-meta">
          {metaParts.map((part) => (
            <span key={part}>{part}</span>
          ))}
        </div>
      </div>

      <div className="row-chips">
        {statusFields.map((field) => (
          <BooleanChip key={field.id} field={field} value={Boolean(game[field.id])} />
        ))}
        {chipEnums.flatMap((field) => {
          const value = game[field.id];
          return Array.isArray(value)
            ? value.map((item) => (
                <Chip key={`${field.id}-${item}`} tone="outline">
                  {item}
                </Chip>
              ))
            : [];
        })}
      </div>

      <div className="row-rating">
        <RatingStars value={game.rating} compact />
      </div>

      <div className="row-priority">
        <PriorityBadge value={game.priority} />
      </div>

      <div className="row-notes">
        <NotesPreview value={game.notes} />
      </div>

      <span className="row-edit" aria-hidden="true">
        <Pencil size={16} />
      </span>
    </div>
  );
}
