import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/auth-guard';
import { PERMISSIONS, type UserRole } from '@/lib/rbac';

const ALLOWED_ROLES: UserRole[] = ['admin', 'responsable', 'personnel', 'comptable'];

export async function GET() {
  try {
    const { user, error } = await requireAuth(PERMISSIONS.users_manage);
    if (error) return error;

    const supabase = await createClient();
    const { data, error: dbError } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ comptables: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth(PERMISSIONS.users_manage);
    if (error) return error;

    const { email, password, fullName, role } = await request.json();

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: 'Email, mot de passe, nom et rôle requis' }, { status: 400 });
    }

    if (!ALLOWED_ROLES.includes(role as UserRole)) {
      return NextResponse.json({ error: `Rôle invalide. Valeurs acceptées : ${ALLOWED_ROLES.join(', ')}` }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: 'Un utilisateur existe déjà avec cet email' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({ email, full_name: fullName, role, password_hash: passwordHash })
      .select('id, email, full_name, role, created_at, updated_at')
      .single();

    if (insertError || !newUser) {
      return NextResponse.json({ error: insertError?.message || 'Erreur lors de la création' }, { status: 500 });
    }

    return NextResponse.json({ user: newUser });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireAuth(PERMISSIONS.users_manage);
    if (error) return error;

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    // Prevent self-deletion
    if (id === user!.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error: dbError } = await supabase.from('users').delete().eq('id', id);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
