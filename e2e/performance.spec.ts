import { expect, test } from "@playwright/test";
import {
  collectPageErrors,
  openSeededLibrary,
  syntheticGames,
} from "./fixtures";

test("@desktop keeps search and grid interaction responsive with 500 games", async ({ page }) => {
  const errors = collectPageErrors(page);
  await openSeededLibrary(page, syntheticGames(500));

  const startedAt = Date.now();
  await page.getByRole("searchbox", { name: "Bibliothek durchsuchen" }).fill("Synthetic Game 499");
  await expect(page.getByText("1 von 500", { exact: true })).toBeVisible();
  expect(Date.now() - startedAt).toBeLessThan(2_000);

  await page.locator('m3-icon-button[aria-label="Suche löschen"]').click();
  await expect(page.getByText("500 Spiele", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Darstellung:/ }).click();
  await page.getByRole("radio", { name: "Cover-Raster" }).click();
  await page.getByRole("button", { name: "Fertig" }).click();
  const grid = page.getByRole("grid", { name: "Spiele als Cover-Raster" });
  await expect(grid).toBeVisible();
  await expect(grid.getByRole("row")).toHaveCount(500);
  await page.getByRole("button", { name: "Synthetic Game 499 öffnen" }).scrollIntoViewIfNeeded();
  expect(errors).toEqual([]);
});
