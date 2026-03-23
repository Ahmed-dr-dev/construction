import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET() {
  try {
    const { user, error } = await requireAuth(PERMISSIONS.clients_read);
    if (error) return error;

    const supabase = await createClient();
    const { data, error: dbError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ clients: data });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(PERMISSIONS.clients_write);
    if (error) return error;

    const supabase = await createClient();
    const body = await request.json();
    const { name, phone, email, address } = body;

    if (!name || !phone || !email || !address) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    const { data, error: dbError } = await supabase
      .from('clients')
      .insert({ name, phone, email, address, total_purchases: 0, unpaid_amount: 0 })
      .select()
      .single();

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ client: data });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
