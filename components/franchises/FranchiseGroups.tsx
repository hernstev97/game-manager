import type { CSSProperties, ReactNode } from "react";
import type { DisplayMode } from "@/lib/model/views";
import type { FranchisePresentation } from "@/lib/model/shared";
import {
  groupVisibleGamesByFranchise,
  type FranchiseGame,
  type FranchiseSection,
} from "./franchise-grouping";
import styles from "./franchises.module.css";

export type FranchiseRenderContext<T> = {
  section: FranchiseSection<T>;
  displayMode: DisplayMode;
};

/** Render-slot API keeps list, compact, and grid ownership in the caller. */
export type FranchiseGroupsProps<T extends FranchiseGame> = {
  games: readonly T[];
  presentations?: readonly FranchisePresentation[];
  minimum?: number;
  displayMode: DisplayMode;
  renderItems: (games: readonly T[], context: FranchiseRenderContext<T>) => ReactNode;
  renderHeaderActions?: (
    section: Extract<FranchiseSection<T>, { kind: "franchise" }>,
  ) => ReactNode;
};

function presentationStyle(
  presentation: FranchisePresentation | undefined,
): CSSProperties | undefined {
  if (!presentation?.backgroundUrl) return undefined;
  const x = (presentation.focalPointX ?? 0.5) * 100;
  const y = (presentation.focalPointY ?? 0.5) * 100;
  return {
    backgroundImage: `url(${JSON.stringify(presentation.backgroundUrl)})`,
    backgroundPosition: `${x}% ${y}%`,
  };
}

export function FranchiseGroups<T extends FranchiseGame>({
  games,
  presentations = [],
  minimum,
  displayMode,
  renderItems,
  renderHeaderActions,
}: FranchiseGroupsProps<T>) {
  const sections = groupVisibleGamesByFranchise(games, presentations, minimum);

  return sections.map((section) => {
    const context = { section, displayMode };
    if (section.kind === "ungrouped") {
      return <div key={section.key}>{renderItems(section.games, context)}</div>;
    }

    const presentation = section.kind === "franchise" ? section.presentation : undefined;
    const overlayStrength = presentation?.overlayStrength ?? 0.68;
    return (
      <section
        key={section.key}
        className={`${styles.group} ${presentation?.backgroundUrl ? styles.withBackground : ""}`}
        aria-labelledby={`franchise-${section.key}`}
      >
        {presentation?.backgroundUrl ? (
          <div className={styles.background} style={presentationStyle(presentation)} aria-hidden="true">
            <div className={styles.scrim} style={{ opacity: overlayStrength }} />
          </div>
        ) : null}
        <div className={styles.content}>
          <header className={styles.header}>
            <div>
              <h2 id={`franchise-${section.key}`}>{section.name}</h2>
              <span className={styles.count}>
                {section.visibleCount} {section.visibleCount === 1 ? "sichtbares Spiel" : "sichtbare Spiele"}
              </span>
            </div>
            {section.kind === "franchise" ? renderHeaderActions?.(section) : null}
          </header>
          <div className={styles[displayMode]}>{renderItems(section.games, context)}</div>
        </div>
      </section>
    );
  });
}
