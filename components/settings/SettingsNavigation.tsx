"use client";

import { M3Tabs } from "@/components/m3/host";
import {
  IconChevronLeft,
  IconChevronRight,
} from "@/components/m3/icons";

const SETTINGS_SECTIONS = ["Steam", "IGDB", "Erscheinungsbild", "Daten"] as const;

export function SettingsNavigation({
  tab,
  onTabChange,
  onMobileSectionOpen,
}: {
  tab: number;
  onTabChange: (index: number) => void;
  onMobileSectionOpen: (open: boolean) => void;
}) {
  return (
    <>
      <nav className="settings-mobile-nav" aria-label="Einstellungsbereiche">
        {SETTINGS_SECTIONS.map((label, index) => (
          <button
            key={label}
            type="button"
            className="settings-mobile-nav-item"
            onClick={() => {
              onTabChange(index);
              onMobileSectionOpen(true);
            }}
          >
            <span>{label}</span>
            <IconChevronRight />
          </button>
        ))}
      </nav>

      <div className="settings-mobile-back">
        <m3-button variant="text" onClick={() => onMobileSectionOpen(false)}>
          <IconChevronLeft slot="icon" />
          Bereiche
        </m3-button>
        <strong>{SETTINGS_SECTIONS[tab]}</strong>
      </div>

      <div className="settings-tabs-desktop">
        <M3Tabs activeTab={tab} onChange={(index) => onTabChange(index)}>
          <m3-tab panel="settings-steam" value="steam">
            Steam
          </m3-tab>
          <m3-tab panel="settings-igdb" value="igdb">
            IGDB
          </m3-tab>
          <m3-tab panel="settings-theme" value="theme">
            Erscheinungsbild
          </m3-tab>
          <m3-tab panel="settings-data" value="data">
            Daten
          </m3-tab>
        </M3Tabs>
      </div>
    </>
  );
}
