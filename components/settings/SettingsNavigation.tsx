"use client";

import type { ComponentType, SVGProps } from "react";
import {
  IconBackup,
  IconChevronLeft,
  IconChevronRight,
  IconHelp,
  IconLink,
  IconPalette,
} from "@/components/m3/icons";

export const SETTINGS_SECTIONS: ReadonlyArray<{
  id: string;
  label: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  { id: "connections", label: "Verbindungen", description: "Steam und IGDB", Icon: IconLink },
  { id: "appearance", label: "Erscheinungsbild", description: "Farben, Modus, Animationen", Icon: IconPalette },
  { id: "data", label: "Daten & Sicherung", description: "Export, Import, Snapshots", Icon: IconBackup },
  { id: "help", label: "Hilfe", description: "Tastenkürzel", Icon: IconHelp },
];

/** List of settings areas: a side list on wide windows, a drill-in list on phones. */
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
      <nav className="settings-nav" aria-label="Einstellungsbereiche">
        {SETTINGS_SECTIONS.map(({ id, label, description, Icon }, index) => (
          <button
            key={id}
            type="button"
            className="settings-nav-item"
            aria-current={tab === index ? "page" : undefined}
            onClick={() => {
              onTabChange(index);
              onMobileSectionOpen(true);
            }}
          >
            <Icon className="settings-nav-icon" />
            <span className="settings-nav-copy">
              <span>{label}</span>
              <small>{description}</small>
            </span>
            <IconChevronRight className="settings-nav-chevron" />
          </button>
        ))}
      </nav>

      <div className="settings-mobile-back">
        <m3-button variant="text" onClick={() => onMobileSectionOpen(false)}>
          <IconChevronLeft slot="icon" />
          Alle Einstellungen
        </m3-button>
      </div>
    </>
  );
}
