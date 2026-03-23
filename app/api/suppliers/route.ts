import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET() {
  try {
    const { user, error } = await requireAuth(PERMISSIONS.suppliers_write);
    if (error) return error;

    const supabase = await createClient();
    const { data, error: dbError } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ suppliers: data });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(PERMISSIONS.suppliers_write);
    if (error) return error;

    const supabase = await createClient();
    const body = await request.json();
    const {
      name, phone, email, products,
      contact_person, address, city, country,
      tax_id, registration_number, payment_terms,
      bank_name, bank_account, website, status, notes,
    } = body;

    if (!name || !phone || !email) {
      return NextResponse.json({ error: 'Le nom, téléphone et email sont requis' }, { status: 400 });
    }

    const { data, error: dbError } = await supabase
      .from('suppliers')
      .insert({
        name, phone, email,
        contact_person: contact_person || null,
        address: address || null,
        city: city || null,
        country: country || 'Tunisie',
        tax_id: tax_id || null,
        registration_number: registration_number || null,
        products: Array.isArray(products)
          ? products
          : (products ? products.split(',').map((p: string) => p.trim()).filter(Boolean) : []),
        payment_terms: payment_terms || 'Net 30',
        bank_name: bank_name || null,
        bank_account: bank_account || null,
        website: website || null,
        status: status || 'active',
        notes: notes || null,
        last_delivery: null,
        total_orders: 0,
      })
      .select()
      .single();

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ supplier: data });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
