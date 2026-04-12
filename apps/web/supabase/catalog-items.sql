-- Catalog items (products, services, inventory). Run in Supabase SQL Editor if the table is missing.
-- Same DDL as in schema.sql.

create extension if not exists "uuid-ossp";

create table if not exists public.catalog_items (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null,
  item_type text not null check (item_type in ('service', 'product', 'inventory')),
  name text not null,
  description text,
  sku text,
  unit text,
  unit_price numeric not null default 0,
  default_tax_rate numeric,
  stock_quantity numeric,
  cost_price numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists catalog_items_owner_id_idx on public.catalog_items(owner_id);
create index if not exists catalog_items_item_type_idx on public.catalog_items(item_type);
create index if not exists catalog_items_name_idx on public.catalog_items(name);
