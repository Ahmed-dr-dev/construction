import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
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

    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        client:clients(*),
        items:sale_items(
          *,
          product:products(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ sales: data });
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
    const { client_id, date, status, items } = body;

    if (!client_id || !date || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Données incomplètes' },
        { status: 400 }
      );
    }

    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.price,
      0
    );

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        client_id,
        user_id: userId,
        date,
        total_amount: totalAmount,
        status: status === 'Payé' ? 'paid' : 'unpaid',
      })
      .select()
      .single();

    if (saleError) {
      return NextResponse.json(
        { error: saleError.message },
        { status: 500 }
      );
    }

    const saleItems = items.map((item: any) => ({
      sale_id: sale.id,
      product_id: item.product_id || item.productId,
      quantity: parseInt(item.quantity),
      price: parseFloat(item.price),
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    for (const item of items) {
      const productId = item.product_id || item.productId;
      const { error: stockError } = await supabase.rpc('decrement_stock', {
        product_id: productId,
        quantity: parseInt(item.quantity),
      });

      if (stockError) {
        console.error('Erreur mise à jour stock:', stockError);
      }
    }

    const { error: clientUpdateError } = await supabase.rpc('update_client_stats', {
      client_id_param: client_id,
      amount: totalAmount,
      is_paid: status === 'Payé',
    });

    if (clientUpdateError) {
      console.error('Erreur mise à jour client:', clientUpdateError);
    }

    // Auto-generate invoice for the sale
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const invoiceNumber = lastInvoice
      ? `INV-${String(parseInt(lastInvoice.invoice_number.split('-')[1]) + 1).padStart(6, '0')}`
      : 'INV-000001';

    const { error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        sale_id: sale.id,
        invoice_number: invoiceNumber,
      });

    if (invoiceError) {
      console.error('Erreur génération facture:', invoiceError);
    }

    const { data: saleWithDetails } = await supabase
      .from('sales')
      .select(`
        *,
        client:clients(*),
        items:sale_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', sale.id)
      .single();

    return NextResponse.json({ sale: saleWithDetails });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
