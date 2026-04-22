create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  category text not null,
  price numeric not null default 0,
  source text,
  active boolean default true,
  created_at timestamp without time zone default now()
);

create unique index if not exists products_normalized_name_idx on public.products (normalized_name);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  unit text not null default 'un',
  stock_qty numeric not null default 0,
  min_qty numeric not null default 0,
  cost_per_unit numeric not null default 0,
  notes text,
  active boolean default true,
  created_at timestamp without time zone default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  quantity numeric not null default 0,
  notes text,
  created_at timestamp without time zone default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  whatsapp text not null,
  city text,
  notes text,
  created_at timestamp without time zone default now()
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('Goomer', 'Ceofood')),
  file_name text,
  imported_at timestamp without time zone default now(),
  revenue numeric not null default 0,
  orders integer not null default 0
);

create table if not exists public.import_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  source text not null,
  file_name text,
  product_name text not null,
  normalized_name text not null,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  line_total numeric not null default 0,
  raw jsonb default '{}'::jsonb,
  created_at timestamp without time zone default now()
);

alter table public.products enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.suppliers enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'public_all_products'
  ) then
    create policy public_all_products on public.products for all using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ingredients' and policyname = 'public_all_ingredients'
  ) then
    create policy public_all_ingredients on public.ingredients for all using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'recipes' and policyname = 'public_all_recipes'
  ) then
    create policy public_all_recipes on public.recipes for all using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'suppliers' and policyname = 'public_all_suppliers'
  ) then
    create policy public_all_suppliers on public.suppliers for all using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'import_batches' and policyname = 'public_all_import_batches'
  ) then
    create policy public_all_import_batches on public.import_batches for all using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'import_items' and policyname = 'public_all_import_items'
  ) then
    create policy public_all_import_items on public.import_items for all using (true) with check (true);
  end if;
end $$;
