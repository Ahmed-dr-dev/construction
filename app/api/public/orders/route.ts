import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const clientId = cookieStore.get('client_id')?.value;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour passer une commande.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items, notes } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Les articles sont requis pour créer une commande' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.price,
      0
    );

    // Create sale
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        client_id: clientId,
        user_id: null,
        date: new Date().toISOString().split('T')[0],
        total_amount: totalAmount,
        status: 'unpaid',
      })
      .select()
      .single();

    if (saleError || !sale) {
      console.error('Erreur insertion vente:', saleError);
      return NextResponse.json(
        { error: saleError?.message || 'Erreur lors de la création de la commande' },
        { status: 500 }
      );
    }

    // Create sale items
    const saleItems = items.map((item: any) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: parseInt(item.quantity),
      price: parseFloat(item.price),
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);

    if (itemsError) {
      console.error("Erreur lors de l'ajout des articles:", itemsError);
      // Rollback sale if items insertion fails
      await supabase.from('sales').delete().eq('id', sale.id);
      return NextResponse.json(
        { error: itemsError.message || "Erreur lors de l'ajout des articles" },
        { status: 500 }
      );
    }

    // Update product stock
    for (const item of items) {
      const { error: stockError } = await supabase.rpc('decrement_stock', {
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
      });

      if (stockError) {
        console.error('Erreur mise à jour stock:', stockError);
      }
    }

    // Update client stats
    const { error: clientUpdateError } = await supabase.rpc('update_client_stats', {
      client_id_param: clientId,
      amount: totalAmount,
      is_paid: false,
    });

    if (clientUpdateError) {
      console.error('Erreur mise à jour client:', clientUpdateError);
    }

    // Auto-generate invoice
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', 'INV-%')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const invoiceNumber = lastInvoice?.invoice_number
      ? `INV-${String(parseInt(lastInvoice.invoice_number.split('-')[1]) + 1).padStart(6, '0')}`
      : 'INV-000001';

    await supabase
      .from('invoices')
      .insert({
        sale_id: sale.id,
        invoice_number: invoiceNumber,
      });

    // Get sale with details
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

    return NextResponse.json({ 
      order: saleWithDetails,
      invoice_number: invoiceNumber,
      message: 'Commande créée avec succès'
    });
  } catch (error) {
    console.error('Error creating public order:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
