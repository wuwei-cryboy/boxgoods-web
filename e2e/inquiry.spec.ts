// e2e/inquiry.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Inquiry Form", () => {
  test("should submit valid inquiry", async ({ page }) => {
    await page.goto("/inquiry");
    await page.getByLabel(/品类|Catégorie/).fill("telephones");
    await page.getByLabel(/姓名|Nom/).fill("测试用户");
    await page.getByLabel(/邮箱|E-mail/).fill("test@example.com");
    await page.getByLabel(/数量|Quantité/).fill("10");
    await page.getByRole("button", { name: /提交|Envoyer/ }).click();
    await expect(page.getByText(/已提交|Merci/)).toBeVisible();
  });

  test("should show validation errors for empty required fields", async ({ page }) => {
    await page.goto("/inquiry");
    await page.getByRole("button", { name: /提交|Envoyer/ }).click();
    await expect(page.getByText(/required|必填/i)).toBeVisible();
  });

  test("should reject invalid email", async ({ page }) => {
    await page.goto("/inquiry");
    await page.getByLabel(/姓名|Nom/).fill("Test");
    await page.getByLabel(/邮箱|E-mail/).fill("not-an-email");
    await page.getByRole("button", { name: /提交|Envoyer/ }).click();
    await expect(page.getByText(/email|邮箱/i)).toBeVisible();
  });
});