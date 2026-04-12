-- Link line items to catalog and record when inventory was deducted for a sent invoice.
-- Run in Supabase if these columns are missing.

alter table public.invoice_items add column if not exists catalog_item_id uuid references public.catalog_items(id) on delete set null;
create index if not exists invoice_items_catalog_item_id_idx on public.invoice_items(catalog_item_id);

alter table public.invoices add column if not exists inventory_deducted_at timestamptz;
