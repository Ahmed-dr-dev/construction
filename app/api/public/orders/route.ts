import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const { client_name, client_email, client_phone, client_address, items, notes } = body;

    if (!client_name || !client_email || !client_phone || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Nom, email, téléphone et articles sont requis' },
        { status: 400 }
      );
    }

    // Check or create client
    let clientId: string;
    
    // Try to find existing client by email or phone
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, name')
      .or(`email.eq.${client_email},phone.eq.${client_phone}`)
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
      
      // Update client info (keep "Visiteur en ligne" tag if exists)
      const updatedName = existingClient.name.includes('Visiteur en ligne')
        ? existingClient.name
        : `${client_name} (Visiteur en ligne)`;
      
      await supabase
        .from('clients')
        .update({
          name: updatedName,
          phone: client_phone,
          address: client_address || null,
          email: client_email,
        })
        .eq('id', clientId);
    } else {
      // Create new client as "Visiteur en ligne" (Online Visitor)
      const visitorName = client_name.includes('Visiteur en ligne') 
        ? client_name 
        : `${client_name} (Visiteur en ligne)`;
      
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: visitorName,
          email: client_email,
          phone: client_phone,
          address: client_address || null,
        })
        .select()
        .single();

      if (clientError || !newClient) {
        return NextResponse.json(
          { error: 'Erreur lors de la création du client' },
          { status: 500 }
        );
      }

      clientId = newClient.id;
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
        user_id: null, // Public order - no user
        date: new Date().toISOString().split('T')[0],
        total_amount: totalAmount,
        status: 'unpaid',
      })
      .select()
      .single();

    if (saleError || !sale) {
      return NextResponse.json(
        { error: 'Erreur lors de la création de la commande' },
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
      // Rollback sale if items insertion fails
      await supabase.from('sales').delete().eq('id', sale.id);
      return NextResponse.json(
        { error: 'Erreur lors de l\'ajout des articles' },
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
