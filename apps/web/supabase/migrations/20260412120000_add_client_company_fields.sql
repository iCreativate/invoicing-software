-- Client company / VAT details (required for apps that select these columns)
alter table public.clients add column if not exists company_name text;
alter table public.clients add column if not exists website text;
alter table public.clients add column if not exists company_registration text;
alter table public.clients add column if not exists vat_number text;
