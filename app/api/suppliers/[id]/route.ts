import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth(PERMISSIONS.suppliers_write);
    if (error) return error;

    const supabase = await createClient();
    const { data, error: dbError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', params.id)
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ supplier: data });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth(PERMISSIONS.suppliers_write);
    if (error) return error;

    const supabase = await createClient();
    const body = await request.json();
    const {
      name,
      phone,
      email,
      products,
      contact_person,
      address,
      city,
      country,
      tax_id,
      registration_number,
      payment_terms,
      bank_name,
      bank_account,
      website,
      status,
      notes,
    } = body;

    const { data, error: dbError } = await supabase
      .from('suppliers')
      .update({
        name,
        phone,
        email,
        contact_person: contact_person || null,
        address: address || null,
        city: city || null,
        country: country || null,
        tax_id: tax_id || null,
        registration_number: registration_number || null,
        products: Array.isArray(products)
          ? products
          : products
            ? products.split(',').map((p: string) => p.trim()).filter((p: string) => p)
            : [],
        payment_terms: payment_terms || null,
        bank_name: bank_name || null,
        bank_account: bank_account || null,
        website: website || null,
        status: status || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ supplier: data });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth(PERMISSIONS.suppliers_write);
    if (error) return error;

    const supabase = await createClient();
    const { error: dbError } = await supabase.from('suppliers').delete().eq('id', params.id);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
