import { expect, type Page } from "@playwright/test";

export type SeedGame = Record<string, unknown> & { id: string; name: string };

export const CORE_GAMES: SeedGame[] = [
  {
    id: "alpha",
    name: "Alpha Quest",
    coverUrl: "/icons/ggrid-512.png",
    franchise: "Saga",
    genres: ["RPG"],
    platforms: ["PC"],
    owned: true,
    played: true,
    released: true,
    rating: 8,
    priority: 1,
  },
  {
    id: "beta",
    name: "Beta Odyssey",
    franchise: "Saga",
    genres: ["Strategy"],
    platforms: ["Switch"],
    wishlisted: true,
    released: true,
    priority: 2,
  },
  {
    id: "gamma",
    name: "Gamma Legacy",
    franchise: "Solo",
    genres: ["RPG"],
    platforms: ["PC"],
    owned: true,
    released: true,
  },
  {
    id: "delta",
    name: "Delta Force",
    genres: ["Action"],
    platforms: ["PC"],
    wishlisted: true,
    released: false,
  },
];

export function syntheticGames(count: number): SeedGame[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `synthetic-${index}`,
    name: `Synthetic Game ${String(index).padStart(3, "0")}`,
    franchise: index % 5 === 0 ? `Franchise ${index % 20}` : "",
    genres: [index % 2 === 0 ? "RPG" : "Action"],
    platforms: [index % 3 === 0 ? "Switch" : "PC"],
    owned: index % 2 === 0,
    wishlisted: index % 7 === 0,
    played: index % 4 === 0,
    released: true,
    rating: index % 3 === 0 ? (index % 10) + 1 : null,
    priority: index < 25 ? index + 1 : null,
  }));
}

export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

export async function openSeededLibrary(
  page: Page,
  games: readonly SeedGame[] = CORE_GAMES,
): Promise<void> {
  const marker = `e2e-${games.length}-${games[0]?.id ?? "empty"}`;
  await page.addInitScript(
    ({ marker: seedMarker, games: seededGames }) => {
      if (localStorage.getItem("ggrid:e2e-seed") === seedMarker) return;
      localStorage.clear();
      localStorage.setItem("ggrid:e2e-seed", seedMarker);
      localStorage.setItem(
        "game-library.v1",
        JSON.stringify({
          version: 1,
          exportedAt: "2026-08-22T12:00:00.000Z",
          settings: {
            sortBy: "name",
            sortDir: "asc",
            steamId: "",
            steamApiKey: "",
            igdbClientId: "",
            igdbClientSecret: "",
          },
          games: seededGames,
        }),
      );
      localStorage.setItem(
        "ggrid:onboarding-progress:v1",
        JSON.stringify({
          version: 1,
          status: "dismissed",
          completedSteps: ["welcome", "local-library", "pwa"],
          selectedAction: "later",
          updatedAt: "2026-08-22T12:00:00.000Z",
        }),
      );
      localStorage.setItem("game-library.motion.v1", JSON.stringify({ preference: "none" }));
    },
    { marker, games },
  );
  await page.goto("/");
  const list = page.locator('m3-list[aria-label="Spiele"]');
  await expect(list).toBeVisible();
  await expect(list.locator("m3-list-item")).toHaveCount(games.length);
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}
