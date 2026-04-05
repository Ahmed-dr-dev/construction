import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth(PERMISSIONS.clients_read);
    if (error) return error;

    const supabase = await createClient();
    const { data, error: dbError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', params.id)
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ client: data });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth(PERMISSIONS.clients_write);
    if (error) return error;

    const supabase = await createClient();
    const body = await request.json();
    const { name, phone, email, address } = body;

    const { data, error: dbError } = await supabase
      .from('clients')
      .update({
        name,
        phone,
        email,
        address,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ client: data });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth(PERMISSIONS.clients_write);
    if (error) return error;

    const supabase = await createClient();
    const { error: dbError } = await supabase.from('clients').delete().eq('id', params.id);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
