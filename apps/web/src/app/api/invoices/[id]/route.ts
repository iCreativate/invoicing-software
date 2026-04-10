import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { calcInvoiceTotals, linesToPayload, type LineInput } from '@/lib/invoices/calcLines';
import { fetchInvoiceTimelineRows, logInvoiceTimelineEvent, mergeInvoiceTimeline } from '@/lib/invoices/timelineServer';

async function loadInvoice(supabase: SupabaseClient, id: string, ownerId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select(
      `
      id,
      owner_id,
      client_id,
      invoice_number,
      status,
      issue_date,
      due_date,
      currency,
      template_id,
      vat_rate,
      subtotal_amount,
      tax_amount,
      total_amount,
      paid_amount,
      balance_amount,
      paid_date,
      sent_at,
      notes,
      public_share_id,
      created_at,
      updated_at,
      client:clients(id,name,email,phone,address),
      items:invoice_items(id,description,quantity,unit_price,tax_rate,line_total)
    `
    )
    .eq('id', id)
    .eq('owner_id', ownerId)
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient(_request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });

    let { data, error } = await loadInvoice(supabase, id, ctx.workspaceOwnerId);
    if (error) {
      const msg = String((error as any).message ?? '').toLowerCase();
      if (msg.includes('owner_id') || msg.includes('column')) {
        const { data: d2, error: e2 } = await supabase
          .from('invoices')
          .select(
            `
          id,
          owner_id,
          client_id,
          invoice_number,
          status,
          issue_date,
          due_date,
          currency,
          template_id,
          vat_rate,
          subtotal_amount,
          tax_amount,
          total_amount,
          paid_amount,
          balance_amount,
          paid_date,
          sent_at,
          notes,
          public_share_id,
          created_at,
          updated_at,
          client:clients(id,name,email,phone,address),
          items:invoice_items(id,description,quantity,unit_price,tax_rate,line_total)
        `
          )
          .eq('id', id)
          .single();
        data = d2;
        error = e2;
      }
    }
    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Invoice not found.' }, { status: 404 });
    }

    if ((data as any).owner_id && String((data as any).owner_id) !== ctx.workspaceOwnerId) {
      return NextResponse.json({ success: false, error: 'Not allowed.' }, { status: 403 });
    }

    const dbTimeline = await fetchInvoiceTimelineRows(supabase, id);
    const timeline = mergeInvoiceTimeline(
      {
        created_at: (data as any).created_at,
        sent_at: (data as any).sent_at,
        paid_date: (data as any).paid_date,
        status: (data as any).status,
        total_amount: Number((data as any).total_amount ?? 0),
        paid_amount: Number((data as any).paid_amount ?? 0),
        balance_amount: Number((data as any).balance_amount ?? 0),
      },
      dbTimeline
    );

    return NextResponse.json({
      success: true,
      data: {
        invoice: data,
        timeline,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed to load invoice.' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });

    const { data: existing, error: exErr } = await loadInvoice(supabase, id, ctx.workspaceOwnerId);
    if (exErr || !existing) {
      return NextResponse.json({ success: false, error: 'Invoice not found.' }, { status: 404 });
    }

    const body = await request.json();
    const client_id = body.client_id != null ? String(body.client_id) : String((existing as any).client_id);
    const issue_date = body.issue_date != null ? String(body.issue_date).slice(0, 10) : String((existing as any).issue_date);
    const due_date = body.due_date != null ? String(body.due_date).slice(0, 10) : String((existing as any).due_date);
    const currency = body.currency != null ? String(body.currency) : String((existing as any).currency ?? 'ZAR');
    const template_id = body.template_id != null ? String(body.template_id) : String((existing as any).template_id ?? 'modern');
    const invoice_number =
      body.invoice_number != null ? String(body.invoice_number).trim() : String((existing as any).invoice_number ?? '');
    const notes = body.notes !== undefined ? (body.notes == null ? null : String(body.notes)) : (existing as any).notes;

    const itemsRaw = Array.isArray(body.items) ? body.items : null;
    let totals = {
      subtotal_amount: Number((existing as any).subtotal_amount ?? 0),
      tax_amount: Number((existing as any).tax_amount ?? 0),
      total_amount: Number((existing as any).total_amount ?? 0),
    };
    let itemsPayload: ReturnType<typeof linesToPayload> | null = null;

    if (itemsRaw) {
      const items: LineInput[] = itemsRaw.map((it: any) => ({
        description: String(it.description ?? ''),
        quantity: Number(it.quantity ?? 1),
        unit_price: Number(it.unit_price ?? 0),
        tax_rate: Number(it.tax_rate ?? 15),
      }));
      if (items.length === 0) {
        return NextResponse.json({ success: false, error: 'At least one line item required' }, { status: 400 });
      }
      totals = calcInvoiceTotals(items);
      itemsPayload = linesToPayload(items);
    }

    const paid = Number((existing as any).paid_amount ?? 0);
    const balance = Math.max(0, totals.total_amount - paid);
    const prevStatus = String((existing as any).status ?? 'draft');
    const today = new Date().toISOString().slice(0, 10);
    let status = prevStatus;
    if (balance <= 0 && totals.total_amount >= 0 && paid >= totals.total_amount) {
      status = 'paid';
    } else if (paid > 0 && balance > 0) {
      status = 'partial';
    } else if (prevStatus === 'paid' && balance > 0) {
      status = 'partial';
    } else if (balance > 0 && due_date < today && prevStatus !== 'draft' && prevStatus !== 'cancelled') {
      status = 'overdue';
    } else if (prevStatus === 'overdue' && due_date >= today && balance > 0) {
      status = 'sent';
    }

    const { error: upErr } = await supabase
      .from('invoices')
      .update({
        client_id,
        invoice_number,
        issue_date,
        due_date,
        currency,
        template_id,
        subtotal_amount: totals.subtotal_amount,
        tax_amount: totals.tax_amount,
        total_amount: totals.total_amount,
        balance_amount: balance,
        notes,
        status,
      })
      .eq('id', id)
      .eq('owner_id', ctx.workspaceOwnerId);

    if (upErr) throw upErr;

    if (itemsPayload) {
      const { error: delErr } = await supabase.from('invoice_items').delete().eq('invoice_id', id);
      if (delErr) throw delErr;
      const { error: insErr } = await supabase.from('invoice_items').insert(
        itemsPayload.map((it) => ({
          invoice_id: id,
          ...it,
        }))
      );
      if (insErr) throw insErr;
    }

    await logInvoiceTimelineEvent(supabase, id, 'updated', {});

    return NextResponse.json({ success: true, data: { id } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed to update invoice.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient(_request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });

    const { error } = await supabase.from('invoices').delete().eq('id', id).eq('owner_id', ctx.workspaceOwnerId);
    if (error) throw error;

    return NextResponse.json({ success: true, data: { id } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed to delete invoice.' }, { status: 500 });
  }
}
