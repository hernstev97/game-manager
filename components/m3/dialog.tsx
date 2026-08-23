"use client";

import { useEffect, useRef, type ReactNode, type Ref } from "react";
import { useHostEvent } from "@/components/m3/events";
import { ADAPTIVE_DIALOG_STYLE, installShadowStyle } from "@/components/m3/shadow-styles";

type DialogEl = HTMLElement & {
  open: boolean;
  show: () => Promise<void>;
  close: (reason?: string) => boolean;
};

type DialogPresentation = "default" | "fullscreen" | "sheet" | "editor";

export function M3Dialog({
  open,
  onClose,
  headline,
  children,
  actions,
  className,
  presentation = "default",
  leadingAction,
}: {
  open: boolean;
  onClose: () => void;
  headline: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  presentation?: DialogPresentation;
  leadingAction?: ReactNode;
}) {
  const ref = useRef<DialogEl>(null);
  useHostEvent(ref, "dialog-close", onClose);

  const presentationClass =
    presentation === "default" ? "" : `adaptive-${presentation}`;
  const classes = [className, presentationClass].filter(Boolean).join(" ");

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
