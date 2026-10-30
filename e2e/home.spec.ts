// e2e/home.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should load home page with brand name", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/BoxGoods/);
    await expect(page.getByText("BoxGoods")).toBeVisible();
  });

  test("should render category icons on home", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("香水")).toBeVisible();
    await expect(page.getByText("腕表")).toBeVisible();
    await expect(page.getByText("手机")).toBeVisible();
    await expect(page.getByText("太阳镜")).toBeVisible();
    await expect(page.getByText("手机配件套装")).toBeVisible();
  });

  test("should navigate to categories page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /目录/ }).click();
    await expect(page).toHaveURL("/categories");
    await expect(page.getByRole("heading", { name: /品类/ })).toBeVisible();
  });

  test("should switch language between FR and ZH", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /FR|ZH/ }).first().click();
    await expect(page.getByText("Accueil")).toBeVisible();
    await page.getByRole("button", { name: /FR|ZH/ }).first().click();
    await expect(page.getByText("首页")).toBeVisible();
  });
});