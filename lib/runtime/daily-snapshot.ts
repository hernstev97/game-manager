import type { LibraryDocumentV2 } from "@/lib/model";
import { getLibrarySnapshotRepository } from "@/lib/runtime/library-runtime";

const DAILY_SNAPSHOT_KEY = "ggrid:last-daily-snapshot";
let timer: ReturnType<typeof setTimeout> | undefined;

export function scheduleDailySnapshot(document: LibraryDocumentV2): void {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().slice(0, 10);
  const storedMarker = window.localStorage.getItem(DAILY_SNAPSHOT_KEY);
  if (storedMarker === today || storedMarker?.startsWith(`pending:${today}:`)) return;
  if (timer !== undefined) globalThis.clearTimeout(timer);
  const pendingMarker = `pending:${today}:${Date.now()}`;
  window.localStorage.setItem(DAILY_SNAPSHOT_KEY, pendingMarker);
  timer = globalThis.setTimeout(() => {
    timer = undefined;
    void getLibrarySnapshotRepository().create("daily", document).then(() => {
      window.localStorage.setItem(DAILY_SNAPSHOT_KEY, today);
    }).catch(() => {
      if (window.localStorage.getItem(DAILY_SNAPSHOT_KEY) === pendingMarker) {
        window.localStorage.removeItem(DAILY_SNAPSHOT_KEY);
      }
    });
  }, 1000);
}
