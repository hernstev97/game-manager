import type { GameRecord } from "@/lib/game-fields";
import type { ProvenanceSource } from "@/lib/model/shared";

const SOURCE_LABELS: Record<ProvenanceSource, string> = {
  manual: "Manuell gepflegt",
  steam: "Von Steam übernommen",
  igdb: "Von IGDB übernommen",
  import: "Aus Sicherung importiert",
  migration: "Bei Migration übernommen",
};

export function FieldProvenanceNote({ game, fieldId }: { game: GameRecord; fieldId: string }) {
  const provenance = game.provenance?.[fieldId];
  if (!provenance) return null;
  const date = new Date(provenance.updatedAt);
  const timestamp = Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(date)
    : null;
  return (
    <small className="editor-field-provenance">
      {SOURCE_LABELS[provenance.source]}{timestamp ? ` · ${timestamp}` : ""}
    </small>
  );
}
