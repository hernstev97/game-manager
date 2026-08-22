export type PwaShortcutAction = "add-game" | "search" | "queue";

export type PwaShortcutHandler = (
  action: PwaShortcutAction,
) => boolean | void | Promise<boolean | void>;

export function parsePwaShortcut(params: URLSearchParams): PwaShortcutAction | null {
  const action = params.get("pwa-action");
  return action === "add-game" || action === "search" || action === "queue" ? action : null;
}

export function removeShortcutParam(url: URL): string {
  const next = new URL(url.href);
  next.searchParams.delete("pwa-action");
  return `${next.pathname}${next.search}${next.hash}`;
}
