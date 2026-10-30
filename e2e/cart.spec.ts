// e2e/cart.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Shopping Cart", () => {
  test("should add and remove items from cart", async ({ page }) => {
    await page.goto("/product/p01");
    await page.getByRole("button", { name: /加入购物车|Ajouter au panier/ }).click();

    // Open cart
    await page.getByRole("button", { name: /购物车|Panier/ }).click();
    await expect(page.getByText(/iPhone/)).toBeVisible();

    // Remove item
    await page.getByRole("button", { name: /移除|Supprimer/ }).first().click();
    await expect(page.getByText(/购物车为空|Panier vide/)).toBeVisible();
  });

  test("should adjust quantity", async ({ page }) => {
    await page.goto("/product/p01");
    await page.getByRole("button", { name: /加入购物车|Ajouter au panier/ }).click();
    await page.getByRole("button", { name: /购物车|Panier/ }).click();
    await page.getByRole("button", { name: /增加|Augmenter/ }).first().click();
    await expect(page.getByText("2")).toBeVisible();
  });

  test("should export inquiry text", async ({ page }) => {
    await page.goto("/product/p01");
    await page.getByRole("button", { name: /加入购物车|Ajouter au panier/ }).click();
    await page.getByRole("button", { name: /购物车|Panier/ }).click();
    await page.getByRole("button", { name: /复制询价单|Copier le devis/ }).click();
    // Clipboard copy doesn't have visible UI, just verify no error
    await expect(page.getByText(/小计|Sous-total/)).toBeVisible();
  });
});