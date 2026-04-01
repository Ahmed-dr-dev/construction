import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { type UserRole } from '@/lib/rbac';

function getRedirectForRole(role: UserRole): string {
  return role === 'comptable' ? '/dashboard/comptable' : '/dashboard';
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
    };

    // ── 1. Try staff (users table) ──────────────────────────────────────────
    const { data: staffUser } = await supabase
      .from('users')
      .select('id, email, full_name, role, password_hash')
      .eq('email', email)
      .maybeSingle();

    if (staffUser?.password_hash) {
      const valid = await bcrypt.compare(password, staffUser.password_hash);
      if (!valid) {
        return NextResponse.json(
          { error: 'Email ou mot de passe incorrect' },
          { status: 401 }
        );
      }

      const role       = staffUser.role as UserRole;
      const redirectTo = getRedirectForRole(role);

      // Log login + update last_login_at (fire-and-forget)
      Promise.all([
        supabase.from('activity_logs').insert({
          user_id:     staffUser.id,
          action:      'login',
          entity_type: 'user',
          details:     `Connexion de ${staffUser.full_name}`,
        }),
        supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', staffUser.id),
      ]).catch(() => {});

      const res = NextResponse.json({
        userType: 'staff',
        role,
        redirectTo,
        user: { id: staffUser.id, email: staffUser.email, full_name: staffUser.full_name, role },
      });
      res.cookies.set('user_id',   staffUser.id, cookieOptions);
      res.cookies.set('user_role', role,          cookieOptions);
      return res;
    }

    // ── 2. Try client (clients table) ───────────────────────────────────────
    const { data: clientUser } = await supabase
      .from('clients')
      .select('id, name, email, phone, password_hash')
      .eq('email', email)
      .maybeSingle();

    if (clientUser?.password_hash) {
      const valid = await bcrypt.compare(password, clientUser.password_hash);
      if (!valid) {
        return NextResponse.json(
          { error: 'Email ou mot de passe incorrect' },
          { status: 401 }
        );
      }

      const res = NextResponse.json({
        userType: 'client',
        redirectTo: '/client/dashboard',
        user: { id: clientUser.id, name: clientUser.name, email: clientUser.email, phone: clientUser.phone },
      });
      res.cookies.set('client_id', clientUser.id, cookieOptions);
      return res;
    }

    // ── 3. Not found in either table ────────────────────────────────────────
    return NextResponse.json(
      { error: 'Email ou mot de passe incorrect' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    );
  }
}
