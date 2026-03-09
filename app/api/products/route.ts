import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const UNIT_REGEX = /^(?=.*[A-Za-z])[A-Za-z0-9\s/.-]+$/;

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

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ products: data });
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

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError ) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, category, price, stock, min_stock, unit, purchase_price } = body;
    const normalizedUnit = String(unit || '').trim();

    if (!name || !category || price === undefined || stock === undefined || min_stock === undefined || !normalizedUnit) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    if (!UNIT_REGEX.test(normalizedUnit)) {
      return NextResponse.json(
        { error: "L'unité doit contenir des lettres, par exemple kg, m2 ou m3" },
        { status: 400 }
      );
    }

    const insertPayload: Record<string, unknown> = {
      name,
      category,
      price: parseFloat(price),
      stock: parseInt(stock),
      min_stock: parseInt(min_stock),
      unit: normalizedUnit,
    };
    if (purchase_price !== undefined && purchase_price !== "" && purchase_price !== null) {
      const v = parseFloat(purchase_price);
      if (!isNaN(v) && v >= 0) insertPayload.purchase_price = v;
    }
    const { data, error } = await supabase
      .from('products')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ product: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
