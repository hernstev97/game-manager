"use client";

import { useEffect, useRef } from "react";
import { SYSTEM_SAVED_VIEW_IDS, type SavedView } from "@/lib/model/views";
import { IconExpandMore, IconStar } from "@/components/m3/icons";
import styles from "./saved-view-chips.module.css";

/**
 * System views that duplicate a dedicated navigation destination
 * ("Als Nächstes", "Ranking"). They stay in the document and remain
 * reachable when active, but do not compete for space in the chip row.
 */
const DESTINATION_BACKED_VIEW_IDS = new Set<string>([
  SYSTEM_SAVED_VIEW_IDS.queue,
  SYSTEM_SAVED_VIEW_IDS.favorites,
]);

export function visibleSavedViews(
  views: readonly SavedView[],
  selectedViewId: string,
): SavedView[] {
  return views.filter(
    (view) => view.id === selectedViewId || !DESTINATION_BACKED_VIEW_IDS.has(view.id),
  );
}

export type SavedViewChipsProps = {
  views: readonly SavedView[];
  selectedViewId: string;
  dirty: boolean;
  disabled?: boolean;
  onSelect: (viewId: string) => void;
  onManage: (trigger: HTMLButtonElement) => void;
};

/**
 * Horizontal saved-view switcher. Selecting an unselected chip switches the
 * view; the selected chip discloses management actions for that view.
 */
export function SavedViewChips({
  views,
  selectedViewId,
  dirty,
  disabled = false,
  onSelect,
  onManage,
}: SavedViewChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shown = visibleSavedViews(views, selectedViewId);

  useEffect(() => {
    const selected = scrollRef.current?.querySelector<HTMLElement>("[aria-current='true']");
    selected?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [selectedViewId]);

  return (
    <nav className={styles.row} aria-label="Gespeicherte Ansichten">
      <div ref={scrollRef} className={styles.scroller}>
        {shown.map((view) => {
          const selected = view.id === selectedViewId;
          return (
            <button
              key={view.id}
              type="button"
              className={styles.chip}
              aria-current={selected ? "true" : undefined}
              aria-haspopup={selected ? "dialog" : undefined}
              aria-label={selected ? `Ansicht „${view.name}“ verwalten` : undefined}
              disabled={disabled}
              onClick={(event) => {
                if (selected) onManage(event.currentTarget);
                else onSelect(view.id);
              }}
            >
              {view.isDefault ? (
                <IconStar className={styles.leading} width={18} height={18} aria-label="Standardansicht" />
              ) : null}
              <span className={styles.name}>{view.name}</span>
              {selected && dirty ? <span className={styles.dirtyDot} aria-label="Geändert" /> : null}
              {selected ? <IconExpandMore className={styles.trailing} width={18} height={18} /> : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
