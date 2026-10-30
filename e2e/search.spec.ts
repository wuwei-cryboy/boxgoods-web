// e2e/search.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Search", () => {
  test("should search and show results", async ({ page }) => {
    await page.goto("/search");
    await page.getByPlaceholder(/搜索|Rechercher/).fill("iPhone");
    await page.keyboard.press("Enter");
    await expect(page.getByText(/iPhone/)).toBeVisible();
  });

  test("should show no results when no match", async ({ page }) => {
    await page.goto("/search");
    await page.getByPlaceholder(/搜索|Rechercher/).fill("xyz123nonexistent");
    await page.keyboard.press("Enter");
    await expect(page.getByText(/无结果|Aucun résultat/)).toBeVisible();
  });

  test("should sort results", async ({ page }) => {
    await page.goto("/search?q=iPhone");
    await page.selectOption("select", "price_asc");
    await expect(page.getByText(/iPhone/)).toBeVisible();
  });
});