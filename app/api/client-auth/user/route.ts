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

    const { data: client, error } = await supabase
      .from('clients')
      .select('id, name, email, phone')
      .eq('id', clientId)
      .single();

    if (error || !client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 401 }
      );
    }

    return NextResponse.json({ client });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

