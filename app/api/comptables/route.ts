import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>, cookieStore: Awaited<ReturnType<typeof import('next/headers').cookies>>) {
  const userId = cookieStore.get('user_id')?.value;
  if (!userId) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }), userId: null as string | null };
  }
  const { data: profile } = await supabase.from('users').select('role').eq('id', userId).single();
  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }), userId: null as string | null };
  }
  return { error: null, userId };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const { error: authError } = await requireAdmin(supabase, cookieStore);
    if (authError) return authError;

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at, updated_at')
      .eq('role', 'comptable')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ comptables: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const { error: authError } = await requireAdmin(supabase, cookieStore);
    if (authError) return authError;

    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, mot de passe et nom complet requis" },
        { status: 400 }
      );
    }

    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: "Erreur lors de la vérification de l'utilisateur" },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur existe déjà avec cet email' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        full_name: fullName,
        role: 'comptable',
        password_hash: passwordHash,
      })
      .select('id, email, full_name, role, created_at, updated_at')
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: error?.message || "Erreur lors de la création du compte comptable" },
        { status: 500 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

