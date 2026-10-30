// e2e/product.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Product Page", () => {
  test("should load product detail page", async ({ page }) => {
    await page.goto("/product/p01");
    await expect(page.getByText(/iPhone/)).toBeVisible();
  });

  test("should add product to cart", async ({ page }) => {
    await page.goto("/product/p01");
    await page.getByRole("button", { name: /加入购物车|Ajouter au panier/ }).click();
    // Cart badge should appear
    await expect(page.getByRole("button", { name: /购物车|Panier/ })).toBeVisible();
  });

  test("should toggle favorite", async ({ page }) => {
    await page.goto("/product/p01");
    await page.getByRole("button", { name: /fav|favorite/i }).click();
    await page.getByRole("button", { name: /fav|favorite/i }).click();
  });

  test("should navigate to related products", async ({ page }) => {
    await page.goto("/product/p01");
    await page.getByRole("link", { name: /相关商品|Produits liés/ }).first().click();
    await expect(page.url()).toMatch(/\/product\//);
  });
});