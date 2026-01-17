import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ sale: data });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ sale: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const { status } = body;

    if (!status || !['paid', 'unpaid'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide. Doit être "paid" ou "unpaid"' },
        { status: 400 }
      );
    }

    // Get current sale
    const { data: currentSale } = await supabase
      .from('sales')
      .select('client_id, total_amount, status')
      .eq('id', params.id)
      .single();

    if (!currentSale) {
      return NextResponse.json(
        { error: 'Vente introuvable' },
        { status: 404 }
      );
    }

    // Update sale status
    const { data, error } = await supabase
      .from('sales')
      .update({ status })
      .eq('id', params.id)
      .select(`
        *,
        client:clients(*),
        items:sale_items(
          *,
          product:products(*)
        )
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Update client stats if status changed
    const oldStatus = currentSale.status;
    if (oldStatus !== status) {
      const { error: clientUpdateError } = await supabase.rpc('update_client_stats', {
        client_id_param: currentSale.client_id,
        amount: currentSale.total_amount,
        is_paid: status === 'paid',
      });

      if (clientUpdateError) {
        console.error('Erreur mise à jour client:', clientUpdateError);
      }
    }

    return NextResponse.json({ sale: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
