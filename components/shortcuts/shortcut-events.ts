export const SHORTCUT_HELP_EVENT = "ggrid:shortcut-help";

export function requestShortcutHelp(): void {
  window.dispatchEvent(new Event(SHORTCUT_HELP_EVENT));
}
