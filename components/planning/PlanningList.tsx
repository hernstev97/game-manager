"use client";

import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties, ReactNode, Ref } from "react";
import { CoverImage } from "@/components/media/CoverImage";
import { IconGrip } from "@/components/m3/icons";
import { planningOrderAfterMove, planningStatusLabel } from "./planning-helpers";
import type { PlanningGame } from "./types";
import styles from "./planning.module.css";

type PlanningListProps = {
  games: readonly PlanningGame[];
  listLabel: string;
  positionLabel: "Spielreihenfolge" | "Persönlicher Rang";
  emptyMessage: string;
  reorderMode: boolean;
  disabled?: boolean;
  onReorder: (orderedIds: readonly string[]) => void;
  onOpenGame?: (gameId: string) => void;
  renderActions: (game: PlanningGame, visiblePosition: number) => ReactNode;
};

type RowProps = Pick<
  PlanningListProps,
  "positionLabel" | "disabled" | "onOpenGame" | "renderActions"
> & {
  game: PlanningGame;
  visiblePosition: number;
  itemRef?: Ref<HTMLLIElement>;
  itemStyle?: CSSProperties;
  dragging?: boolean;
  dragHandle?: ReactNode;
};

function PlanningRow({
  game,
  visiblePosition,
  positionLabel,
  disabled,
  onOpenGame,
  renderActions,
  itemRef,
  itemStyle,
  dragging,
  dragHandle,
}: RowProps) {
  const name = game.name || "Unbenanntes Spiel";

  return (
    <li
      ref={itemRef}
      className={styles.item}
      style={itemStyle}
      data-dragging={dragging || undefined}
    >
      <span
        className={styles.position}
        aria-label={`${positionLabel} ${visiblePosition}`}
      >
        <span aria-hidden="true">#</span>{visiblePosition}
      </span>
      <CoverImage
        name={name}
        coverUrl={game.coverUrl}
        steamAppId={game.steamAppId}
        className={styles.cover}
        sizes="(max-width: 520px) 64px, 88px"
      />
      <div className={styles.itemCopy}>
        {onOpenGame ? (
          <button
            type="button"
            className={styles.gameNameButton}
            disabled={disabled}
            onClick={() => onOpenGame(game.id)}
          >
            {name}
          </button>
        ) : (
          <span className={styles.gameName}>{name}</span>
        )}
        <span className={styles.status}>{planningStatusLabel(game)}</span>
      </div>
      <div className={styles.itemActions}>
        {dragHandle}
        {renderActions(game, visiblePosition)}
      </div>
    </li>
  );
}

function SortablePlanningRow(props: Omit<RowProps, "itemRef" | "itemStyle" | "dragging" | "dragHandle">) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.game.id });
  const itemStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.64 : undefined,
    zIndex: isDragging ? 1 : undefined,
  };
  const name = props.game.name || "Unbenanntes Spiel";
  const dragHandle = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      className={styles.dragHandle}
      aria-label={`${name}: ${props.positionLabel} verschieben`}
      disabled={props.disabled}
      {...attributes}
      {...listeners}
    >
      <IconGrip width={20} height={20} />
    </button>
  );

  return (
    <PlanningRow
      {...props}
      itemRef={setNodeRef}
      itemStyle={itemStyle}
      dragging={isDragging}
      dragHandle={dragHandle}
    />
  );
}

function ActivePlanningList(props: PlanningListProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (event: DragEndEvent) => {
    const next = planningOrderAfterMove(
      props.games,
      String(event.active.id),
      event.over ? String(event.over.id) : null,
    );
    if (next) props.onReorder(next);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "Leertaste zum Aufnehmen. Mit Pfeiltasten verschieben. Leertaste zum Ablegen, Escape zum Abbrechen.",
        },
      }}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={props.games.map((game) => game.id)}
        strategy={verticalListSortingStrategy}
      >
        <ol className={styles.list} aria-label={props.listLabel}>
          {props.games.map((game, index) => (
            <SortablePlanningRow
              key={game.id}
              game={game}
              visiblePosition={index + 1}
              positionLabel={props.positionLabel}
              disabled={props.disabled}
              onOpenGame={props.onOpenGame}
              renderActions={props.renderActions}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

export function PlanningList(props: PlanningListProps) {
  if (props.games.length === 0) {
    return <p className={styles.emptyState}>{props.emptyMessage}</p>;
  }
  if (props.reorderMode) return <ActivePlanningList {...props} />;

  return (
    <ol className={styles.list} aria-label={props.listLabel}>
      {props.games.map((game, index) => (
        <PlanningRow
          key={game.id}
          game={game}
          visiblePosition={index + 1}
          positionLabel={props.positionLabel}
          disabled={props.disabled}
          onOpenGame={props.onOpenGame}
          renderActions={props.renderActions}
        />
      ))}
    </ol>
  );
}
