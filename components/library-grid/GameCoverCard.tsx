"use client";

import Image, { type ImageLoaderProps } from "next/image";
import { useMemo, useState, type KeyboardEvent } from "react";
import type { GameRecord } from "@/lib/game-fields";
import { buildPortraitCandidates } from "@/lib/media/candidates";
import { artworkTransformStyle } from "@/lib/media/focal-style";
import styles from "./library-grid.module.css";

const passthroughLoader = ({ src }: ImageLoaderProps) => src;

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return `${words[0][0] ?? ""}${words[1]?.[0] ?? words[0][1] ?? ""}`.toUpperCase();
}

function statusLabel(game: GameRecord): string {
  if (game.finished) return "Durchgespielt";
  if (game.played) return "Gespielt";
  if (game.wishlisted) return "Wunschliste";
  if (game.owned) return "Im Besitz";
  return "Nicht gespielt";
}

export function GameCoverCard({
  game,
  selected = false,
  selectionMode = false,
  onOpen,
  onSelect,
  onToggleSelection,
}: {
  game: GameRecord;
  selected?: boolean;
  selectionMode?: boolean;
  onOpen: (id: string) => void;
  onSelect?: (id: string) => void;
  onToggleSelection?: (id: string) => void;
}) {
  const candidates = useMemo(
    () => buildPortraitCandidates(game).filter((candidate) => candidate.url),
    [game],
  );
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const candidate = candidates.find((item) => item.url && !failed.has(item.url));
  const activate = () => {
    onSelect?.(game.id);
    if (selectionMode) onToggleSelection?.(game.id);
    else onOpen(game.id);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!selectionMode) return;
    if (event.key === "Enter") {
      event.preventDefault();
      onOpen(game.id);
    } else if (event.key === " ") {
      event.preventDefault();
      onSelect?.(game.id);
      onToggleSelection?.(game.id);
    }
  };
  const queue = game.queuePosition;

  return (
    <article className={styles.card} data-selected={selected || undefined}>
      <button
        type="button"
        className={styles.cardButton}
        data-grid-card
        data-game-id={game.id}
        aria-label={selectionMode
          ? `${game.name || "Unbenanntes Spiel"} ${selected ? "aus Auswahl entfernen" : "auswählen"}; Eingabetaste öffnet`
          : `${game.name || "Unbenanntes Spiel"} öffnen`}
        aria-pressed={selectionMode ? selected : undefined}
        onClick={activate}
        onDoubleClick={() => onOpen(game.id)}
        onFocus={() => onSelect?.(game.id)}
        onKeyDown={onKeyDown}
      >
        <span className={styles.coverFrame}>
          {candidate?.url ? (
            <Image
              key={candidate.url}
              loader={passthroughLoader}
              unoptimized
              fill
              src={candidate.url}
              alt=""
              sizes="(max-width: 520px) 44vw, (max-width: 900px) 28vw, 190px"
              loading="lazy"
              decoding="async"
              draggable={false}
              className={styles.coverImage}
              style={artworkTransformStyle(candidate.asset)}
              onError={() => setFailed((current) => new Set(current).add(candidate.url!))}
            />
          ) : (
            <span className={styles.placeholder} aria-hidden="true">{initials(game.name)}</span>
          )}
          {selectionMode ? (
            <span className={styles.selectionMark} aria-hidden="true">{selected ? "✓" : ""}</span>
          ) : null}
        </span>
        <span className={styles.cardCopy}>
          <span className={styles.gameName}>{game.name || "Unbenanntes Spiel"}</span>
          <span className={styles.metadata}>
            <span>{statusLabel(game)}</span>
            <span>{game.rating == null ? "Unbewertet" : `★ ${game.rating.toFixed(1)}`}</span>
            {queue != null ? <span>Queue #{queue}</span> : null}
          </span>
        </span>
      </button>
    </article>
  );
}
