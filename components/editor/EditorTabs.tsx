"use client";

import type { FieldGroup, GameFieldDef } from "@/lib/game-fields";
import { FIELD_GROUP_LABELS } from "@/lib/game-fields";
import { M3Tabs } from "@/components/m3/host";

export type EditorGroup = { group: FieldGroup; fields: GameFieldDef[] };

export function EditorTabs({
  groups,
  activeTab,
  onChange,
}: {
  groups: EditorGroup[];
  activeTab: number;
  onChange: (index: number) => void;
}) {
  return (
    <M3Tabs activeTab={activeTab} onChange={onChange} scrollableOnMobile>
      {groups.map((group) => (
        <m3-tab key={group.group} panel={`editor-${group.group}`} value={group.group}>
          {FIELD_GROUP_LABELS[group.group]}
        </m3-tab>
      ))}
    </M3Tabs>
  );
}
