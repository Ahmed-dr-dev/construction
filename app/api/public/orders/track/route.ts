import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const { email, phone, order_id } = body;

    // Must provide either email, phone or order_id
    if (!email && !phone && !order_id) {
      return NextResponse.json(
        { error: 'Email, téléphone ou numéro de commande requis' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('sales')
      .select(`
        id,
        date,
        total_amount,
        status,
        created_at,
        client:clients(
          id,
          name,
          email,
          phone
        ),
        items:sale_items(
          id,
          quantity,
          price,
          product:products(
            id,
            name,
            unit
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by order_id, email or phone
    if (order_id) {
      query = query.eq('id', order_id);
    } else {
      // Get client ID by email or phone
      let clientQuery = supabase
        .from('clients')
        .select('id');

      if (email && phone) {
        // Search by both email and phone
        clientQuery = clientQuery.or(`email.eq.${email},phone.eq.${phone}`);
      } else if (email) {
        clientQuery = clientQuery.eq('email', email);
      } else if (phone) {
        clientQuery = clientQuery.eq('phone', phone);
      }

      const { data: clients } = await clientQuery;

      if (!clients || clients.length === 0) {
        return NextResponse.json({ orders: [] });
      }

      // Get all orders for matching clients
      const clientIds = clients.map(c => c.id);
      query = query.in('client_id', clientIds);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders: data || [] });
  } catch (error) {
    console.error('Error tracking orders:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
