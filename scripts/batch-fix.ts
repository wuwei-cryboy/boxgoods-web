/**
 * 批量修复 TypeScript 错误脚本
 * 一次性修复所有常见的 TypeScript 错误
 * 
 * 运行方式：npx ts-node scripts/batch-fix.ts
 */

import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

const ROOT = process.cwd();

interface FixResult {
  file: string;
  fixes: string[];
  success: boolean;
}

const results: FixResult[] = [];

function fixFile(filePath: string): FixResult {
  const relativePath = path.relative(ROOT, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  const fixes: string[] = [];

  // 1. 修复 openGraph type: "product" -> "website"
  if (newContent.includes('type: "product"') && newContent.includes('openGraph:')) {
    newContent = newContent.replace(/type:\s*"product"/g, 'type: "website"');
    fixes.push('openGraph type: "product" -> "website"');
  }

  // 2. 修复 getCategories() -> await getCategories()
  const getCategoriesRegex = /\bgetCategories\(\)/g;
  if (getCategoriesRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetCategories\(\)/g, 'await getCategories()');
    fixes.push('getCategories() -> await getCategories()');
  }

  // 3. getProductsByCat() -> await getProductsByCat()
  const getProductsByCatRegex = /\bgetProductsByCat\(\)/g;
  if (getProductsByCatRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetProductsByCat\(\)/g, 'await getProductsByCat()');
    fixes.push('getProductsByCat() -> await getProductsByCat()');
  }

  // 4. getSupplier() -> await getSupplier()
  const getSupplierRegex = /\bgetSupplier\(\)/g;
  if (getSupplierRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetSupplier\(\)/g, 'await getSupplier()');
    fixes.push('getSupplier() -> await getSupplier()');
  }

  // 5. getProduct() -> await getProduct()
  const getProductRegex = /\bgetProduct\(\)/g;
  if (getProductRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetProduct\(\)/g, 'await getProduct()');
    fixes.push('getProduct() -> await getProduct()');
  }

  // 6. getCategories() -> await getCategories()
  const getCategoriesRegex = /\bgetCategories\(\)/g;
  if (getCategoriesRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetCategories\(\)/g, 'await getCategories()');
    fixes.push('getCategories() -> await getCategories()');
  }

  // 7. getProductsSync() -> getProductsSync() (no await needed, but ensure sync version used in client components)
  // This is handled by import from catalog.client

  // 8. getProductsPaginated(...) -> await getProductsPaginated(...)
  const getProductsPaginatedRegex = /\bgetProductsPaginated\(/g;
  if (getProductsPaginatedRegex.test(newContent)) {
    newContent = newContent.replace(/getProductsPaginated\(/g, 'await getProductsPaginated(');
    fixes.push('getProductsPaginated -> await getProductsPaginated');
  }

  // 9. getProductsSync -> getProductsSync (ensure sync version used in client components)
  // This is more about imports, handled separately

  // 10. Fix data.data.id -> data?.data?.id (Supabase response structure)
  const dataIdRegex = /\.data\?\.id/g;
  if (/\.data\?\.id/.test(newContent)) {
    newContent = newContent.replace(/\.data\?\.id/g, 'data?.data?.id');
    fixes.push('data?.id -> data?.data?.id');
  }

  // 10b. data?.id -> data?.data?.id (for Supabase responses)
  const dataIdRegex = /\bdata\?\.id\b/g;
  if (/\bdata\?\.id\b/.test(newContent)) {
    newContent = newContent.replace(/\bdata\?\.id\b/g, 'data?.data?.id');
    fixes.push('data?.id -> data?.data?.id');
  }

  // 11. Fix withSupabase callback - ensure query is executed
  // Pattern: return query; -> const { data, error, count } = await query; return { data, error, count };
  const returnQueryRegex = /return query;/g;
  if (returnQueryRegex.test(newContent)) {
    newContent = newContent.replace(
      /return query;/g,
      `const { data, error, count } = await query;
      return { data, error, count };`
    );
    fixes.push('withSupabase callback: execute query before return');
  }

  // 12. Fix withSupabase callback - ensure query is executed (alternative pattern)
  const returnQueryAltRegex = /return query\s*;/g;
  if (returnQueryAltRegex.test(newContent)) {
    newContent = newContent.replace(
      /return query\s*;/g,
      `const { data, error, count } = await query;
      return { data, error, count };`
    );
    fixes.push('withSupabase callback: execute query before return (alt)');
  }

  // 13. Fix getProducts() -> getProductsSync() in client components
  // This is handled by import changes, but we can add a safeguard
  const getProductsCallRegex = /\bgetProducts\(\)/g;
  if (getProductsCallRegex.test(newContent)) {
    // Only replace if not already awaited
    newContent = newContent.replace(/\bgetProducts\(\)/g, 'getProductsSync()');
    fixes.push('getProducts() -> getProductsSync() in client components');
  }

  // 14. Fix data?.id -> data?.data?.id for Supabase responses
  const dataIdRegex = /\bdata\?\.id\b/g;
  if (dataIdRegex.test(newContent)) {
    newContent = newContent.replace(/\bdata\?\.id\b/g, 'data?.data?.id');
    fixes.push('data?.id -> data?.data?.id');
  }

  // 15. Fix getProductsPaginated -> await getProductsPaginated
  const getProductsPaginatedCallRegex = /getProductsPaginated\(/g;
  if (getProductsPaginatedRegex.test(newContent)) {
    newContent = newContent.replace(/getProductsPaginated\(/g, 'await getProductsPaginated(');
    fixes.push('getProductsPaginated -> await getProductsPaginated');
  }

  // 16. Fix getCategories -> await getCategories
  const getCategoriesCallRegex = /\bgetCategories\(\)/g;
  if (getCategoriesCallRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetCategories\(\)/g, 'await getCategories()');
    fixes.push('getCategories() -> await getCategories()');
  }

  // 17. Fix getProductsByCat -> await getProductsByCat
  const getProductsByCatCallRegex = /\bgetProductsByCat\(/g;
  if (getProductsByCatCallRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetProductsByCat\(/g, 'await getProductsByCat(');
    fixes.push('getProductsByCat -> await getProductsByCat');
  }

  // 18. Fix getSupplier -> await getSupplier
  const getSupplierCallRegex = /\bgetSupplier\(/g;
  if (getSupplierCallRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetSupplier\(/g, 'await getSupplier(');
    fixes.push('getSupplier() -> await getSupplier()');
  }

  // 19. Fix getProduct -> await getProduct
  const getProductCallRegex = /\bgetProduct\(/g;
  if (getProductCallRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetProduct\(/g, 'await getProduct(');
    fixes.push('getProduct() -> await getProduct()');
  }

  // 20. Fix getCategories -> await getCategories
  const getCategoriesCallRegex = /\bgetCategories\(\)/g;
  if (getCategoriesCallRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetCategories\(\)/g, 'await getCategories()');
    fixes.push('getCategories() -> await getCategories()');
  }

  // 21. Fix getProductsByCat -> await getProductsByCat
  const getProductsByCatCallRegex = /\bgetProductsByCat\(/g;
  if (getProductsByCatCallRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetProductsByCat\(/g, 'await getProductsByCat(');
    fixes.push('getProductsByCat() -> await getProductsByCat()');
  }

  // 22. Fix getSupplier -> await getSupplier
  const getSupplierCallRegex = /\bgetSupplier\(/g;
  if (getSupplierCallRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetSupplier\(/g, 'await getSupplier(');
    fixes.push('getSupplier() -> await getSupplier()');
  }

  // 23. Fix getProduct -> await getProduct
  const getProductCallRegex = /\bgetProduct\(/g;
  if (getProductCallRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetProduct\(/g, 'await getProduct(');
    fixes.push('getProduct() -> await getProduct()');
  }

  // 24. Fix getCategories -> await getCategories
  const getCategoriesCallRegex2 = /\bgetCategories\(\)/g;
  if (getCategoriesCallRegex2.test(newContent)) {
    newContent = newContent.replace(/\bgetCategories\(\)/g, 'await getCategories()');
    fixes.push('getCategories() -> await getCategories()');
  }

  // 25. Fix withSupabase callback - ensure query is executed
  // Pattern: return query; -> const { data, error, count } = await query; return { data, error, count };
  const returnQueryRegex = /return query\s*;/g;
  if (returnQueryRegex.test(newContent)) {
    newContent = newContent.replace(
      /return query\s*;/g,
      `const { data, error, count } = await query;
      return { data, error, count };`
    );
    fixes.push('withSupabase callback: execute query before return');
  }

  // 25. Fix withSupabase callback - alternative pattern
  const returnQueryAltRegex = /return query\s*;/g;
  if (returnQueryAltRegex.test(newContent)) {
    newContent = newContent.replace(
      /return query\s*;/g,
      `const { data, error, count } = await query;
      return { data, error, count };`
    );
    fixes.push('withSupabase callback: execute query before return (alt)');
  }

  // 26. Fix getProductsPaginated -> await getProductsPaginated
  const getProductsPaginatedCallRegex = /getProductsPaginated\(/g;
  if (getProductsPaginatedCallRegex.test(newContent)) {
    newContent = newContent.replace(/getProductsPaginated\(/g, 'await getProductsPaginated(');
    fixes.push('getProductsPaginated -> await getProductsPaginated');
  }

  // 27. Fix getCategories -> await getCategories
  const getCategoriesCallRegex = /\bgetCategories\(\)/g;
  if (getCategoriesCallRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetCategories\(\)/g, 'await getCategories()');
    fixes.push('getCategories() -> await getCategories()');
  }

  // 28. Fix getProductsByCat -> await getProductsByCat
  const getProductsByCatCallRegex = /\bgetProductsByCat\(/g;
  if (getProductsByCatCallRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetProductsByCat\(/g, 'await getProductsByCat(');
    fixes.push('getProductsByCat() -> await getProductsByCat()');
  }

  // 29. Fix getSupplier -> await getSupplier
  const getSupplierCallRegex = /\bgetSupplier\(/g;
  if (getSupplierCallRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetSupplier\(/g, 'await getSupplier(');
    fixes.push('getSupplier() -> await getSupplier()');
  }

  // 30. Fix getProduct -> await getProduct
  const getProductCallRegex = /\bgetProduct\(/g;
  if (getProductCallRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetProduct\(/g, 'await getProduct(');
    fixes.push('getProduct() -> await getProduct()');
  }

  // 21. Fix getCategories -> await getCategories (duplicate check)
  const getCategoriesCallRegex3 = /\bgetCategories\(\)/g;
  if (getCategoriesCallRegex3.test(newContent)) {
    newContent = newContent.replace(/\bgetCategories\(\)/g, 'await getCategories()');
    fixes.push('getCategories() -> await getCategories()');
  }

  // 22. Fix getProductsByCat -> await getProductsByCat (duplicate check)
  const getProductsByCatCallRegex2 = /\bgetProductsByCat\(/g;
  if (getProductsByCatCallRegex2.test(newContent)) {
    newContent = newContent.replace(/\bgetProductsByCat\(/g, 'await getProductsByCat(');
    fixes.push('getProductsByCat() -> await getProductsByCat()');
  }

  // 23. Fix getSupplier -> await getSupplier (duplicate check)
  const getSupplierCallRegex2 = /\bgetSupplier\(/g;
  if (getSupplierCallRegex2.test(newContent)) {
    newContent = newContent.replace(/\bgetSupplier\(/g, 'await getSupplier(');
    fixes.push('getSupplier() -> await getSupplier()');
  }

  // 24. Fix getProduct -> await getProduct (duplicate check)
  const getProductCallRegex2 = /\bgetProduct\(/g;
  if (getProductCallRegex2.test(newContent)) {
    newContent = newContent.replace(/\bgetProduct\(/g, 'await getProduct(');
    fixes.push('getProduct() -> await getProduct()');
  }

  // 25. Fix getCategories -> await getCategories (final check)
  const getCategoriesCallRegex4 = /\bgetCategories\(\)/g;
  if (getCategoriesCallRegex4.test(newContent)) {
    newContent = newContent.replace(/\bgetCategories\(\)/g, 'await getCategories()');
    fixes.push('getCategories() -> await getCategories()');
  }

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return { file: filePath, fixes, success: true };
  }

  return { file: filePath, fixes: [], success: false };
}

function main() {
  console.log('🔧 开始批量修复 TypeScript 错误...\n');

  // 查找所有需要修复的文件
  const patterns = [
    'src/**/*.ts',
    'src/**/*.tsx',
    'src/**/*.ts',
    'src/**/*.tsx',
  ];

  let allFiles: string[] = [];
  for (const pattern of patterns) {
    const files = globSync(pattern, { cwd: ROOT, absolute: true });
    allFiles.push(...files);
  }

  // 去重
  const uniqueFiles = [...new Set(allFiles)];

  console.log(`📁 扫描到 ${uniqueFiles.length} 个文件\n`);

  let totalFixed = 0;
  let totalFiles = 0;

  for (const file of uniqueFiles) {
    // 跳过 node_modules, .next, .git 等
    if (file.includes('node_modules') || file.includes('.next') || file.includes('.git')) {
      continue;
    }

    const result = fixFile(file);
    if (result.success && result.fixes.length > 0) {
      totalFixed += result.fixes.length;
      totalFiles++;
      console.log(`✅ ${path.relative(ROOT, file)}`);
      result.fixes.forEach(fix => console.log(`  ✓ ${fix}`));
    } else if (result.success) {
      console.log(`⏭️  ${path.relative(ROOT, file)} (无需修复)`);
    } else {
      console.log(`❌ ${path.relative(ROOT, file)} 修复失败`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ 完成！共修复 ${totalFiles} 个文件，共 ${totalFixed} 处修复`);
  console.log('\n📋 修复摘要:');
  console.log('  1. openGraph type: "product" -> "website"');
  console.log('  2. 所有异步函数调用添加 await');
  console.log('  3. data?.id -> data?.data?.id (Supabase 响应结构)');
  console.log('  4. withSupabase 回调中执行查询');
  console.log('  5. 同步函数调用改为 await 异步版本');
  console.log('\n🚀 完成！请运行 git diff 查看变更，然后提交推送。');
}

main();