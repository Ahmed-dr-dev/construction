import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'client' or 'supplier'

    let query = supabase
      .from('invoices')
      .select(`
        *,
        sale:sales(
          *,
          client:clients(*),
          items:sale_items(
            *,
            product:products(*)
          )
        ),
        supplier_order:supplier_orders(
          *,
          supplier:suppliers(id, name, phone, email),
          items:supplier_order_items(*)
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by type
    if (type === 'client') {
      query = query.not('sale_id', 'is', null);
    } else if (type === 'supplier') {
      query = query.not('supplier_order_id', 'is', null);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoices: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sale_id, supplier_order_id, invoice_number } = body;

    // Must have either sale_id or supplier_order_id, but not both
    if (!sale_id && !supplier_order_id) {
      return NextResponse.json(
        { error: 'ID de vente ou ID de commande fournisseur requis' },
        { status: 400 }
      );
    }

    if (sale_id && supplier_order_id) {
      return NextResponse.json(
        { error: 'Une facture ne peut être liée qu\'à une vente ou une commande fournisseur, pas les deux' },
        { status: 400 }
      );
    }

    let finalInvoiceNumber = invoice_number;

    // Generate invoice number if not provided
    if (!finalInvoiceNumber) {
      if (sale_id) {
        // Client invoice - INV prefix
        const { data: lastInvoice } = await supabase
          .from('invoices')
          .select('invoice_number')
          .like('invoice_number', 'INV-%')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        finalInvoiceNumber = lastInvoice?.invoice_number
          ? `INV-${String(parseInt(lastInvoice.invoice_number.split('-')[1]) + 1).padStart(6, '0')}`
          : 'INV-000001';
      } else {
        // Supplier invoice - SINV prefix
        const { data: lastInvoice } = await supabase
          .from('invoices')
          .select('invoice_number')
          .like('invoice_number', 'SINV-%')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        finalInvoiceNumber = lastInvoice?.invoice_number
          ? `SINV-${String(parseInt(lastInvoice.invoice_number.split('-')[1]) + 1).padStart(6, '0')}`
          : 'SINV-000001';
      }
    }

    const insertData: any = {
      invoice_number: finalInvoiceNumber,
    };

    if (sale_id) {
      insertData.sale_id = sale_id;
    }
    if (supplier_order_id) {
      insertData.supplier_order_id = supplier_order_id;
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert(insertData)
      .select(`
        *,
        sale:sales(
          *,
          client:clients(*),
          items:sale_items(
            *,
            product:products(*)
          )
        ),
        supplier_order:supplier_orders(
          *,
          supplier:suppliers(id, name, phone, email),
          items:supplier_order_items(*)
        )
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoice: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
