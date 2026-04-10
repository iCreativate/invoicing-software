import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { calcInvoiceTotals, linesToPayload, type LineInput } from '@/lib/invoices/calcLines';
import { logInvoiceTimelineEvent } from '@/lib/invoices/timelineServer';

function coerceStatus(v: unknown): string {
  const s = String(v ?? '').toLowerCase();
  if (['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'].includes(s)) return s;
  return '';
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status')?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
    const clientId = searchParams.get('clientId')?.trim() || null;
    const from = searchParams.get('from')?.trim() || null;
    const to = searchParams.get('to')?.trim() || null;

    let q = supabase
      .from('invoices')
      .select(
        `
        id,
        invoice_number,
        status,
        issue_date,
        due_date,
        currency,
        total_amount,
        paid_amount,
        balance_amount,
        client_id,
        client:clients(name)
      `
      )
      .order('created_at', { ascending: false });

    // Legacy support: some early rows may have NULL owner_id (solo workspaces only).
    // We include those only for the actual owner user to avoid leaking data across workspaces.
    if (ctx.workspaceOwnerId && ctx.actorUserId && ctx.workspaceOwnerId === ctx.actorUserId) {
      q = q.or(`owner_id.eq.${ctx.workspaceOwnerId},owner_id.is.null`);
    } else {
      q = q.eq('owner_id', ctx.workspaceOwnerId);
    }

    if (statusFilter.length) {
      q = q.in('status', statusFilter);
    }
    if (clientId) {
      q = q.eq('client_id', clientId);
    }
    if (from) {
      q = q.gte('issue_date', from);
    }
    if (to) {
      q = q.lte('issue_date', to);
    }

    let { data, error } = await q;
    if (error) {
      const msg = String((error as any).message ?? '').toLowerCase();
      if (msg.includes('owner_id') || msg.includes('column')) {
        let q2 = supabase
          .from('invoices')
          .select(
            `
        id,
        invoice_number,
        status,
        issue_date,
        due_date,
        currency,
        total_amount,
        paid_amount,
        balance_amount,
        client_id,
        client:clients(name)
      `
          )
          .order('created_at', { ascending: false });
        if (statusFilter.length) q2 = q2.in('status', statusFilter);
        if (clientId) q2 = q2.eq('client_id', clientId);
        if (from) q2 = q2.gte('issue_date', from);
        if (to) q2 = q2.lte('issue_date', to);
        const fb = await q2;
        data = fb.data;
        error = fb.error;
      }
    }
    if (error) throw error;

    const invoices = (data ?? []).map((row: any) => ({
      id: String(row.id),
      invoice_number: String(row.invoice_number ?? ''),
      status: coerceStatus(row.status) || 'draft',
      issue_date: String(row.issue_date ?? ''),
      due_date: String(row.due_date ?? ''),
      currency: String(row.currency ?? 'ZAR'),
      total_amount: Number(row.total_amount ?? 0),
      paid_amount: Number(row.paid_amount ?? 0),
      balance_amount: Number(row.balance_amount ?? 0),
      client_id: String(row.client_id ?? ''),
      client_name: row.client?.name ?? null,
    }));

    return NextResponse.json({ success: true, data: { invoices } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed to list invoices.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });

    const body = await request.json();
    const client_id = String(body.client_id ?? '');
    if (!client_id) return NextResponse.json({ success: false, error: 'client_id required' }, { status: 400 });

    const issue_date = String(body.issue_date ?? '').slice(0, 10);
    const due_date = String(body.due_date ?? '').slice(0, 10);
    const currency = String(body.currency ?? 'ZAR');
    const template_id = body.template_id ? String(body.template_id) : 'modern';
    const invoice_number = body.invoice_number ? String(body.invoice_number).trim() : null;
    const notes = body.notes != null ? String(body.notes) : null;
    const itemsRaw = Array.isArray(body.items) ? body.items : [];
    const items: LineInput[] = itemsRaw.map((it: any) => ({
      description: String(it.description ?? ''),
      quantity: Number(it.quantity ?? 1),
      unit_price: Number(it.unit_price ?? 0),
      tax_rate: Number(it.tax_rate ?? 15),
    }));

    if (!issue_date || !due_date) {
      return NextResponse.json({ success: false, error: 'issue_date and due_date required' }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one line item required' }, { status: 400 });
    }

    const totals = calcInvoiceTotals(items);
    const shareId = crypto.randomUUID();

    const invNo =
      invoice_number ||
      `INV-${new Date().getUTCFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`;

    const { data: row, error: insErr } = await supabase
      .from('invoices')
      .insert({
        owner_id: ctx.workspaceOwnerId,
        client_id,
        invoice_number: invNo,
        issue_date,
        due_date,
        currency,
        template_id,
        status: 'draft',
        vat_rate: 15,
        subtotal_amount: totals.subtotal_amount,
        tax_amount: totals.tax_amount,
        total_amount: totals.total_amount,
        paid_amount: 0,
        balance_amount: totals.total_amount,
        notes,
        public_share_id: shareId,
      })
      .select('id,invoice_number,public_share_id')
      .single();

    if (insErr) throw insErr;
    const invoiceId = String((row as any).id);

    const payload = linesToPayload(items);
    const { error: itemsErr } = await supabase.from('invoice_items').insert(
      payload.map((it) => ({
        invoice_id: invoiceId,
        ...it,
      }))
    );
    if (itemsErr) throw itemsErr;

    await logInvoiceTimelineEvent(supabase, invoiceId, 'created', {});

    return NextResponse.json({
      success: true,
      data: {
        id: invoiceId,
        invoice_number: String((row as any).invoice_number ?? invNo),
        public_share_id: String((row as any).public_share_id ?? shareId),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed to create invoice.' }, { status: 500 });
  }
}
