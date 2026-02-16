import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const clientId = cookieStore.get('client_id')?.value;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        created_at,
        sale:sales(
          id,
          date,
          total_amount,
          status,
          created_at,
          client_id,
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
        )
      `)
      .eq('sale.client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoices: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

