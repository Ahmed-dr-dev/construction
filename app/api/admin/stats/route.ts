import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET() {
  try {
    const { user, error } = await requireAuth(PERMISSIONS.users_manage);
    if (error) return error;

    const supabase  = await createClient();
    const todayISO  = new Date().toISOString().split('T')[0];
    const ago30days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // ── Users ─────────────────────────────────────────────────────────────────
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, role, last_login_at, is_active, created_at');

    const users         = allUsers ?? [];
    const totalUsers    = users.length;
    const activeUsers   = users.filter(u => u.last_login_at && u.last_login_at >= ago30days).length;
    const inactiveUsers = users.filter(u => !u.last_login_at || u.last_login_at < ago30days).length;
    const blockedUsers  = users.filter(u => u.is_active === false).length;

    const byRole = users.reduce<Record<string, number>>((acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    }, {});

    // ── Activity logs ─────────────────────────────────────────────────────────
    const { data: logs } = await supabase
      .from('activity_logs')
      .select('id, action, created_at');

    const allLogs       = logs ?? [];
    const todayLogs     = allLogs.filter(l => l.created_at?.startsWith(todayISO));
    const loginsToday   = todayLogs.filter(l => l.action === 'login').length;

    const ago7days      = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recent7       = allLogs.filter(l => l.created_at >= ago7days);
    const creates       = recent7.filter(l => l.action === 'create').length;
    const updates       = recent7.filter(l => l.action === 'update').length;
    const deletes       = recent7.filter(l => l.action === 'delete').length;
    const totalActivity = creates + updates + deletes;

    // Activity by day (last 7 days)
    const activityByDay: Record<string, { create: number; update: number; delete: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      activityByDay[d.toISOString().split('T')[0]] = { create: 0, update: 0, delete: 0 };
    }
    recent7.forEach(l => {
      const day = l.created_at?.split('T')[0];
      if (day && activityByDay[day] && ['create','update','delete'].includes(l.action)) {
        (activityByDay[day] as any)[l.action]++;
      }
    });

    const activityChart = Object.entries(activityByDay).map(([date, counts]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      ...counts,
    }));

    // ── Recent logs (last 15) ─────────────────────────────────────────────────
    const { data: recentLogs } = await supabase
      .from('activity_logs')
      .select(`id, action, entity_type, details, created_at, user:users(full_name, role)`)
      .order('created_at', { ascending: false })
      .limit(15);

    return NextResponse.json({
      users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers, blocked: blockedUsers, byRole },
      security: { loginsToday },
      activity: { creates, updates, deletes, total: totalActivity, chart: activityChart },
      recentLogs: recentLogs ?? [],
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
