"use client";

import {
  useEffect,
  useId,
  useRef,
  type RefObject,
} from "react";
import { M3Dialog, M3Radio } from "@/components/m3/host";
import type { DisplayMode, GroupByMode } from "@/lib/model/views";
import styles from "./mobile-display-sheet.module.css";

export type MobileDisplaySheetProps = {
  open: boolean;
  displayMode: DisplayMode;
  groupBy: GroupByMode;
  onDisplayMode: (mode: DisplayMode) => void;
  onGroupBy: (groupBy: GroupByMode) => void;
  onClose: () => void;
  /**
   * Optional explicit fallback for focus restoration. M3Dialog already restores
   * the actual opener; this ref also covers parents that unmount the sheet as
   * soon as `onClose` runs.
   */
  triggerRef?: RefObject<HTMLElement | null>;
};

const HISTORY_STATE_KEY = "__ggridMobileDisplaySheet";

function focusTrigger(triggerRef: MobileDisplaySheetProps["triggerRef"]) {
  const trigger = triggerRef?.current;
  if (!trigger?.isConnected) return;

  const focus = () => trigger.focus({ preventScroll: true });
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(focus);
  else setTimeout(focus, 0);
}

/**
 * Adds a disposable same-document history entry while the sheet is open. A
 * browser-back gesture consumes that entry and closes the controlled sheet.
 */
function useBrowserBackClose(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const marker = `${Date.now()}-${Math.random()}`;
    const currentState = window.history.state;
    const preservedState =
      currentState && typeof currentState === "object" ? currentState : {};

    window.history.pushState(
      { ...preservedState, [HISTORY_STATE_KEY]: marker },
      "",
    );

    const handlePopState = () => onCloseRef.current();
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (window.history.state?.[HISTORY_STATE_KEY] === marker) {
        window.history.back();
      }
    };
  }, [open]);
}

export function MobileDisplaySheet({
  open,
  displayMode,
  groupBy,
  onDisplayMode,
  onGroupBy,
  onClose,
  triggerRef,
}: MobileDisplaySheetProps) {
  const displayName = useId();
  const groupingName = useId();
  const wasOpenRef = useRef(open);

  useBrowserBackClose(open, onClose);

  useEffect(() => {
    if (wasOpenRef.current && !open) focusTrigger(triggerRef);
    wasOpenRef.current = open;
  }, [open, triggerRef]);

  useEffect(
    () => () => {
      if (wasOpenRef.current) focusTrigger(triggerRef);
    },
    [triggerRef],
  );

  return (
    <M3Dialog
      open={open}
      onClose={onClose}
      headline="Darstellung"
      presentation="sheet"
      className={styles.sheet}
      actions={
        <m3-button slot="actions" onClick={onClose}>
          Fertig
        </m3-button>
      }
    >
      <div className={styles.content}>
        <fieldset className={styles.group}>
          <legend>Ansichtsmodus</legend>
          <M3Radio
            name={displayName}
            value="list"
            checked={displayMode === "list"}
            onChange={() => onDisplayMode("list")}
            label="Liste"
          />
          <M3Radio
            name={displayName}
            value="compact"
            checked={displayMode === "compact"}
            onChange={() => onDisplayMode("compact")}
            label="Kompakt"
          />
          <M3Radio
            name={displayName}
            value="grid"
            checked={displayMode === "grid"}
            onChange={() => onDisplayMode("grid")}
            label="Cover-Raster"
          />
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Gruppierung</legend>
          <M3Radio
            name={groupingName}
            value="none"
            checked={groupBy === "none"}
            onChange={() => onGroupBy("none")}
            label="Keine"
          />
          <M3Radio
            name={groupingName}
            value="franchise"
            checked={groupBy === "franchise"}
            onChange={() => onGroupBy("franchise")}
            label="Franchise"
          />
        </fieldset>
      </div>
    </M3Dialog>
  );
}
