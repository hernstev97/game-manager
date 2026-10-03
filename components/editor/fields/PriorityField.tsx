"use client";

import { M3Chip } from "@/components/m3/host";
import { IconQueue } from "@/components/m3/icons";
import { PlanSlotField } from "@/components/editor/fields/PlanSlotField";

export function PriorityBadge({ value }: { value: number | null }) {
  if (value == null) return null;
  return (
    <span className="priority-badge" title={`Als Nächstes: Platz ${value}`}>
      <M3Chip>
        <IconQueue slot="icon" width={18} height={18} />
        #{value}
      </M3Chip>
    </span>
  );
}

export function PriorityField({
  value,
  total,
  onPriority,
}: {
  field: { label: string };
  value: unknown;
  total: number;
  onPriority: (priority: number | null) => void;
}) {
  return (
    <PlanSlotField
      label="Als Nächstes"
      value={value}
      total={total}
      emptyText="Nicht eingereiht"
      addLabel="Einreihen"
      onPosition={onPriority}
    />
  );
}
