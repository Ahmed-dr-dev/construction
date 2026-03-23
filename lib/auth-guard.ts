import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { type UserRole } from '@/lib/rbac';

export interface AuthUser {
  id: string;
  role: UserRole;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  if (!userId) return null;

  const supabase = await createClient();
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', userId)
    .single();

  if (!user) return null;
  return { id: user.id, role: user.role as UserRole };
}

export function unauthenticated() {
  return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: 'Accès refusé - permissions insuffisantes' }, { status: 403 });
}

export async function requireAuth(allowedRoles?: UserRole[]) {
  const user = await getAuthUser();
  if (!user) return { user: null, error: unauthenticated() };
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { user: null, error: forbidden() };
  }
  return { user, error: null };
}
