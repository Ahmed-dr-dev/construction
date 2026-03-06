import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role !== 'comptable' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split('T')[0];
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayISO = firstDayOfMonth.toISOString().split('T')[0];

    // Sales (recettes)
    const { data: sales } = await supabase
      .from('sales')
      .select('id, date, total_amount, status, client:clients(name)')
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: paidSales } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('status', 'paid');
    const { data: unpaidSales } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('status', 'unpaid');
    const { data: thisMonthPaid } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('status', 'paid')
      .gte('date', firstDayISO);

    // Supplier orders (dépenses)
    const { data: supplierOrders } = await supabase
      .from('supplier_orders')
      .select('id, order_date, total_amount, status, supplier:suppliers(name)')
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: deliveredOrders } = await supabase
      .from('supplier_orders')
      .select('total_amount')
      .eq('status', 'delivered');
    const totalRecettes = paidSales?.reduce((s, x) => s + (x.total_amount || 0), 0) || 0;
    const totalEncaissements = totalRecettes;
    const totalARecevoir = unpaidSales?.reduce((s, x) => s + (x.total_amount || 0), 0) || 0;
    const caCeMois = thisMonthPaid?.reduce((s, x) => s + (x.total_amount || 0), 0) || 0;
    const totalDepenses = deliveredOrders?.reduce((s, x) => s + (Number(x.total_amount) || 0), 0) || 0;
    const { data: deliveredThisMonth } = await supabase
      .from('supplier_orders')
      .select('total_amount')
      .eq('status', 'delivered')
      .gte('order_date', firstDayISO);
    const chargesMois = deliveredThisMonth?.reduce((s: number, x: { total_amount?: number }) => s + (Number(x.total_amount) || 0), 0) || 0;

    const { data: clients } = await supabase.from('clients').select('id, unpaid_amount');
    const totalDetteClients = clients?.reduce((s, c) => s + (c.unpaid_amount || 0), 0) || 0;

    const clientName = (s: { client?: { name?: string } | { name?: string }[] }) =>
      Array.isArray(s.client) ? s.client[0]?.name : (s.client as { name?: string })?.name;
    const supplierName = (o: { supplier?: { name?: string } | { name?: string }[] }) =>
      Array.isArray(o.supplier) ? o.supplier[0]?.name : (o.supplier as { name?: string })?.name;

    const recentTransactions = [
      ...(sales || []).slice(0, 10).map((s: any) => ({
        id: s.id,
        type: 'vente',
        date: s.date,
        amount: s.total_amount,
        status: s.status,
        label: `Vente #${String(s.id).slice(0, 8)} - ${clientName(s) || 'Client'}`,
      })),
      ...(supplierOrders || []).slice(0, 10).map((o: any) => ({
        id: o.id,
        type: 'commande_fournisseur',
        date: o.order_date,
        amount: o.total_amount,
        status: o.status,
        label: `Commande fournisseur - ${supplierName(o) || 'Fournisseur'}`,
      })),
    ]
      .filter((t) => t.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 15);

    return NextResponse.json({
      kpis: {
        chiffreAffaires: totalRecettes,
        caCeMois,
        totalEncaissements,
        totalARecevoir,
        totalDetteClients,
        totalDepenses,
        chargesMois,
        nombreVentes: paidSales?.length || 0,
        nombreVentesImpayees: unpaidSales?.length || 0,
      },
      recentTransactions,
      sales: sales || [],
      supplierOrders: supplierOrders || [],
    });
  } catch (error: any) {
    console.error('Comptable dashboard error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error?.message },
      { status: 500 }
    );
  }
}
