-- Additive: enforce unique invoice numbers per workspace owner.
-- Safe for legacy nulls/blank numbers via partial unique index.
-- If this fails, resolve duplicate (owner_id, invoice_number) rows first, then re-apply.

comment on column public.invoices.invoice_number is
  'Invoice number unique per owner_id (partial unique index invoices_owner_invoice_number_uidx).';

create unique index if not exists invoices_owner_invoice_number_uidx
  on public.invoices (owner_id, invoice_number)
  where owner_id is not null
    and invoice_number is not null
    and btrim(invoice_number) <> '';
