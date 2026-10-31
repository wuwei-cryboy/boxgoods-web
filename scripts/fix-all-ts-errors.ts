/**
 * 批量修复 TypeScript 错误的脚本
 * 一次性修复所有类型错误
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
  if (/\bgetCategories\(\)/g.test(newContent)) {
    newContent = newContent.replace(/\bgetCategories\(\)/g, 'await getCategories()');
    fixes.push('getCategories() -> await getCategories()');
  }

  // 3. getProductsByCat() -> await getProductsByCat()
  const getProductsByCatRegex = /\bgetProductsByCat\(\)/g;
  if (getProductsByCatRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetProductsByCat\(\)/g, 'await getProductsByCat()');
    fixes.push('getProductsByCat() -> await getProductsByCat()');
  }

  // 8. getSupplier() -> await getSupplier()
  const getSupplierRegex = /\bgetSupplier\(\)/g;
  if (getSupplierRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetSupplier\(\)/g, 'await getSupplier()');
    fixes.push('getSupplier() -> await getSupplier()');
  }

  // 9. getProduct() -> await getProduct()
  const getProductRegex = /\bgetProduct\(\)/g;
  if (getProductRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetProduct\(\)/g, 'await getProduct()');
    fixes.push('getProduct() -> await getProduct()');
  }

  // 9. getCategories() -> await getCategories()
  const getCategoriesRegex = /\bgetCategories\(\)/g;
  if (getCategoriesRegex.test(newContent)) {
    newContent = newContent.replace(/\bgetCategories\(\)/g, 'await getCategories()');
    fixes.push('getCategories() -> await getCategories()');
  }

  // 8. getProductsPaginated(...) -> await getProductsPaginated(...)
  const getProductsPaginatedRegex = /\bgetProductsPaginated\(/g;
  if (getProductsPaginatedRegex.test(newContent)) {
    newContent = newContent.replace(/getProductsPaginated\(/g, 'await getProductsPaginated(');
    fixes.push('getProductsPaginated -> await getProductsPaginated');
  }

  // 9. data?.id -> data?.data?.id (Supabase 响应结构)
  if (/\.data\?\.id/g.test(newContent)) {
    newContent = newContent.replace(/\.data\?\.id/g, 'data?.data?.id');
    fixes.push('data?.id -> data?.data?.id');
  }

  // 10. data?.id -> data?.data?.id (Supabase 响应结构)
  const dataIdRegex = /\bdata\?\.id\b/g;
  if (dataIdRegex.test(newContent)) {
    newContent = newContent.replace(/\bdata\?\.id\b/g, 'data?.data?.id');
    fixes.push('data?.id -> data?.data?.id');
  }

  // 11. 修复 withSupabase 回调 - 确保查询被执行
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

  // 13. Fix data?.id -> data?.data?.id (Supabase 响应结构)
  const dataIdRegex = /\bdata\?\.id\b/g;
  if (dataIdRegex.test(newContent)) {
    newContent = newContent.replace(/\bdata\?\.id\b/g, 'data?.data?.id');
    fixes.push('data?.id -> data?.data?.id');
  }

  // 13b. Fix data?.id in component props
  const dataIdRegex2 = /supplierName=\{sup\?\.name \?\? "BoxGoods"\}/g;
  if (supplierNameRegex.test(newContent)) {
    newContent = newContent.replace(
      /supplierName=\{sup\?\.name \?\? "BoxGoods"\}/g,
      'supplierName={sup?.name ?? "BoxGoods"}'
    );
    fixes.push('supplierName type fix');
  }

  // 15. Fix sup?.name ?? "BoxGoods" -> (sup?.name ?? "BoxGoods") as string
  const supplierNameRegex = /supplierName=\{sup\?\.name \?\? "BoxGoods"\}/g;
  if (supplierNameRegex.test(newContent)) {
    newContent = newContent.replace(
      /supplierName=\{sup\?\.name \?\? "BoxGoods"\}/g,
      'supplierName={(sup?.name ?? "BoxGoods") as string}'
    );
    fixes.push('supplierName type assertion');
  }

  // 15b. Fix sup?.name ?? "BoxGoods" -> sup?.name ?? "BoxGoods" (but with type assertion)
  const supplierNameRegex2 = /supplierName=\{sup\?\.name \?\? "BoxGoods"\}/g;
  if (supplierNameRegex2.test(newContent)) {
    newContent = newContent.replace(
      /supplierName=\{sup\?\.name \?\? "BoxGoods"\}/g,
      'supplierName={(sup?.name ?? "BoxGoods") as string}'
    );
    fixes.push('supplierName type assertion');
  }

  // 17. Fix supplierNameValue = sup?.name ?? "BoxGoods" -> const supplierNameValue = sup?.name ?? "BoxGoods" as string
  const supplierNameValueRegex = /const supplierNameValue = sup\?\.name \?\? "BoxGoods";/g;
  if (supplierNameValueRegex.test(newContent)) {
    newContent = newContent.replace(
      /const supplierNameValue = sup\?\.name \?\? "BoxGoods";/g,
      'const supplierNameValue = (sup?.name ?? "BoxGoods") as string;'
    );
    fixes.push('supplierNameValue type assertion');
  }

  // 18. Fix sup?.name ?? "BoxGoods" -> sup?.name ?? "BoxGoods" (with type assertion)
  const supplierNameUsageRegex = /supplierName=\{sup\?\.name \?\? "BoxGoods"\}/g;
  if (supplierNameUsageRegex.test(newContent)) {
    newContent = newContent.replace(
      /supplierName=\{sup\?\.name \?\? "BoxGoods"\}/g,
      'supplierName={(sup?.name ?? "BoxGoods") as string}'
    );
    fixes.push('supplierName type assertion in JSX');
  }

  // 18b. Fix sup?.name ?? "BoxGoods" -> (sup?.name ?? "BoxGoods") as string
  const supplierNameUsageRegex2 = /supplierName=\{sup\?\.name \?\? "BoxGoods"\}/g;
  if (supplierNameUsageRegex2.test(newContent)) {
    newContent = newContent.replace(
      /supplierName=\{sup\?\.name \?\? "BoxGoods"\}/g,
      'supplierName={(sup?.name ?? "BoxGoods") as string}'
    );
    fixes.push('supplierName type assertion in JSX');
  }

  // 19. Fix sup?.name ?? "BoxGoods" in JSX
  const supplierNameJSXRegex = /supplierName=\{sup\?\.name \?\? "BoxGoods"\}/g;
  if (supplierNameUsageRegex.test(newContent)) {
    newContent = newContent.replace(
      /supplierName=\{sup\?\.name \?\? "BoxGoods"\}/g,
      'supplierName={(sup?.name ?? "BoxGoods") as string}'
    );
    fixes.push('supplierName type assertion in JSX');
  }

  // 20. Fix supplierNameValue = sup?.name ?? "BoxGoods" -> const supplierNameValue = (sup?.name ?? "BoxGoods") as string
  const supplierNameValueRegex = /const supplierNameValue = sup\?\.name \?\? "BoxGoods";/g;
  if (supplierNameValueRegex.test(newContent)) {
    newContent = newContent.replace(
      /const supplierNameValue = sup\?\.name \?\? "BoxGoods";/g,
      'const supplierNameValue = (sup?.name ?? "BoxGoods") as string;'
    );
    fixes.push('supplierNameValue type assertion');
  }

  // 22. Fix sup?.name ?? "BoxGoods" -> sup?.name ?? "BoxGoods" (with type assertion)
  const supplierNameUsageRegex = /supplierName=\{sup\?\.name \?\? "BoxGoods"\}/g;
  if (supplierNameUsageRegex.test(newContent)) {
    newContent = newContent.replace(
      /supplierName=\{sup\?\.name \?\? "BoxGoods"\}/g,
      'supplierName={(sup?.name ?? "BoxGoods") as string}'
    );
    fixes.push('supplierName type assertion in JSX');
  }

  // 22. Fix supplierNameValue = sup?.name ?? "BoxGoods" -> const supplierNameValue = (sup?.name ?? "BoxGoods") as string
  const supplierNameValueRegex2 = /const supplierNameValue = sup\?\.name \?\? "BoxGoods";/g;
  if (supplierNameValueRegex.test(newContent)) {
    newContent = newContent.replace(
      /const supplierNameValue = sup\?\.name \?\? "BoxGoods";/g,
      'const supplierNameValue = (sup?.name ?? "BoxGoods") as string;'
    );
    fixes.push('supplierNameValue type assertion');
  }

  // 23. Fix supplierName = sup?.name ?? "BoxGoods" -> const supplierName = (sup?.name ?? "BoxGoods") as string
  const supplierNameAssignRegex = /const supplierName = sup\?\.name \?\? "BoxGoods";/g;
  if (supplierNameAssignRegex.test(newContent)) {
    newContent = newContent.replace(
      /const supplierName = sup\?\.name \?\? "BoxGoods";/g,
      'const supplierName = (sup?.name ?? "BoxGoods") as string;'
    );
    fixes.push('supplierName type assertion');
  }

  // 25. Fix sup?.name ?? "BoxGoods" -> sup?.name ?? "BoxGoods" (with type assertion in JSX)
  const supplierNameJSXRegex = /supplierName=\{sup\?\.name \?\? "BoxGoods"\}/g;
  if (supplierNameUsageRegex.test(newContent)) {
    newContent = newContent.replace(
      /supplierName=\{sup\?\.name \?\? "BoxGoods"\}/g,
      'supplierName={(sup?.name ?? "BoxGoods") as string}'
    );
    fixes.push('supplierName type assertion in JSX');
  }

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return { file: filePath, fixes, success: true };
  }

  return { file: filePath, fixes: [], success: false };
}

function main() {
  console.log('🔧 开始批量修复 TypeScript 错误...\n');

  const ROOT = process.cwd();
  const patterns = [
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
      console.log(`✅ ${path.relative(process.cwd(), file)}`);
      result.fixes.forEach(fix => console.log(`  ✓ ${fix}`));
    } else if (result.success) {
      console.log(`⏭️  ${path.relative(process.cwd(), file)} (无需修复)`);
    } else {
      console.log(`❌ ${path.relative(ROOT, file)} 修复失败`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ 完成！共修复 ${totalFixed} 处错误，涉及 ${totalFiles} 个文件`);
  console.log('\n📋 修复摘要:');
  console.log('  1. openGraph type: "product" -> "website"');
  console.log('  2. 所有异步函数调用添加 await');
  console.log('  3. data?.id -> data?.data?.id (Supabase 响应结构)');
  console.log('  5. withSupabase 回调中执行查询');
  console.log('  6. 同步函数调用改为 await 异步版本');
  console.log('\n🚀 完成！请运行 git diff 查看变更，然后提交推送。');
}

main();