import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';

function escapeIlike(s: string) {
  return s.replace(/[%_\\]/g, '\\$&').slice(0, 120);
}

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(PERMISSIONS.users_manage);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const limit       = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '25', 10), 1), 100);
    const offset      = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0);
    const action      = searchParams.get('action')?.trim() || null;
    const entityType  = searchParams.get('entity_type')?.trim() || null;
    const qRaw        = searchParams.get('q')?.trim() || '';
    const withSummary = searchParams.get('summary') !== '0';

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scopeFilters = (q: any) => {
      let x = q;
      if (entityType) x = x.eq('entity_type', entityType);
      if (qRaw) x = x.ilike('details', `%${escapeIlike(qRaw)}%`);
      return x;
    };

    let listQuery = scopeFilters(
      supabase.from('activity_logs').select(
        `
        id,
        action,
        entity_type,
        entity_id,
        details,
        created_at,
        user:users(id, full_name, email, role)
      `,
        { count: 'exact' }
      )
    );
    if (action) listQuery = listQuery.eq('action', action);
    listQuery = listQuery.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error: dbError, count } = await listQuery;
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

    let summary: Record<string, number> | undefined;
    if (withSummary) {
      const actions = ['login', 'create', 'update', 'delete', 'logout'] as const;

      const headScoped = (act?: string) => {
        let q = supabase.from('activity_logs').select('*', { count: 'exact', head: true });
        q = scopeFilters(q);
        if (act) q = q.eq('action', act);
        return q;
      };

      const [allRes, ...byAction] = await Promise.all([
        headScoped(),
        ...actions.map((a) => headScoped(a)),
      ]);

      summary = {
        all: allRes.count ?? 0,
        ...Object.fromEntries(actions.map((a, i) => [a, byAction[i].count ?? 0])) as Record<
          (typeof actions)[number],
          number
        >,
      };
    }

    return NextResponse.json({
      logs: data ?? [],
      total: count ?? 0,
      limit,
      offset,
      summary,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { action, entity_type, entity_id, details } = await request.json();
    if (!action) return NextResponse.json({ error: 'action requis' }, { status: 400 });

    const supabase = await createClient();
    await supabase.from('activity_logs').insert({
      user_id: user!.id,
      action,
      entity_type: entity_type ?? null,
      entity_id:   entity_id   ?? null,
      details:     details     ?? null,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
