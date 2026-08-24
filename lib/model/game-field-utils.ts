import type { GameFieldDef, GameRecord } from "../game-fields";

function tokensFromValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    const seen = new Set<string>();
    const tokens: string[] = [];
    for (const item of value) {
      if (typeof item !== "string") continue;
      const token = item.trim();
      if (!token || seen.has(token)) continue;
      seen.add(token);
      tokens.push(token);
    }
    return tokens;
  }
  if (typeof value === "string") {
    const token = value.trim();
    return token ? [token] : [];
  }
  return [];
}

export function collectFieldOptions(
  field: GameFieldDef,
  games: readonly GameRecord[],
  opts: { minCount?: number; extra?: readonly string[] } = {},
): string[] {
  const counts = new Map<string, number>();
  for (const option of field.options ?? []) counts.set(option, 0);
  for (const extra of opts.extra ?? []) {
    const token = extra.trim();
    if (token && !counts.has(token)) counts.set(token, 0);
  }
  for (const game of games) {
    for (const token of tokensFromValue(game[field.id])) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }

  const minCount = opts.minCount ?? 0;
  const staticOptions = [...(field.options ?? [])];
  const staticSet = new Set(staticOptions);
  const dynamic = [...counts.keys()]
    .filter(
      (token) =>
        !staticSet.has(token) && (counts.get(token) ?? 0) >= minCount,
    )
    .sort((a, b) => a.localeCompare(b, "de", { sensitivity: "base" }));
  return [...staticOptions, ...dynamic];
}

export function collectFilterOptions(
  field: GameFieldDef,
  games: readonly GameRecord[],
): string[] {
  return collectFieldOptions(field, games, {
    minCount: field.filterMinCount ?? 0,
  });
}

export function collectEditorOptions(
  field: GameFieldDef,
  games: readonly GameRecord[],
  current?: string | readonly string[] | null,
): string[] {
  const extra = Array.isArray(current)
    ? current
    : typeof current === "string" && current.trim()
      ? [current]
      : [];
  return collectFieldOptions(field, games, { extra });
}

export function matchExistingOption(
  options: readonly string[],
  raw: string,
): string {
  const token = raw.trim();
  if (!token) return "";
  const needle = token.toLocaleLowerCase("de-DE");
  return (
    options.find(
      (option) => option.toLocaleLowerCase("de-DE") === needle,
    ) ?? token
  );
}

export function firstLine(text: string): string {
  return text.split(/\r?\n/, 1)[0]?.trim() ?? "";
}

export function formatPlaytime(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes)) return "";
  const safe = Math.max(0, Math.round(minutes));
  if (safe < 60) return `${safe} Min.`;
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  return rest ? `${hours} Std. ${rest} Min.` : `${hours} Std.`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
