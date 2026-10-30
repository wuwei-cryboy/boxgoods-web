-- ============================================================
-- BoxGoods B2B 最小后端 Schema
-- 兼容 Supabase (PostgreSQL)；迁移到 Neon/PlanetScale/RDS 仅需微调类型
-- ============================================================

-- 1. 启用需要的扩展
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";      -- gen_random_uuid()

-- ============================================================
-- 2. 收藏表（用户-商品多对多）
-- ============================================================
create table if not exists public.favorites (
  user_id    uuid        not null references auth.users on delete cascade,
  product_id text        not null,                -- 关联 catalog.json 里的 id，如 'p01'
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists favorites_product_idx on public.favorites (product_id);

alter table public.favorites enable row level security;

-- 只能操作自己的收藏
create policy "favorites_own" on public.favorites
  for all using (auth.uid() = user_id);

-- ============================================================
-- 3. 询盘表（游客可写、登录用户可看自己的、管理员全看）
-- ============================================================
create table if not exists public.inquiries (
  id          uuid        not null default gen_random_uuid() primary key,
  user_id     uuid        references auth.users on delete set null,  -- 登录用户关联，游客为 null
  category_id text,                                       -- 关联 categories.id
  product_id  text,                                       -- 关联 products.id
  name        text        not null,
  company     text,
  email       text        not null,
  phone       text,
  qty         int,
  message     text,
  status      text        not null default 'new',         -- new | quoted | closed | spam
  source      text        default 'web',                  -- web | whatsapp | api
  metadata    jsonb       default '{}'::jsonb,            -- 扩展字段（如 utm_*）
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists inquiries_user_idx      on public.inquiries (user_id);
create index if not exists inquiries_product_idx   on public.inquiries (product_id);
create index if not exists inquiries_status_idx    on public.inquiries (status);
create index if not exists inquiries_created_idx   on public.inquiries (created_at desc);

alter table public.inquiries enable row level security;

-- 登录用户只能看自己的
create policy "inquiries_own_select" on public.inquiries
  for select using (auth.uid() = user_id);

-- 谁都能插入（游客询盘）
create policy "inquiries_insert_any" on public.inquiries
  for insert with check (true);

-- 服务端角色（service_role）拥有全部权限，由 API Route 使用
-- 不需要额外 policy，service_role 绕过 RLS

-- ============================================================
-- 4. 自动更新 updated_at 触发器
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists inquiries_updated_at on public.inquiries;
create trigger inquiries_updated_at
before update on public.inquiries
for each row execute function public.set_updated_at();

-- ============================================================
-- 5. 可选：给匿名用户也能通过 service_role 读自己的询盘
--    （前端把 inquiry_id 存 localStorage，后续查询用）
-- ============================================================
-- create policy "inquiries_anon_by_id" on public.inquiries
--   for select using (id = current_setting('request.jwt.claims', true)::jsonb->>'inquiry_id');