import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
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

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ suppliers: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

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
      notes
    } = body;

    if (!name || !phone || !email) {
      return NextResponse.json(
        { error: 'Le nom, téléphone et email sont requis' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        name,
        phone,
        email,
        contact_person: contact_person || null,
        address: address || null,
        city: city || null,
        country: country || 'Maroc',
        tax_id: tax_id || null,
        registration_number: registration_number || null,
        products: Array.isArray(products) ? products : (products ? products.split(',').map((p: string) => p.trim()).filter((p: string) => p) : []),
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

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ supplier: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
