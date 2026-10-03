"use client";

import { useEffect, useRef, type ReactNode, type Ref } from "react";
import { useHostEvent } from "@/components/m3/events";
import { ADAPTIVE_DIALOG_STYLE, installShadowStyle } from "@/components/m3/shadow-styles";

type DialogEl = HTMLElement & {
  open: boolean;
  show: () => Promise<void>;
  close: (reason?: string) => boolean;
};

/** `side` is a modal side sheet on wide windows and a bottom sheet on compact ones. */
type DialogPresentation = "default" | "fullscreen" | "sheet" | "side" | "editor";

export function M3Dialog({
  open,
  onClose,
  headline,
  children,
  actions,
  className,
  presentation = "default",
  size = "default",
  dismissible = true,
  leadingAction,
}: {
  open: boolean;
  onClose: () => void;
  headline: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  presentation?: DialogPresentation;
  /** `wide` lets comparison-heavy dialogs grow beyond the 560px default on large screens. */
  size?: "default" | "wide";
  /** When false, Escape and scrim clicks are ignored (e.g. while saving). */
  dismissible?: boolean;
  leadingAction?: ReactNode;
}) {
  const ref = useRef<DialogEl>(null);
  const dismissibleRef = useRef(dismissible);
  useHostEvent(ref, "dialog-close", onClose);
  useHostEvent(ref, "dialog-request-close", (event) => {
    const reason = (event as CustomEvent<{ reason?: string }>).detail?.reason;
    if (!dismissibleRef.current && reason !== "programmatic") event.preventDefault();
  });

  useEffect(() => {
    dismissibleRef.current = dismissible;
  }, [dismissible]);

  const presentationClass =
    presentation === "default"
      ? ""
      : presentation === "side"
        ? "adaptive-sheet adaptive-side"
        : `adaptive-${presentation}`;
  const classes = [className, presentationClass, size === "wide" ? "wide-dialog" : "", actions ? "" : "no-actions"]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const apply = () => installShadowStyle(dialog, "dialog", ADAPTIVE_DIALOG_STYLE);
    apply();
    dialog.addEventListener("dialog-open", apply);
    return () => dialog.removeEventListener("dialog-open", apply);
  }, [presentation]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) void dialog.show();
    if (!open && dialog.open) dialog.close("programmatic");
  }, [open]);

  return (
    <m3-dialog ref={ref as Ref<HTMLElement>} open={open} headline={headline} className={classes}>
      {leadingAction ? (
        <span slot="icon" className="dialog-leading-action">
          {leadingAction}
        </span>
      ) : null}
      {children}
      {actions}
    </m3-dialog>
  );
}
