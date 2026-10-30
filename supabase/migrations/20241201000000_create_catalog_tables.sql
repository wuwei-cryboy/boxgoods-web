-- supabase/migrations/20241201000000_create_catalog_tables.sql
-- 目录数据迁移：从本地 JSON 到 Supabase PostgreSQL

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. 分类表
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,              -- 如 "parfums", "telephones"
  name_fr TEXT NOT NULL,            -- 法语名称
  name_zh TEXT NOT NULL,            -- 中文名称
  icon_svg TEXT,                    -- SVG 图标
  sort_order INTEGER DEFAULT 0,     -- 排序
  is_active BOOLEAN DEFAULT TRUE,   -- 是否启用
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. 供应商表
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,              -- 如 "s1", "s2"
  name TEXT NOT NULL,               -- 供应商名称
  country TEXT,                     -- 国家
  whatsapp TEXT,                    -- WhatsApp
  phone TEXT,                       -- 电话
  email TEXT,                       -- 邮箱
  address TEXT,                     -- 地址
  warehouse TEXT,                   -- 仓库/发货地
  license_no TEXT,                  -- 营业执照号
  tag TEXT,                         -- 标签（如 "Mobiles & Kits"）
  icon_svg TEXT,                    -- SVG 图标
  intro TEXT,                       -- 简介
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 供应商-分类多对多关联
CREATE TABLE IF NOT EXISTS supplier_categories (
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (supplier_id, category_id)
);

-- ============================================================
-- 3. 产品表
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,              -- 如 "iphone-15-kit"
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  image_url TEXT,                   -- 主图 URL
  name_fr TEXT NOT NULL,            -- 法语名称
  name_zh TEXT NOT NULL,            -- 中文名称
  price_min NUMERIC(12,2),          -- 最低价
  price_max NUMERIC(12,2),          -- 最高价
  currency TEXT DEFAULT 'USD',      -- 货币
  moq INTEGER,                      -- 最小起订量
  box_spec TEXT,                    -- 箱规描述
  detail_images JSONB DEFAULT '[]'::jsonb,  -- 详情图数组
  specs JSONB DEFAULT '[]'::jsonb,          -- 规格表 [[key, value], ...]
  selling_point TEXT,               -- 卖点
  sort_order INTEGER DEFAULT 0,     -- 排序
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 产品索引
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price_min);

-- ============================================================
-- 4. 产品变体表（颜色/规格/型号等）
-- ============================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_type TEXT NOT NULL,       -- "color" | "memory" | "model" | "spec"
  label TEXT NOT NULL,              -- 显示标签
  image_url TEXT,                   -- 变体图片
  price NUMERIC(12,2),              -- 该变体价格（可选，覆盖产品价格）
  attributes JSONB DEFAULT '{}'::jsonb, -- 扩展属性
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_type ON product_variants(variant_type);

-- ============================================================
-- 5. 国际化翻译表
-- ============================================================
CREATE TABLE IF NOT EXISTS i18n_keys (
  key TEXT PRIMARY KEY,             -- 翻译键
  fr TEXT,                          -- 法语
  zh TEXT,                          -- 中文
  context TEXT,                     -- 上下文说明
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. 更新 updated_at 触发器
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_i18n_keys_updated_at ON i18n_keys;
CREATE TRIGGER update_i18n_keys_updated_at BEFORE UPDATE ON i18n_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. RLS 策略（开发环境暂时开放，生产需收紧）
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE i18n_keys ENABLE ROW LEVEL SECURITY;

-- 允许所有已认证用户读取（生产环境按需收紧）
CREATE POLICY "Allow authenticated read" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON supplier_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON product_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON i18n_keys FOR SELECT TO authenticated USING (true);

-- 匿名用户也可读取（用于公开目录页）
CREATE POLICY "Allow anon read" ON categories FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Allow anon read" ON suppliers FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Allow anon read" ON products FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Allow anon read" ON product_variants FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Allow anon read" ON i18n_keys FOR SELECT TO anon USING (true);

-- ============================================================
-- 8. 视图：产品完整信息（含分类、供应商、变体聚合）
-- ============================================================
CREATE OR REPLACE VIEW v_products_full AS
SELECT 
  p.*,
  c.name_fr AS category_name_fr,
  c.name_zh AS category_name_zh,
  c.icon_svg AS category_icon,
  s.name AS supplier_name,
  s.whatsapp AS supplier_whatsapp,
  s.email AS supplier_email,
  s.address AS supplier_address,
  jsonb_agg(
    jsonb_build_object(
      'id', v.id,
      'type', v.variant_type,
      'label', v.label,
      'image', v.image_url,
      'price', v.price,
      'attributes', v.attributes
    ) ORDER BY v.sort_order
  ) FILTER (WHERE v.id IS NOT NULL) AS variants
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_active = true
GROUP BY p.id, c.id, s.id;