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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // --- Sales by day (last 30 days) ---
    const startDay = new Date(today);
    startDay.setDate(startDay.getDate() - 30);
    const startDayISO = startDay.toISOString().split('T')[0];
    const { data: salesLast30 } = await supabase
      .from('sales')
      .select('date, total_amount, status')
      .gte('date', startDayISO);

    const salesByDay: Record<string, number> = {};
    for (let d = 0; d <= 30; d++) {
      const dte = new Date(today);
      dte.setDate(dte.getDate() - (30 - d));
      salesByDay[dte.toISOString().split('T')[0]] = 0;
    }
    salesLast30?.forEach((s) => {
      if (s.status === 'paid' || s.status === 'Payé') {
        const key = s.date;
        if (salesByDay[key] !== undefined) salesByDay[key] += s.total_amount || 0;
      }
    });
    const salesByDayArray = Object.entries(salesByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 }));

    // --- Sales by month (last 12 months) ---
    const salesByMonth: { month: string; total: number }[] = [];
    for (let m = 11; m >= 0; m--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      const startISO = monthStart.toISOString().split('T')[0];
      const endISO = monthEnd.toISOString().split('T')[0];
      const { data: monthSales } = await supabase
        .from('sales')
        .select('total_amount, status')
        .gte('date', startISO)
        .lte('date', endISO);
      const total = monthSales?.filter((s) => s.status === 'paid' || s.status === 'Payé')
        .reduce((sum, s) => sum + (s.total_amount || 0), 0) ?? 0;
      salesByMonth.push({
        month: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        total: Math.round(total * 100) / 100,
      });
    }

    // --- Top products (sold quantities, last 90 days, paid sales only) ---
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyISO = ninetyDaysAgo.toISOString().split('T')[0];
    const { data: salesInPeriod } = await supabase
      .from('sales')
      .select('id')
      .in('status', ['paid', 'Payé'])
      .gte('date', ninetyISO);
    const paidIds = new Set((salesInPeriod || []).map((s) => s.id));
    const { data: itemsWithSale } = await supabase
      .from('sale_items')
      .select('product_id, quantity, sale_id');
    const qtyByProduct: Record<string, number> = {};
    itemsWithSale?.forEach((item) => {
      if (paidIds.has(item.sale_id)) {
        qtyByProduct[item.product_id] = (qtyByProduct[item.product_id] || 0) + (item.quantity || 0);
      }
    });
    const { data: allProducts } = await supabase.from('products').select('id, name, unit');
    const topProducts = Object.entries(qtyByProduct)
      .map(([product_id, quantity]) => {
        const p = allProducts?.find((x) => x.id === product_id);
        return { product_id, name: p?.name || 'Produit', unit: p?.unit || '', quantity };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // --- Stock evolution: current stock per product (no history in DB, so "état actuel") ---
    const { data: productsStock } = await supabase
      .from('products')
      .select('id, name, stock, min_stock, unit')
      .order('stock', { ascending: true });
    const stockEvolution = (productsStock || []).slice(0, 15).map((p) => ({
      name: p.name?.slice(0, 20) || p.id.slice(0, 8),
      stock: p.stock,
      min_stock: p.min_stock,
      status: p.stock === 0 ? 'Rupture' : p.stock <= p.min_stock ? 'Stock faible' : 'Disponible',
    }));

    // --- KPIs ---
    const { data: paidSales } = await supabase
      .from('sales')
      .select('id, total_amount')
      .in('status', ['paid', 'Payé']);
    const revenue = paidSales?.reduce((s, x) => s + (x.total_amount || 0), 0) ?? 0;
    const salesCount = paidSales?.length ?? 0;

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const { data: clientsWithSales } = await supabase
      .from('sales')
      .select('client_id')
      .gte('date', startOfMonth);
    const activeClientsSet = new Set((clientsWithSales || []).map((s) => s.client_id).filter(Boolean));
    const activeClients = activeClientsSet.size;

    const { data: allSalesForTotal } = await supabase.from('sales').select('total_amount, status');
    const totalRevenue = allSalesForTotal?.filter((s) => s.status === 'paid' || s.status === 'Payé')
      .reduce((s, x) => s + (x.total_amount || 0), 0) ?? 0;

    return NextResponse.json({
      salesByDay: salesByDayArray,
      salesByMonth,
      topProducts,
      stockEvolution,
      kpis: {
        chiffreAffaires: Math.round(totalRevenue * 100) / 100,
        nombreVentes: salesCount,
        clientsActifsCeMois: activeClients,
        caCeMois: Math.round(
          (salesByMonth[salesByMonth.length - 1]?.total ?? 0) * 100
        ) / 100,
      },
    });
  } catch (error: unknown) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: (error as Error)?.message },
      { status: 500 }
    );
  }
}
