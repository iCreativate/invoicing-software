-- Optional company fields for clients (run against your Supabase DB if not already applied)
alter table public.clients add column if not exists company_name text;
alter table public.clients add column if not exists website text;
alter table public.clients add column if not exists company_registration text;
alter table public.clients add column if not exists vat_number text;
