/**
 * 迁移脚本：将 public/img/ 图片上传到 Supabase Storage，并更新 catalog.json 路径
 * 
 * 使用前准备：
 * 1. 安装依赖: npm install @supabase/supabase-js dotenv
 * 2. 配置 .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * 3. 在 Supabase Dashboard 创建 public bucket: product-images
 * 4. 运行: node scripts/migrate-images-to-supabase.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 配置
const BUCKET = 'boxgoodss-picture';  // 你的 Supabase bucket 名称
const PUBLIC_DIR = path.join(__dirname, '..', 'src', 'public');  // 修正：图片在 src/public/
const CATALOG_PATH = 'src/lib/data/catalog.json';
const CATALOG_OUTPUT_PATH = 'src/lib/data/catalog.json'; // 直接覆盖，建议先备份

// 文件扩展名 -> Content-Type 映射
function getContentType(ext) {
  const types = {
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.avif': 'image/avif',
  };
  return types[ext.toLowerCase()] || 'application/octet-stream';
}

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color, msg) {
  console.log(`${color}${msg}${colors.reset}`);
}

async function main() {
  // 1. 检查环境变量
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    log('red', '❌ 缺少环境变量：请在 .env.local 配置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // 2. 读取 catalog.json
  log('blue', '📖 读取 catalog.json...');
  const catalogPath = path.join(__dirname, '..', CATALOG_PATH);
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

  // 3. 提取所有图片路径
  const images = new Set();
  
  function collectImages(obj) {
    if (typeof obj === 'string' && obj.startsWith('img/')) {
      images.add(obj);
    } else if (Array.isArray(obj)) {
      obj.forEach(collectImages);
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(collectImages);
    }
  }

  // 从 catalog 收集
  catalog.products.forEach(p => {
    if (p.image) images.add(p.image);
    if (p.variants) p.variants.forEach(v => v.img && images.add(v.img));
    if (p.detailImages) p.detailImages.forEach(img => images.add(img));
  });

  log('blue', `📸 发现 ${images.size} 个唯一图片路径`);

  // 4. 上传图片到 Supabase
  const urlMap = {}; // 原路径 -> 新 URL
  let uploaded = 0, skipped = 0, failed = 0;

  for (const imgPath of images) {
    const localPath = path.join(PUBLIC_DIR, imgPath);
    
    if (!fs.existsSync(localPath)) {
      log('yellow', `⚠️  本地文件不存在: ${imgPath}`);
      failed++;
      continue;
    }

    // 目标路径：去掉 "img/" 前缀
    const storagePath = imgPath.replace(/^img\//, '');
    const fileExt = path.extname(localPath);
    const contentType = getContentType(fileExt);

    try {
      // 检查是否已存在
      const { data: existing } = await supabase.storage
        .from(BUCKET)
        .list(path.dirname(storagePath), { search: path.basename(storagePath) });
      
      if (existing && existing.length > 0) {
        log('blue', `⏭️  已存在，跳过: ${storagePath}`);
        skipped++;
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}`;
        urlMap[`img/${storagePath}`] = publicUrl;
        continue;
      }

      // 上传
      const fileBuffer = fs.readFileSync(localPath);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}`;
      urlMap[`img/${storagePath}`] = publicUrl;
      uploaded++;
      log('green', `✅ 上传成功: ${storagePath}`);

    } catch (err) {
      log('red', `❌ 上传失败: ${storagePath} - ${err.message}`);
      failed++;
    }
  }

  // 5. 更新 catalog.json 路径
  log('blue', '🔄 更新 catalog.json 路径...');
  
  function replacePaths(obj) {
    if (typeof obj === 'string' && obj.startsWith('img/')) {
      return urlMap[obj] || obj; // 找不到映射则保留原路径
    } else if (Array.isArray(obj)) {
      return obj.map(replacePaths);
    } else if (obj && typeof obj === 'object') {
      const newObj = {};
      for (const [k, v] of Object.entries(obj)) {
        newObj[k] = replacePaths(v);
      }
      return newObj;
    }
    return obj;
  }

  const updatedCatalog = replacePaths(catalog);

  // 备份原文件
  const backupPath = CATALOG_PATH + '.backup.' + Date.now();
  fs.copyFileSync(CATALOG_PATH, backupPath);
  log('blue', `💾 已备份原文件: ${backupPath}`);

  // 写入新文件
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(updatedCatalog, null, 2));
  log('green', '✅ catalog.json 已更新');

  // 6. 统计报告
  console.log('\n' + '='.repeat(50));
  log('green', `✅ 迁移完成！`);
  console.log(`   上传成功: ${uploaded}`);
  console.log(`   跳过(已存在): ${skipped}`);
  console.log(`   失败: ${failed}`);
  console.log(`   总计处理: ${images.size}`);
  console.log(`\n📝 备份文件: ${path.basename(backupPath)}`);
  console.log(`📝 已更新: ${CATALOG_PATH}`);
  console.log('\n✅ 请运行 git diff 检查变更，然后提交推送触发 Vercel 部署');
}

main().catch(err => {
  log('red', `❌ 迁移失败: ${err.message}`);
  console.error(err);
  process.exit(1);
});