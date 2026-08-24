"use client";

import type { GameRecord } from "@/lib/game-fields";
import { fieldsForRowSlot, formatPlaytime } from "@/lib/game-fields";
import { steamPriceLabel } from "@/lib/steam";

export function GameRowText({ game }: { game: GameRecord }) {
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
  const platforms = Array.isArray(game.platforms) ? game.platforms.slice(0, 2) : [];
  const mobileMetaParts = [game.franchise, platforms.join(", ")].filter(Boolean);
  const mobileTertiaryParts = [
    ...tertiaryParts.slice(0, 2),
    game.rating == null ? "" : `★ ${game.rating.toFixed(1)}`,
  ].filter(Boolean);

  return (
    <>
      <span className="game-row-name">{game.name || "Unbenanntes Spiel"}</span>
      <span slot="supporting-text">
        <span className="desktop-row-copy">{metaParts.join(" · ") || "Ohne Zusatzangaben"}</span>
        <span className="mobile-row-copy">{mobileMetaParts.join(" · ") || "Ohne Zusatzangaben"}</span>
      </span>
      <span slot="tertiary-text">
        <span className="desktop-row-copy">{tertiaryParts.join(" · ") || notes || " "}</span>
        <span className="mobile-row-copy">{mobileTertiaryParts.join(" · ") || notes || " "}</span>
      </span>
    </>
  );
}
