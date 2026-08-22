"use client";

import { IconGrip } from "@/components/m3/icons";

export function ReorderToolbar({
  reorderMode,
  onToggle,
}: {
  reorderMode: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="reorder-toolbar">
      <span className="settings-copy">
        {reorderMode ? "Ziehe am Griff oder nutze die Pfeiltasten." : "Prioritäten direkt anordnen."}
      </span>
      <m3-button variant={reorderMode ? "tonal" : "outlined"} onClick={onToggle}>
        <IconGrip slot="icon" width={18} height={18} />
        {reorderMode ? "Fertig" : "Reihenfolge ändern"}
      </m3-button>
    </div>
  );
}
