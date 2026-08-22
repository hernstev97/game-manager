"use client";

import type { SavedView } from "@/lib/model/views";
import { isSavedViewMutable } from "./saved-view-helpers";
import styles from "./saved-view-rail.module.css";

/** Callback-only integration surface; persistence remains owned by the parent. */
export type SavedViewRailProps = {
  views: readonly SavedView[];
  selectedViewId: string;
  dirty?: boolean;
  onSelect: (viewId: string) => void;
  onRename?: (view: SavedView) => void;
  onDuplicate?: (view: SavedView) => void;
  onDelete?: (view: SavedView) => void;
  onSetDefault?: (view: SavedView) => void;
  onMove?: (view: SavedView, direction: "up" | "down") => void;
};

export function SavedViewRail({
  views,
  selectedViewId,
  dirty = false,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
  onSetDefault,
  onMove,
}: SavedViewRailProps) {
  const customViews = views.filter(isSavedViewMutable);
  const selectedView = views.find((view) => view.id === selectedViewId);
  const selectedIsMutable = selectedView ? isSavedViewMutable(selectedView) : false;
  const selectedCustomIndex = selectedView
    ? customViews.findIndex((view) => view.id === selectedView.id)
    : -1;

  return (
    <nav className={styles.rail} aria-label="Gespeicherte Ansichten">
      <label className={styles.mobileSelector}>
        <span>Ansicht</span>
        <select value={selectedViewId} onChange={(event) => onSelect(event.target.value)}>
          {views.map((view) => (
            <option key={view.id} value={view.id}>
              {view.isDefault ? "★ " : ""}
              {view.name}
              {dirty && view.id === selectedViewId ? " • geändert" : ""}
            </option>
          ))}
        </select>
      </label>
      {selectedView &&
      (onDuplicate ||
        onSetDefault ||
        (selectedIsMutable && (onRename || onDelete || onMove))) ? (
        <details className={styles.mobileManage}>
          <summary>Ansicht verwalten</summary>
          <div className={styles.mobileManageItems}>
            {onDuplicate ? (
              <button type="button" onClick={() => onDuplicate(selectedView)}>
                Duplizieren
              </button>
            ) : null}
            {onSetDefault && !selectedView.isDefault ? (
              <button type="button" onClick={() => onSetDefault(selectedView)}>
                Als Standard
              </button>
            ) : null}
            {selectedIsMutable && onRename ? (
              <button type="button" onClick={() => onRename(selectedView)}>
                Umbenennen
              </button>
            ) : null}
            {selectedIsMutable && onMove ? (
              <>
                <button
                  type="button"
                  disabled={selectedCustomIndex <= 0}
                  onClick={() => onMove(selectedView, "up")}
                >
                  Nach oben
                </button>
                <button
                  type="button"
                  disabled={selectedCustomIndex === customViews.length - 1}
                  onClick={() => onMove(selectedView, "down")}
                >
                  Nach unten
                </button>
              </>
            ) : null}
            {selectedIsMutable && onDelete ? (
              <button className={styles.danger} type="button" onClick={() => onDelete(selectedView)}>
                Löschen
              </button>
            ) : null}
          </div>
        </details>
      ) : null}

      <ul className={styles.viewList}>
        {views.map((view) => {
          const mutable = isSavedViewMutable(view);
          const customIndex = mutable
            ? customViews.findIndex((candidate) => candidate.id === view.id)
            : -1;
          const selected = view.id === selectedViewId;
          return (
            <li key={view.id} className={styles.viewItem}>
              <button
                className={styles.viewButton}
                type="button"
                aria-current={selected ? "page" : undefined}
                onClick={() => onSelect(view.id)}
              >
                <span className={styles.viewName}>{view.name}</span>
                {view.isDefault ? <span title="Standardansicht">★</span> : null}
                {selected && dirty ? (
                  <span className={styles.dirtyDot} aria-label="Geändert" />
                ) : null}
              </button>

              {onDuplicate || onSetDefault || (mutable && (onRename || onDelete || onMove)) ? (
                <details className={styles.menu}>
                  <summary aria-label={`Aktionen für ${view.name}`}>•••</summary>
                  <div className={styles.menuItems}>
                    {onDuplicate ? (
                      <button type="button" onClick={() => onDuplicate(view)}>
                        Duplizieren
                      </button>
                    ) : null}
                    {onSetDefault && !view.isDefault ? (
                      <button type="button" onClick={() => onSetDefault(view)}>
                        Als Standard
                      </button>
                    ) : null}
                    {mutable && onRename ? (
                      <button type="button" onClick={() => onRename(view)}>
                        Umbenennen
                      </button>
                    ) : null}
                    {mutable && onMove ? (
                      <>
                        <button
                          type="button"
                          disabled={customIndex <= 0}
                          onClick={() => onMove(view, "up")}
                        >
                          Nach oben
                        </button>
                        <button
                          type="button"
                          disabled={customIndex === customViews.length - 1}
                          onClick={() => onMove(view, "down")}
                        >
                          Nach unten
                        </button>
                      </>
                    ) : null}
                    {mutable && onDelete ? (
                      <button className={styles.danger} type="button" onClick={() => onDelete(view)}>
                        Löschen
                      </button>
                    ) : null}
                  </div>
                </details>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
