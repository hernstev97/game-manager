import type { SnapshotErrorPresentation } from "./presenter";

export type SnapshotDialogState = {
  kind: "preview" | "restore" | "delete";
  snapshotId: string;
};

export type SnapshotPendingAction = {
  kind: "create" | "restore" | "delete" | "protect";
  snapshotId?: string;
};

export type SnapshotUiState = {
  dialog: SnapshotDialogState | null;
  pending: SnapshotPendingAction | null;
  actionError: SnapshotErrorPresentation | null;
};

export type SnapshotUiAction =
  | { type: "open"; dialog: SnapshotDialogState }
  | { type: "close" }
  | { type: "start"; pending: SnapshotPendingAction }
  | { type: "succeed" }
  | { type: "fail"; error: SnapshotErrorPresentation }
  | { type: "dismiss-error" };

export const INITIAL_SNAPSHOT_UI_STATE: SnapshotUiState = {
  dialog: null,
  pending: null,
  actionError: null,
};

export function snapshotUiReducer(
  state: SnapshotUiState,
  action: SnapshotUiAction,
): SnapshotUiState {
  switch (action.type) {
    case "open":
      return state.pending ? state : { ...state, dialog: action.dialog, actionError: null };
    case "close":
      return state.pending ? state : { ...state, dialog: null };
    case "start":
      return state.pending ? state : { ...state, pending: action.pending, actionError: null };
    case "succeed":
      return { dialog: null, pending: null, actionError: null };
    case "fail":
      return { ...state, pending: null, actionError: action.error };
    case "dismiss-error":
      return { ...state, actionError: null };
  }
}

export function isSnapshotActionPending(
  pending: SnapshotPendingAction | null,
  kind: SnapshotPendingAction["kind"],
  snapshotId?: string,
): boolean {
  return pending?.kind === kind
    && (snapshotId === undefined || pending.snapshotId === snapshotId);
}
