export type SaveStatusKind = "idle" | "saving" | "saved" | "error" | "quota";

export type SaveStatusState = {
  kind: SaveStatusKind;
  lastSavedAt: string | null;
  message: string | null;
};

type Listener = () => void;

let state: SaveStatusState = {
  kind: "idle",
  lastSavedAt: null,
  message: null,
};
let transition = 0;
const listeners = new Set<Listener>();

function publish(next: SaveStatusState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function isQuotaError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED"
    : Boolean(error && typeof error === "object" && "name" in error
      && String(error.name).toLowerCase().includes("quota"));
}

export const librarySaveStatus = {
  getSnapshot(): SaveStatusState {
    return state;
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  begin(): number {
    const id = ++transition;
    publish({ ...state, kind: "saving", message: null });
    return id;
  },
  succeed(id: number, savedAt = new Date().toISOString()): void {
    if (id !== transition) return;
    globalThis.setTimeout(() => {
      if (id === transition) publish({ kind: "saved", lastSavedAt: savedAt, message: null });
    }, 220);
  },
  fail(id: number, error: unknown): void {
    if (id !== transition) return;
    publish({
      kind: isQuotaError(error) ? "quota" : "error",
      lastSavedAt: state.lastSavedAt,
      message: isQuotaError(error)
        ? "Lokaler Speicherplatz reicht nicht aus."
        : "Die Änderung konnte nicht lokal gespeichert werden.",
    });
  },
};
