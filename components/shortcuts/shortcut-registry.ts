export type ShortcutEntry = {
  keys: string[];
  description: string;
  context: string;
};

export const LIBRARY_SHORTCUTS: ShortcutEntry[] = [
  { keys: ["/"], description: "Suche fokussieren", context: "Bibliothek" },
  { keys: ["N"], description: "Spiel hinzufügen", context: "Bibliothek" },
  { keys: ["J", "K"], description: "Auswahl abwärts oder aufwärts bewegen", context: "Bibliothek" },
  { keys: ["↓", "↑"], description: "Auswahl abwärts oder aufwärts bewegen", context: "Bibliothek" },
  { keys: ["Enter"], description: "Ausgewähltes Spiel öffnen", context: "Bibliothek" },
  { keys: ["Escape"], description: "Dialog, Auswahlmodus oder Auswahl schließen", context: "Überall" },
  { keys: ["F6"], description: "Auswahlmodus ein- oder ausschalten", context: "Bibliothek" },
  { keys: ["Q"], description: "Spielwarteschlange öffnen", context: "Bibliothek" },
  { keys: ["?"], description: "Diese Übersicht öffnen", context: "Überall" },
];

export function platformKeyLabel(platform: string): string {
  return /Mac|iPhone|iPad/i.test(platform) ? "⌘" : "Strg";
}
