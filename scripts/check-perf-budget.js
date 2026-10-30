// scripts/check-perf-budget.js
// 性能预算检查脚本：读取 webpack bundle 分析产物 + Lighthouse CI 报告
// 对比 performance-budget.json 阈值，超标则 exit 1

import fs from "fs";
import path from "path";

const BUDGET_FILE = path.resolve("performance-budget.json");
const BUNDLE_REPORT_DIR = path.resolve(".next/analyze");
const LHCI_REPORT_DIR = path.resolve(".lighthouseci");

function loadBudget() {
  return JSON.parse(fs.readFileSync(BUDGET_FILE, "utf-8"));
}

function checkBundleBudget(budget) {
  console.log("\n📦 Checking Bundle Budget...\n");
  
  const reportFiles = fs.readdirSync(BUNDLE_REPORT_DIR).filter(f => f.endsWith(".json"));
  if (reportFiles.length === 0) {
    console.warn("⚠️  No bundle analysis reports found. Run `npm run bundle:analyze` first.");
    return { passed: true, issues: [] };
  }

  let hasError = false;
  const issues: string[] = [];

  for (const file of reportFiles) {
    const report = JSON.parse(fs.readFileSync(path.join(BUNDLE_REPORT_DIR, file), "utf-8"));
    const routeName = file.replace(".json", "") || "total";
    
    // 解析 bundle 大小
    const assets = report.assets || [];
    let totalJs = 0, totalCss = 0, totalImages = 0, totalFonts = 0, totalOther = 0;
    
    for (const asset of assets) {
      const size = asset.size || 0;
      if (asset.name.endsWith(".js")) totalJs += size;
      else if (asset.name.endsWith(".css")) totalCss += size;
      else if (/\.(png|jpg|jpeg|webp|avif|svg|gif)$/i.test(asset.name)) totalImages += size;
      else if (/\.(woff|woff2|ttf|eot)$/i.test(asset.name)) totalFonts += size;
      else totalOther += size;
    }

    const routeBudget = budget.budget.perRoute[routeName] || budget.budget.total;
    
    const checks = [
      { name: "JS", actual: totalJs, budget: parseSize(routeBudget.js), unit: "KB" },
      { name: "CSS", actual: totalCss, budget: parseSize(routeBudget.css), unit: "KB" },
      { name: "Images", actual: totalImages, budget: parseSize(routeBudget.images), unit: "KB" },
      { name: "Total", actual: totalJs + totalCss + totalImages + totalFonts + totalOther, budget: parseSize(routeBudget.total), unit: "KB" },
    ];

    for (const check of checks) {
      const actualKB = (check.actual / 1024).toFixed(1);
      const budgetKB = (check.budget / 1024).toFixed(1);
      const pct = ((check.actual / check.budget) * 100).toFixed(1);
      
      if (check.actual > check.budget) {
        console.error(`❌ ${routeName} ${check.name}: ${actualKB} KB > ${budgetKB} KB (${pct}%)`);
        issues.push(`${routeName} ${check.name}: ${actualKB} KB > budget ${budgetKB} KB`);
        hasError = true;
      } else {
        console.log(`✅ ${routeName} ${check.name}: ${actualKB} KB / ${budgetKB} KB (${pct}%)`);
      }
    }
  }

  return { passed: !hasError, issues };
}

function checkLighthouseBudget(budget) {
  console.log("\n🔦 Checking Lighthouse Budget...\n");
  
  const reportFiles = fs.readdirSync(LHCI_REPORT_DIR).filter(f => f.endsWith(".json"));
  if (reportFiles.length === 0) {
    console.warn("⚠️  No Lighthouse CI reports found. Run `npm run lhci` first.");
    return { passed: true, issues: [] };
  }

  let hasError = false;
  const issues: string[] = [];
  const lhBudget = budget.budget.lighthouse;

  for (const file of reportFiles) {
    const report = JSON.parse(fs.readFileSync(path.join(LHCI_REPORT_DIR, file), "utf-8"));
    const url = report.finalUrl || "unknown";
    
    const categories = report.categories || {};
    const audits = report.audits || {};

    // Category scores
    const catChecks = [
      { key: "performance", label: "Performance", min: lhBudget.performance },
      { key: "accessibility", label: "Accessibility", min: lhBudget.accessibility },
      { key: "best-practices", label: "Best Practices", min: lhBudget.bestPractices },
      { key: "seo", label: "SEO", min: lhBudget.seo },
      { key: "pwa", label: "PWA", min: lhBudget.pwa },
    ];

    for (const cat of catChecks) {
      const score = categories[cat.key]?.score ?? 0;
      const threshold = cat.min / 100;
      if (score < threshold) {
        console.error(`❌ ${url} ${cat.label}: ${(score * 100).toFixed(0)} < ${cat.min}`);
        issues.push(`${url} ${cat.label}: ${(score * 100).toFixed(0)} < ${cat.min}`);
        hasError = true;
      } else {
        console.log(`✅ ${url} ${cat.label}: ${(score * 100).toFixed(0)} ≥ ${cat.min}`);
      }
    }

    // Core Web Vitals
    const cwvChecks = [
      { key: "first-contentful-paint", label: "FCP", maxMs: 1800 },
      { key: "largest-contentful-paint", label: "LCP", maxMs: 2500 },
      { key: "cumulative-layout-shift", label: "CLS", maxScore: 0.1 },
      { key: "total-blocking-time", label: "TBT", maxMs: 200 },
    ];

    for (const cwv of cwvChecks) {
      const audit = audits[cwv.key];
      if (!audit) continue;
      
      const value = audit.numericValue;
      const isScore = cwv.key === "cumulative-layout-shift";
      
      if (isScore) {
        if (value > cwv.maxScore) {
          console.error(`❌ ${url} ${cwv.label}: ${value.toFixed(3)} > ${cwv.maxScore}`);
          issues.push(`${url} ${cwv.label}: ${value.toFixed(3)} > ${cwv.maxScore}`);
          hasError = true;
        } else {
          console.log(`✅ ${url} ${cwv.label}: ${value.toFixed(3)} ≤ ${cwv.maxScore}`);
        }
      } else {
        if (value > cwv.maxMs) {
          console.error(`❌ ${url} ${cwv.label}: ${Math.round(value)}ms > ${cwv.maxMs}ms`);
          issues.push(`${url} ${cwv.label}: ${Math.round(value)}ms > ${cwv.maxMs}ms`);
          hasError = true;
        } else {
          console.log(`✅ ${url} ${cwv.label}: ${Math.round(value)}ms ≤ ${cwv.maxMs}ms`);
        }
      }
    }
  }

  return { passed: !hasError, issues };
}

function parseSize(str: string): number {
  const match = str.match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)$/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === "KB") return val * 1024;
  if (unit === "MB") return val * 1024 * 1024;
  if (unit === "GB") return val * 1024 * 1024 * 1024;
  return val;
}

async function main() {
  console.log("🎯 Performance Budget Check\n");
  
  if (!fs.existsSync(BUDGET_FILE)) {
    console.error("❌ performance-budget.json not found");
    process.exit(1);
  }

  const budget = loadBudget();
  let allPassed = true;
  const allIssues: string[] = [];

  // 1. Bundle 预算
  if (fs.existsSync(BUNDLE_REPORT_DIR)) {
    const result = checkBundleBudget(budget);
    if (!result.passed) allPassed = false;
    allIssues.push(...result.issues);
  } else {
    console.log("\n📦 Bundle analysis skipped (run `npm run bundle:analyze` to enable)");
  }

  // 2. Lighthouse 预算
  if (fs.existsSync(LHCI_REPORT_DIR)) {
    const result = checkLighthouseBudget(budget);
    if (!result.passed) allPassed = false;
    allIssues.push(...result.issues);
  } else {
    console.log("\n🔦 Lighthouse CI skipped (run `npm run lhci` to enable)");
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  if (allPassed) {
    console.log("🎉 All performance budgets passed!");
    process.exit(0);
  } else {
    console.error(`\n💥 ${allIssues.length} budget violation(s):`);
    allIssues.forEach(i => console.error(`  - ${i}`));
    console.log("\n💡 Tips:");
    console.log("  - Run `npm run bundle:analyze` to visualize bundle composition");
    console.log("  - Enable code splitting: `next/dynamic` for heavy components");
    console.log("  - Optimize images: `next/image` with proper sizes");
    console.log("  - Remove unused dependencies: `npm ls` + `bundle:analyze`");
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Script error:", err);
  process.exit(1);
});