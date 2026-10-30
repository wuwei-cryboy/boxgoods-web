// e2e/visual-regression.spec.ts
// 视觉回归测试示例：关键页面/组件的像素级对比
// 运行：npm run e2e -- visual-regression.spec.ts
// 更新基准图：npm run e2e -- visual-regression.spec.ts --update-snapshots

import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 375, height: 667 },
];

const PAGES = [
  { path: "/", name: "home" },
  { path: "/categories", name: "categories" },
  { path: "/search", name: "search" },
  { path: "/inquiry", name: "inquiry" },
  { path: "/account", name: "account" },
];

test.describe.configure({ retries: 0 }); // 视觉回归不重试，避免基准图不一致

for (const viewport of VIEWPORTS) {
  for (const page of PAGES) {
    test(`${page.name} @ ${viewport.name}`, async ({ page: pageObj }) => {
      await pageObj.setViewportSize({ width: viewport.width, height: viewport.height });
      await pageObj.goto(page.path);
      await pageObj.waitForLoadState("networkidle");
      
      // 等待关键内容渲染完成
      await pageObj.waitForSelector("main, [role=main], body", { timeout: 10000 });
      
      // 全页截图对比
      await expect(pageObj).toHaveScreenshot(`${page.name}-${viewport.name}.png`, {
        fullPage: true,
        // 动画/过渡已在 config 里 disabled
      });
    });
  }
}

// 组件级视觉回归：商品卡片不同状态
test.describe("ProductCard visual states", () => {
  test("default state", async ({ page }) => {
    await page.goto("/categories");
    await page.waitForLoadState("networkidle");
    const card = page.locator(".cat-row, [class*='product'], a[href*='/product/']").first();
    await expect(card).toBeVisible();
    await expect(card).toHaveScreenshot("product-card-default.png");
  });

  test("hover state", async ({ page }) => {
    await page.goto("/categories");
    await page.waitForLoadState("networkidle");
    const card = page.locator(".cat-row, [class*='product'], a[href*='/product/']").first();
    await card.hover();
    await page.waitForTimeout(200); // 等待 hover 过渡
    await expect(card).toHaveScreenshot("product-card-hover.png");
  });
});

// 语言切换视觉回归
test.describe("Language switch visual", () => {
  for (const lang of ["fr", "zh"] as const) {
    test(`${lang} - home page`, async ({ page }) => {
      await page.goto(`/${lang}/`);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`home-${lang}.png`, { fullPage: true });
    });

    test(`${lang} - categories`, async ({ page }) => {
      await page.goto(`/${lang}/categories`);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`categories-${lang}.png`, { fullPage: true });
    });
  }
});

// 色盲模式视觉回归
test.describe("Colorblind mode visual", () => {
  for (const mode of ["none", "protanopia", "deuteranopia"] as const) {
    test(`colorblind-${mode}`, async ({ page }) => {
      await page.goto("/categories");
      await page.waitForLoadState("networkidle");
      
      // 通过 localStorage 设置色盲模式（避免 UI 交互抖动）
      await page.evaluate((m) => localStorage.setItem("boxgoods-colorblind-mode", m), mode);
      await page.reload();
      await page.waitForLoadState("networkidle");
      
      await expect(page).toHaveScreenshot(`categories-colorblind-${mode}.png`, { fullPage: true });
    });
  }
});