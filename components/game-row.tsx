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
    <article
      ref={setNodeRef}
      style={style}
      role="listitem"
      aria-current={selected ? "true" : undefined}
      aria-label={`${game.name || "Unbenanntes Spiel"} bearbeiten`}
      tabIndex={0}
      className={cn(
        "game-row",
        `row-shape-${index % 4}`,
        game.priority === 1 && "is-priority-hero",
        selected && "is-selected",
        isDragging && "is-dragging",
      )}
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
      <div className="row-rail">
        <span className="row-index" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <button
          type="button"
          className={cn("drag-handle", !canDrag && "is-disabled")}
          aria-label={canDrag ? "Priorität verschieben" : "Nur bei gesetzter Priorität verschiebbar"}
          title={canDrag ? "Ziehen, um die Reihenfolge zu ändern" : "Priorität setzen, um zu sortieren"}
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
          disabled={!canDrag}
        >
          <GripVertical size={16} />
        </button>
      </div>

      <div className="row-cover">
        <span className="cover-shape-accent" aria-hidden="true" />
        <CoverImage
          name={game.name}
          franchise={game.franchise}
          coverUrl={game.coverUrl}
          steamAppId={game.steamAppId}
        />
      </div>

      <div className="row-main">
        <div className="row-title-line">
          <div className="row-title">{game.name || "Unbenanntes Spiel"}</div>
          {game.priority === 1 ? <span className="row-hero-label">Als Nächstes</span> : null}
        </div>
        <div className="row-meta">
          {metaParts.map((part) => (
            <span key={part}>{part}</span>
          ))}
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
      </div>

      <div className="row-metrics" aria-label="Spielstatus">
        <div className="row-metric row-rating">
          <span className="metric-label">Score</span>
          <RatingStars value={game.rating} compact />
        </div>
        <div className="row-metric row-priority">
          <span className="metric-label">Rang</span>
          <PriorityBadge value={game.priority} />
        </div>
        <div className="row-metric row-notes">
          <span className="metric-label">Notiz</span>
          <NotesPreview value={game.notes} />
        </div>
      </div>

      <button
        type="button"
        className="row-edit"
        aria-label={`${game.name || "Spiel"} bearbeiten`}
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
      >
        <Pencil size={16} />
      </button>
    </article>
  );
}
