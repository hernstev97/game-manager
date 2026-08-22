import { expect, test } from "@playwright/test";
import {
  CORE_GAMES,
  collectPageErrors,
  expectNoHorizontalOverflow,
  openSeededLibrary,
} from "./fixtures";

test("@viewport loads the library, opens the editor, and fits the viewport", async ({ page }, testInfo) => {
  const errors = collectPageErrors(page);
  await openSeededLibrary(page);
  await expectNoHorizontalOverflow(page);

  await page.getByText("Alpha Quest", { exact: true }).first().click();
  await expect(page.getByText("Spiel 1 von 4: Alpha Quest", { exact: true })).toBeVisible();
  await expect(page.locator(".editor-save-state")).toContainText("Lokal gespeichert");
  await expectNoHorizontalOverflow(page);
  if (testInfo.project.name === "desktop-1280") {
    await expect(page).toHaveScreenshot("editor-identity.png");
  }
  await page.keyboard.press("Escape");
  await expect(page.getByText("Spiel 1 von 4: Alpha Quest", { exact: true })).toBeHidden();
  expect(errors).toEqual([]);
});

test("@mobile keeps menus and the confirmed filter sheet inside the viewport", async ({ page }) => {
  const errors = collectPageErrors(page);
  await openSeededLibrary(page);

  const moreActions = page.locator('m3-icon-button[aria-label="Weitere Aktionen"]');
  await moreActions.click();
  await expect(page.getByRole("menuitem", { name: "Sicherung exportieren" })).toBeVisible();
  await expect(page).toHaveScreenshot("mobile-library-menu.png");
  await moreActions.click();

  await page.locator(".mobile-filter-overview m3-button").click();
  await expect(page.locator(".mobile-filter-sheet")).toBeVisible();
  await expect(page.locator(".mobile-filter-sheet m3-chip").filter({ hasText: "PC (3)" })).toBeVisible();
  await expect(page).toHaveScreenshot("mobile-filter-sheet.png");
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("@desktop saves a view and renders franchise groups in the cover grid", async ({ page }) => {
  const errors = collectPageErrors(page);
  await openSeededLibrary(page);

  const platformGroup = page.locator(".desktop-filter-groups .anchor").filter({ hasText: "Plattform" });
  await platformGroup.locator("m3-button").click();
  await platformGroup.locator("m3-menu-item").filter({ hasText: "PC (3)" }).click();
  await expect(page.getByText("3 von 4 sichtbar", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Als neue Ansicht speichern" }).click();
  await page.getByRole("dialog", { name: "Neue Ansicht speichern" }).getByRole("textbox").fill("PC Spiele");
  await page.getByRole("dialog", { name: "Neue Ansicht speichern" }).getByRole("button", { name: "Speichern" }).click();
  await expect(page.getByRole("button", { name: "PC Spiele" })).toBeVisible();

  await page.getByRole("button", { name: "Alle löschen" }).click();
  await page.getByRole("radio", { name: "Cover-Raster" }).click();
  await page.getByLabel("Gruppierung").selectOption("franchise");
  await expect(page.getByRole("grid", { name: "Spiele als Cover-Raster" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Saga" })).toBeVisible();
  await expect(page.getByText("2 sichtbare Spiele", { exact: true })).toBeVisible();
  await expect(page).toHaveScreenshot("franchise-cover-grid.png");

  await page.getByRole("button", { name: "PC Spiele" }).click();
  await expect(page.getByText("3 von 4 sichtbar", { exact: true })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Liste" })).toHaveAttribute("aria-checked", "true");
  expect(errors).toEqual([]);
});

test("@desktop applies a bulk status, appends the queue, and keyboard-reorders it", async ({ page }) => {
  const errors = collectPageErrors(page);
  await openSeededLibrary(page);

  await page.getByRole("button", { name: "Mehrere auswählen" }).click();
  await page.getByRole("button", { name: "Gamma Legacy auswählen" }).click();
  await page.getByRole("button", { name: "Delta Force auswählen" }).click();
  await expect(page.getByRole("region", { name: "Sammelbearbeitung" })).toContainText("2Spiele ausgewählt");
  await page.getByText("Felder bearbeiten", { exact: true }).click();
  const statusGroup = page.getByRole("group", { name: "Status setzen" });
  await statusGroup.locator("select").nth(0).selectOption("played");
  await statusGroup.locator("select").nth(1).selectOption("true");
  await statusGroup.getByRole("button", { name: "Anwenden" }).click();
  await page.getByText("Felder bearbeiten", { exact: true }).click();
  await page.getByRole("button", { name: "Warteschlange +" }).click();
  await expect(page).toHaveScreenshot("bulk-action-bar.png");

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("game-library.v1") ?? "null"));
  expect(stored.games.find((game: { id: string }) => game.id === "gamma").played).toBe(true);
  expect(Object.fromEntries(stored.games.map(
    (game: { id: string; queuePosition: number | null }) => [game.id, game.queuePosition],
  ))).toEqual({ alpha: 1, beta: 2, gamma: 4, delta: 3 });

  await page.getByRole("button", { name: "Auswahl beenden" }).click();
  await page.getByRole("navigation", { name: "Bibliotheksbereich" })
    .getByRole("button", { name: "Spielwarteschlange", exact: true })
    .click();
  await page.getByRole("button", { name: "Reorder-Modus" }).click();
  const gammaHandle = page.getByRole("button", { name: "Gamma Legacy: Spielreihenfolge verschieben" });
  await gammaHandle.focus();
  await gammaHandle.press("Space");
  await gammaHandle.press("ArrowUp");
  await gammaHandle.press("ArrowUp");
  await gammaHandle.press("ArrowUp");
  await gammaHandle.press("ArrowUp");
  await gammaHandle.press("Space");
  const queueItems = page.locator('ol[aria-label="Warteschlange nach Spielreihenfolge"] > li');
  await expect(queueItems.nth(0)).toContainText("Gamma Legacy");
  expect(errors).toEqual([]);
});

test("@desktop reviews Steam metadata before applying it", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.route("**/api/steam?**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      "10": {
        success: true,
        data: {
          name: "Alpha Quest Remastered",
          release_date: { coming_soon: false },
          price_overview: { currency: "EUR", initial: 1999, final: 1499, discount_percent: 25 },
        },
      },
    }),
  }));
  await page.route("https://cdn.cloudflare.steamstatic.com/steam/apps/10/header.jpg", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
    }),
  );
  await openSeededLibrary(page, CORE_GAMES.map((game) =>
    game.id === "alpha" ? { ...game, steamAppId: 10 } : game));

  await page.locator('m3-icon-button[aria-label="Einstellungen"]').click();
  await page.getByText("Cover, Namen & Preise aktualisieren", { exact: true }).click();
  const review = page.getByRole("dialog", { name: /Metadaten prüfen · Alpha Quest/ });
  await expect(review).toBeVisible({ timeout: 15_000 });
  await expect(review.getByText("Alpha Quest Remastered", { exact: true })).toBeVisible();
  await expect(page).toHaveScreenshot("metadata-review.png");
  await review.getByLabel("Neuen Wert übernehmen").first().check();
  await review.getByRole("button", { name: "Auswahl übernehmen" }).click();
  await expect(review).toBeHidden();
  await expect(page.getByText("Alpha Quest Remastered", { exact: true }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("@desktop exports, restores, and reloads the local library offline", async ({ page, context }) => {
  const errors = collectPageErrors(page);
  await openSeededLibrary(page);

  const downloadPromise = page.waitForEvent("download");
  await page.locator('m3-icon-button[aria-label="Exportieren"]').click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const backup = Buffer.concat(chunks);
  const parsed = JSON.parse(backup.toString("utf8"));
  expect(parsed.version).toBe(2);
  expect(parsed.games).toHaveLength(4);
  expect(parsed.savedViews.length).toBeGreaterThanOrEqual(7);

  await page.locator(".library-tools input[type=file]").setInputFiles({
    name: "ggrid-backup.json",
    mimeType: "application/json",
    buffer: backup,
  });
  const importDialog = page.getByRole("dialog", { name: "Sicherung prüfen" });
  await expect(importDialog).toBeVisible();
  await importDialog.getByLabel(/Ersetzen/).check();
  await importDialog.getByRole("button", { name: "Sicherung wiederherstellen" }).click();
  await expect(importDialog).toBeHidden();

  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "onLine", {
      configurable: true,
      get: () => false,
    });
  });
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("4 von 4 sichtbar", { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(page.getByRole("status").filter({ hasText: "Offline – lokale Bibliotheksdaten" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "none");
  await context.setOffline(false);
  expect(errors).toEqual([]);
});
